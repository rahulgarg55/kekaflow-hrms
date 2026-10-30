/**
 * NovaHR - Attendance Anomaly Detection Engine
 * Flags suspicious patterns for HR review (never automatically punishes employees).
 * Covers: impossible travel, shared-device buddy punching, clock drift, and selfie liveness.
 */

import { GeoCoordinate, PunchRecord } from './types';
import { calculateHaversineDistanceMeters } from './geoVerification';

export interface AnomalyReport {
  isSuspicious: boolean;
  flags: string[];
  riskScore: number; // 0 (clean) to 100 (high risk)
  details: Record<string, unknown>;
}

export interface RecentPunchContext {
  employeeId: string;
  deviceId: string;
  timestampMs: number;
  geo?: GeoCoordinate;
}

export class AnomalyDetector {
  /**
   * Evaluates a new punch against recent history and system rules.
   */
  static evaluatePunch(
    punch: Partial<PunchRecord> & {
      employeeId: string;
      deviceId: string;
      deviceTimestamp: string;
      serverTimestamp: string;
      geo?: GeoCoordinate;
      livenessScore?: number;
      clientSequenceNumber?: number;
    },
    recentPunchesAcrossOrg: RecentPunchContext[] = [],
    previousPunchForSameEmployee?: RecentPunchContext
  ): AnomalyReport {
    const flags: string[] = [];
    let riskScore = 0;
    const details: Record<string, unknown> = {};

    const serverMs = new Date(punch.serverTimestamp).getTime();
    const deviceMs = new Date(punch.deviceTimestamp).getTime();
    const driftSeconds = Math.abs(Math.round((serverMs - deviceMs) / 1000));

    // 1. Clock Drift Detection (Tampered client time)
    if (driftSeconds > 120) {
      flags.push(`CLOCK_DRIFT_EXCEEDED (${driftSeconds}s difference between client and server)`);
      riskScore += Math.min(30, Math.floor(driftSeconds / 10));
      details.clockDriftSeconds = driftSeconds;
    }

    // 2. Impossible Travel (Speed calculation from previous punch)
    if (previousPunchForSameEmployee && punch.geo && previousPunchForSameEmployee.geo) {
      const elapsedSeconds = Math.max(1, (deviceMs - previousPunchForSameEmployee.timestampMs) / 1000);
      const distanceMeters = calculateHaversineDistanceMeters(
        previousPunchForSameEmployee.geo.latitude,
        previousPunchForSameEmployee.geo.longitude,
        punch.geo.latitude,
        punch.geo.longitude
      );
      const speedKmh = (distanceMeters / elapsedSeconds) * 3.6;

      // Realistic threshold: > 200 km/h unless > 4 hours have passed (domestic flight)
      if (speedKmh > 200 && elapsedSeconds < 7200) {
        flags.push(
          `IMPOSSIBLE_TRAVEL_SPEED (${Math.round(speedKmh)} km/h: moved ${Math.round(distanceMeters / 1000)} km in ${Math.round(elapsedSeconds / 60)} mins)`
        );
        riskScore += 40;
        details.impossibleTravel = {
          speedKmh: Math.round(speedKmh),
          distanceKm: Math.round(distanceMeters / 1000),
          elapsedMinutes: Math.round(elapsedSeconds / 60),
        };
      }
    }

    // 3. Buddy Punching / Device Sharing Detection
    // Check if the same physical device was used by another employee within 15 minutes (900 seconds)
    const deviceSharers = recentPunchesAcrossOrg.filter(
      (p) =>
        p.deviceId === punch.deviceId &&
        p.employeeId !== punch.employeeId &&
        Math.abs(deviceMs - p.timestampMs) < 900000
    );

    if (deviceSharers.length > 0) {
      const otherEmployeeIds = Array.from(new Set(deviceSharers.map((s) => s.employeeId)));
      flags.push(
        `SUSPICIOUS_SHARED_DEVICE (Device ${punch.deviceId} clocked for ${otherEmployeeIds.join(', ')} within 15 mins)`
      );
      riskScore += 35;
      details.sharedDeviceEmployees = otherEmployeeIds;
    }

    // 4. Identical High-Precision GPS Cluster (Mock Location Farm)
    // When multiple users submit exact identical latitude/longitude (down to 6 decimals) within 5 mins
    if (punch.geo) {
      const identicalGpsMatches = recentPunchesAcrossOrg.filter(
        (p) =>
          p.employeeId !== punch.employeeId &&
          p.geo &&
          Math.abs(p.geo.latitude - punch.geo!.latitude) < 0.00001 &&
          Math.abs(p.geo.longitude - punch.geo!.longitude) < 0.00001 &&
          Math.abs(deviceMs - p.timestampMs) < 300000
      );

      if (identicalGpsMatches.length >= 2) {
        flags.push(
          `SUSPICIOUS_COORDINATE_CLUSTERING (${identicalGpsMatches.length} different employees punched at bit-for-bit identical coordinates within 5 mins)`
        );
        riskScore += 30;
        details.identicalGpsCount = identicalGpsMatches.length;
      }
    }

    // 5. Selfie Liveness Failure / Suspected Photo of Photo
    if (punch.livenessScore !== undefined && punch.livenessScore < 0.70) {
      flags.push(
        `LIVENESS_CHECK_FAILED (Confidence score: ${(punch.livenessScore * 100).toFixed(1)}% - threshold is 70%)`
      );
      riskScore += 25;
      details.livenessScore = punch.livenessScore;
    }

    // 6. Mock Provider Flag from OS
    if (punch.geo?.isMocked) {
      flags.push('MOCK_GPS_PROVIDER_DETECTED (Operating system reported mock location provider enabled)');
      riskScore += 45;
    }

    const clampedRiskScore = Math.min(100, riskScore);

    return {
      isSuspicious: flags.length > 0,
      flags,
      riskScore: clampedRiskScore,
      details,
    };
  }
}
