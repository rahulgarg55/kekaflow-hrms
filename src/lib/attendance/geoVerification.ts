/**
 * NovaHR - Geofencing & Location Verification Service
 * Haversine formula, mock-location heuristic analysis, Wi-Fi BSSID and IP matching.
 */

import { GeoCoordinate, GeofenceZone, NetworkContext } from './types';

const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculates great-circle distance between two GPS coordinates using the Haversine formula.
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const rLat1 = (lat1 * Math.PI) / 180;
  const rLat2 = (lat2 * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(rLat1) * Math.cos(rLat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_METERS * c * 100) / 100;
}

export interface VerificationResult {
  verified: boolean;
  distanceMeters: number;
  inRadius: boolean;
  bssidMatch: boolean;
  ipMatch: boolean;
  isMocked: boolean;
  reasons: string[];
}

/**
 * Detects whether GPS coordinates exhibit signatures of fake/mock GPS providers.
 */
export function detectMockLocation(
  geo: GeoCoordinate,
  previousGeo?: { geo: GeoCoordinate; timestampMs: number },
  currentTimestampMs?: number
): { isMocked: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // 1. Explicit OS-level mock location provider flag (Android mock location / iOS developer mode)
  if (geo.isMocked === true) {
    reasons.push('OS reported mock location provider enabled');
  }

  // 2. Unrealistic precision / zero accuracy
  if (geo.accuracyMeters <= 0.1) {
    reasons.push(`Suspiciously artificial GPS accuracy (${geo.accuracyMeters}m)`);
  }

  // 3. Altitude anomaly: Mock apps frequently set altitude to exactly 0.0 or leave it unvarying
  if (geo.altitudeMeters === 0.0 && geo.accuracyMeters < 5) {
    reasons.push('Artificial flatline altitude (0.0m) with high horizontal accuracy');
  }

  // 4. Impossible instantaneous jump from previous location
  if (previousGeo && currentTimestampMs) {
    const elapsedSeconds = Math.max(1, (currentTimestampMs - previousGeo.timestampMs) / 1000);
    const distMeters = calculateHaversineDistanceMeters(
      previousGeo.geo.latitude,
      previousGeo.geo.longitude,
      geo.latitude,
      geo.longitude
    );
    const speedKmh = (distMeters / elapsedSeconds) * 3.6;

    // Speeds above 900 km/h (commercial aircraft) indicate teleportation
    if (speedKmh > 900) {
      reasons.push(
        `Impossible velocity jump: ${Math.round(speedKmh)} km/h over ${Math.round(distMeters)}m in ${Math.round(elapsedSeconds)}s`
      );
    }
  }

  return {
    isMocked: reasons.length > 0,
    reasons,
  };
}

/**
 * Checks if a client IP address matches an allowed subnet or exact address.
 */
export function matchesIpAddress(clientIp?: string, allowedSubnets: string[] = []): boolean {
  if (!clientIp || allowedSubnets.length === 0) return false;
  const cleanClient = clientIp.trim();

  return allowedSubnets.some((allowed) => {
    const cleanAllowed = allowed.trim();
    if (cleanAllowed === '*' || cleanAllowed === '0.0.0.0/0') return true;
    if (cleanClient === cleanAllowed) return true;

    // Simple CIDR /24 or /16 matching for corporate office subnets
    if (cleanAllowed.endsWith('/24')) {
      const prefix = cleanAllowed.split('.').slice(0, 3).join('.');
      return cleanClient.startsWith(prefix + '.');
    }
    if (cleanAllowed.endsWith('/16')) {
      const prefix = cleanAllowed.split('.').slice(0, 2).join('.');
      return cleanClient.startsWith(prefix + '.');
    }
    return false;
  });
}

/**
 * Performs full verification of an attendance punch against a geofence zone.
 */
export function verifyPunchLocation(
  geo: GeoCoordinate | undefined,
  network: NetworkContext | undefined,
  zone: GeofenceZone,
  previousGeoContext?: { geo: GeoCoordinate; timestampMs: number; currentTimestampMs: number }
): VerificationResult {
  const reasons: string[] = [];
  let distanceMeters = -1;
  let inRadius = false;
  let isMocked = false;

  // Evaluate GPS if provided
  if (geo) {
    distanceMeters = calculateHaversineDistanceMeters(
      geo.latitude,
      geo.longitude,
      zone.latitude,
      zone.longitude
    );

    inRadius = distanceMeters <= zone.radiusMeters;
    if (!inRadius) {
      reasons.push(`Outside geofence: ${Math.round(distanceMeters)}m from ${zone.name} (limit: ${zone.radiusMeters}m)`);
    }

    const mockCheck = detectMockLocation(
      geo,
      previousGeoContext ? { geo: previousGeoContext.geo, timestampMs: previousGeoContext.timestampMs } : undefined,
      previousGeoContext?.currentTimestampMs
    );

    if (mockCheck.isMocked) {
      isMocked = true;
      reasons.push(...mockCheck.reasons);
    }
  } else {
    reasons.push('No GPS coordinates provided');
  }

  // Evaluate Wi-Fi BSSID
  let bssidMatch = false;
  if (network?.bssid && zone.allowedBssids.length > 0) {
    const normalizedBssid = network.bssid.toLowerCase().replace(/[:-]/g, '');
    bssidMatch = zone.allowedBssids.some(
      (b) => b.toLowerCase().replace(/[:-]/g, '') === normalizedBssid
    );
    if (!bssidMatch) {
      reasons.push(`Wi-Fi BSSID (${network.bssid}) not in authorized office AP list`);
    }
  }

  // Evaluate Corporate IP
  const ipMatch = matchesIpAddress(network?.clientIp, zone.allowedIpSubnets);
  if (network?.clientIp && zone.allowedIpSubnets.length > 0 && !ipMatch) {
    reasons.push(`Client IP (${network.clientIp}) not in permitted office subnets`);
  }

  // Verification decision:
  // If strict enforcement is active, GPS must be in-radius and not mocked.
  // Corporate Wi-Fi or office IP can serve as positive confirmation or fallback.
  let verified = false;
  if (!isMocked) {
    if (inRadius) {
      verified = true;
    } else if (bssidMatch || ipMatch) {
      // Allowed if connected directly to verified corporate network
      verified = true;
      reasons.push('Verified via Corporate Network (Wi-Fi BSSID / IP Anchor)');
    }
  }

  return {
    verified,
    distanceMeters,
    inRadius,
    bssidMatch,
    ipMatch,
    isMocked,
    reasons,
  };
}
