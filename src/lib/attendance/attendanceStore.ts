/**
 * NovaHR - Attendance In-Memory Store & Default Config
 * Provides mock/seed geofences, shift policies, punch log, and live team tracking.
 */

import {
  GeofenceZone,
  ShiftPolicy,
  PunchRecord,
  DailyAttendanceRecord,
  TeamLiveStatusItem,
  HolidayItem,
} from './types';
import { verifyPunchLocation } from './geoVerification';
import { AnomalyDetector, RecentPunchContext } from './anomalyDetector';
import { AttendanceRulesEngine } from './rulesEngine';

export const DEFAULT_GEOFENCES: GeofenceZone[] = [
  {
    id: 'geo_gurugram_hq',
    tenantId: 'tenant_nova_default',
    name: 'Cyber City HQ',
    locationName: 'Building 10B, Cyber City, DLF Phase 2, Gurugram, HR 122002',
    latitude: 28.4947,
    longitude: 77.0888,
    radiusMeters: 250, // 250m perimeter
    allowedBssids: ['c4:ad:34:89:12:ef', '00:14:22:01:23:45'],
    allowedIpSubnets: ['192.168.1.0/24', '10.0.4.0/24', '203.0.113.15'],
    strictEnforcement: true,
  },
  {
    id: 'geo_bengaluru_hub',
    tenantId: 'tenant_nova_default',
    name: 'Indiranagar Tech Hub',
    locationName: '100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru, KA 560038',
    latitude: 12.9716,
    longitude: 77.6412,
    radiusMeters: 200,
    allowedBssids: ['b8:27:eb:c3:21:77'],
    allowedIpSubnets: ['192.168.20.0/24', '198.51.100.42'],
    strictEnforcement: true,
  },
];

export const DEFAULT_SHIFTS: ShiftPolicy[] = [
  {
    id: 'shift_general',
    tenantId: 'tenant_nova_default',
    name: 'General Day Shift (09:30 - 18:30)',
    type: 'FIXED',
    startTime: '09:30',
    endTime: '18:30',
    crossesMidnight: false,
    gracePeriodMinutes: 15, // up to 09:45
    halfDayMinHours: 4.5,
    fullDayMinHours: 8.0,
    overtimeThresholdHours: 9.0,
    maxGracePerMonth: 3,
    deductLeaveAfterLateMarks: 3,
  },
  {
    id: 'shift_night',
    tenantId: 'tenant_nova_default',
    name: 'Overnight DevOps Shift (21:00 - 06:00)',
    type: 'FIXED',
    startTime: '21:00',
    endTime: '06:00',
    crossesMidnight: true,
    gracePeriodMinutes: 15,
    halfDayMinHours: 4.5,
    fullDayMinHours: 8.0,
    overtimeThresholdHours: 9.0,
    maxGracePerMonth: 3,
    deductLeaveAfterLateMarks: 3,
  },
  {
    id: 'shift_flex',
    tenantId: 'tenant_nova_default',
    name: 'Product & Design Flex Shift (8h core)',
    type: 'FLEXIBLE',
    startTime: '08:00',
    endTime: '20:00',
    crossesMidnight: false,
    gracePeriodMinutes: 60,
    halfDayMinHours: 4.0,
    fullDayMinHours: 8.0,
    overtimeThresholdHours: 8.5,
    maxGracePerMonth: 5,
    deductLeaveAfterLateMarks: 5,
  },
];

export const DEFAULT_HOLIDAYS_2026: HolidayItem[] = [
  { date: '2026-01-26', name: 'Republic Day', type: 'MANDATORY' },
  { date: '2026-03-04', name: 'Holi', type: 'MANDATORY' },
  { date: '2026-08-15', name: 'Independence Day', type: 'MANDATORY' },
  { date: '2026-10-02', name: 'Mahatma Gandhi Jayanti', type: 'MANDATORY' },
  { date: '2026-10-20', name: 'Dussehra', type: 'MANDATORY' },
  { date: '2026-11-08', name: 'Diwali', type: 'MANDATORY' },
  { date: '2026-12-25', name: 'Christmas', type: 'MANDATORY' },
];

class AttendanceStore {
  private punches: PunchRecord[] = [];
  private dailyRecords: DailyAttendanceRecord[] = [];
  private employees: Array<{ id: string; name: string; department: string; shiftId: string }> = [
    { id: 'emp_001', name: 'Aarav Sharma', department: 'Engineering', shiftId: 'shift_general' },
    { id: 'emp_002', name: 'Priya Patel', department: 'Human Resources', shiftId: 'shift_general' },
    { id: 'emp_003', name: 'Rohan Verma', department: 'Product Design', shiftId: 'shift_flex' },
    { id: 'emp_004', name: 'Neha Gupta', department: 'Marketing', shiftId: 'shift_general' },
    { id: 'emp_005', name: 'Vikram Malhotra', department: 'Sales & BD', shiftId: 'shift_general' },
  ];

  constructor() {
    this.seedPunches();
  }

  private seedPunches() {
    const today = new Date().toISOString().split('T')[0];

    // Seed Aarav: on time punch in at Cyber City
    this.punches.push({
      id: 'punch_seed_01',
      tenantId: 'tenant_nova_default',
      employeeId: 'emp_001',
      employeeName: 'Aarav Sharma',
      punchType: 'IN',
      deviceTimestamp: `${today}T09:25:00.000Z`,
      serverTimestamp: `${today}T09:25:01.000Z`,
      driftSeconds: 1,
      verificationMethod: 'GEO',
      geo: { latitude: 28.4948, longitude: 77.0889, accuracyMeters: 12 },
      network: { clientIp: '192.168.1.45', bssid: 'c4:ad:34:89:12:ef' },
      livenessScore: 0.98,
      deviceId: 'device_pixel_aarav',
      clientSequenceNumber: 1,
      syncStatus: 'REALTIME',
      anomalyFlags: [],
    });

    // Seed Priya: punched in at 09:50 (late by 20 mins)
    this.punches.push({
      id: 'punch_seed_02',
      tenantId: 'tenant_nova_default',
      employeeId: 'emp_002',
      employeeName: 'Priya Patel',
      punchType: 'IN',
      deviceTimestamp: `${today}T09:50:00.000Z`,
      serverTimestamp: `${today}T09:50:02.000Z`,
      driftSeconds: 2,
      verificationMethod: 'SELFIE_LIVENESS',
      geo: { latitude: 28.4946, longitude: 77.0887, accuracyMeters: 15 },
      livenessScore: 0.94,
      deviceId: 'device_iphone_priya',
      clientSequenceNumber: 1,
      syncStatus: 'REALTIME',
      anomalyFlags: [],
    });

    // Seed Rohan: client visit check-in (remote)
    this.punches.push({
      id: 'punch_seed_03',
      tenantId: 'tenant_nova_default',
      employeeId: 'emp_003',
      employeeName: 'Rohan Verma',
      punchType: 'IN',
      deviceTimestamp: `${today}T10:05:00.000Z`,
      serverTimestamp: `${today}T10:05:01.000Z`,
      driftSeconds: 1,
      verificationMethod: 'GEO',
      geo: { latitude: 28.5355, longitude: 77.3910, accuracyMeters: 25 }, // Noida client location
      clientVisitName: 'Acme FinTech Client Office',
      notes: 'Quarterly UX Design Sprint kick-off meeting on-site',
      livenessScore: 0.91,
      deviceId: 'device_galaxy_rohan',
      clientSequenceNumber: 1,
      syncStatus: 'REALTIME',
      anomalyFlags: [],
    });
  }

  public getEmployees() {
    return this.employees;
  }

  public getPunches(employeeId?: string): PunchRecord[] {
    if (employeeId) {
      return this.punches.filter((p) => p.employeeId === employeeId);
    }
    return this.punches;
  }

  public registerPunch(punch: Omit<PunchRecord, 'id' | 'serverTimestamp' | 'driftSeconds' | 'anomalyFlags'>): {
    punch: PunchRecord;
    verification: ReturnType<typeof verifyPunchLocation>;
    anomalies: ReturnType<typeof AnomalyDetector.evaluatePunch>;
  } {
    const serverTimestamp = new Date().toISOString();
    const serverMs = new Date(serverTimestamp).getTime();
    const deviceMs = new Date(punch.deviceTimestamp).getTime();
    const driftSeconds = Math.round((serverMs - deviceMs) / 1000);

    // 1. Geofence Verification
    const zone = DEFAULT_GEOFENCES[0]; // HQ default
    const verification = verifyPunchLocation(punch.geo, punch.network, zone);

    // 2. Anomaly Detection
    const recentPunchesContext: RecentPunchContext[] = this.punches.slice(-50).map((p) => ({
      employeeId: p.employeeId,
      deviceId: p.deviceId,
      timestampMs: new Date(p.deviceTimestamp).getTime(),
      geo: p.geo,
    }));

    const lastPunchForEmployee = [...this.punches]
      .reverse()
      .find((p) => p.employeeId === punch.employeeId);

    const previousEmpContext: RecentPunchContext | undefined = lastPunchForEmployee
      ? {
          employeeId: lastPunchForEmployee.employeeId,
          deviceId: lastPunchForEmployee.deviceId,
          timestampMs: new Date(lastPunchForEmployee.deviceTimestamp).getTime(),
          geo: lastPunchForEmployee.geo,
        }
      : undefined;

    const anomalies = AnomalyDetector.evaluatePunch(
      {
        ...punch,
        serverTimestamp,
      },
      recentPunchesContext,
      previousEmpContext
    );

    const anomalyFlags = [...anomalies.flags];
    if (!verification.verified && !punch.clientVisitName) {
      anomalyFlags.push(...verification.reasons);
    }

    const newPunch: PunchRecord = {
      ...punch,
      id: `punch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      serverTimestamp,
      driftSeconds,
      anomalyFlags,
      syncStatus: anomalies.isSuspicious ? 'FLAGGED_ANOMALY' : 'REALTIME',
    };

    this.punches.push(newPunch);

    return {
      punch: newPunch,
      verification,
      anomalies,
    };
  }

  public syncOfflinePunches(
    offlineBatch: Array<Omit<PunchRecord, 'id' | 'serverTimestamp' | 'driftSeconds' | 'anomalyFlags'>>
  ): { synced: PunchRecord[]; flagged: PunchRecord[] } {
    const synced: PunchRecord[] = [];
    const flagged: PunchRecord[] = [];

    // Sort by sequence number
    const sorted = [...offlineBatch].sort(
      (a, b) => a.clientSequenceNumber - b.clientSequenceNumber
    );

    for (const item of sorted) {
      const res = this.registerPunch({
        ...item,
        syncStatus: 'OFFLINE_SYNCED',
      });

      if (res.anomalies.isSuspicious) {
        flagged.push(res.punch);
      } else {
        synced.push(res.punch);
      }
    }

    return { synced, flagged };
  }

  public getTeamLiveStatus(): TeamLiveStatusItem[] {
    const today = new Date().toISOString().split('T')[0];
    const defaultShift = DEFAULT_SHIFTS[0];

    return this.employees.map((emp) => {
      const empPunchesToday = this.punches
        .filter(
          (p) =>
            p.employeeId === emp.id &&
            p.deviceTimestamp.startsWith(today)
        )
        .sort((a, b) => new Date(a.deviceTimestamp).getTime() - new Date(b.deviceTimestamp).getTime());

      const inPunch = empPunchesToday.find((p) => p.punchType === 'IN');
      const outPunch = [...empPunchesToday].reverse().find((p) => p.punchType === 'OUT');

      let currentStatus: TeamLiveStatusItem['currentStatus'] = 'NOT_YET_IN';
      let isLate = false;
      let lateMinutes = 0;
      let location: string | undefined;

      if (inPunch && !outPunch) {
        currentStatus = inPunch.clientVisitName ? 'ON_DUTY' : 'CLOCKED_IN';
        location = inPunch.clientVisitName || 'Cyber City HQ';

        const punchInTime = new Date(inPunch.deviceTimestamp);
        const shiftStartMins = AttendanceRulesEngine.timeToMinutes(defaultShift.startTime);
        const punchInMins = punchInTime.getHours() * 60 + punchInTime.getMinutes();

        if (punchInMins > shiftStartMins + defaultShift.gracePeriodMinutes) {
          isLate = true;
          lateMinutes = punchInMins - shiftStartMins;
        }
      } else if (inPunch && outPunch) {
        currentStatus = 'CLOCKED_OUT';
      }

      const hasAnomalies = empPunchesToday.some((p) => p.anomalyFlags.length > 0);

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        shiftName: defaultShift.name,
        currentStatus,
        punchInTime: inPunch?.deviceTimestamp,
        punchOutTime: outPunch?.deviceTimestamp,
        location,
        isLate,
        lateMinutes,
        anomalyDetected: hasAnomalies,
      };
    });
  }
}

export const attendanceStore = new AttendanceStore();
