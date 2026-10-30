/**
 * NovaHR - Mobile-First Attendance & Time Tracking Types
 * Row-level multi-tenant, DPDP Act 2023 compliant, Biometric-ready.
 */

export type PunchType = 'IN' | 'OUT';

export type VerificationMethod =
  | 'GEO'
  | 'SELFIE_LIVENESS'
  | 'WIFI_IP'
  | 'QR_CODE'
  | 'BIOMETRIC_DEVICE'
  | 'OFFLINE_SYNC';

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  altitudeMeters?: number;
  isMocked?: boolean;
}

export interface NetworkContext {
  bssid?: string;
  ssid?: string;
  clientIp?: string;
}

export interface GeofenceZone {
  id: string;
  tenantId: string;
  name: string;
  locationName: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  allowedBssids: string[];
  allowedIpSubnets: string[];
  strictEnforcement: boolean;
}

export interface PunchRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;
  punchType: PunchType;
  deviceTimestamp: string;    // ISO timestamp from employee device
  serverTimestamp: string;    // ISO timestamp from server arrival
  driftSeconds: number;       // Difference between device and server clock
  verificationMethod: VerificationMethod;
  geo?: GeoCoordinate;
  network?: NetworkContext;
  selfieUrl?: string;
  livenessScore?: number;     // 0.0 to 1.0 (>= 0.70 pass)
  deviceId: string;
  clientSequenceNumber: number; // Monotonic sequence for offline queue integrity
  syncStatus: 'REALTIME' | 'OFFLINE_SYNCED' | 'FLAGGED_ANOMALY';
  anomalyFlags: string[];
  notes?: string;
  clientVisitName?: string;
}

export type ShiftType = 'FIXED' | 'FLEXIBLE' | 'ROTATIONAL';

export interface ShiftPolicy {
  id: string;
  tenantId: string;
  name: string;
  type: ShiftType;
  startTime: string;            // '09:30' (HH:MM in 24h)
  endTime: string;              // '18:30'
  crossesMidnight: boolean;     // e.g. Night shift '21:00' to '06:00'
  gracePeriodMinutes: number;   // e.g. 15 mins (up to 09:45 is on time)
  halfDayMinHours: number;      // e.g. 4.5 hours
  fullDayMinHours: number;      // e.g. 8.0 hours
  overtimeThresholdHours: number; // e.g. 9.0 hours (beyond which OT is accrued)
  maxGracePerMonth: number;     // e.g. 3 grace days per month allowed
  deductLeaveAfterLateMarks: number; // e.g. every 3 late marks = 0.5 day LOP / Casual Leave
}

export interface HolidayItem {
  date: string; // YYYY-MM-DD
  name: string;
  type: 'MANDATORY' | 'OPTIONAL_RESTRICTED';
  locationIds?: string[]; // Applicable locations, empty = all
}

export type AttendanceDayStatus =
  | 'PRESENT'
  | 'HALF_DAY'
  | 'ABSENT'
  | 'ON_DUTY'
  | 'LEAVE'
  | 'HOLIDAY'
  | 'WEEKEND';

export interface DailyAttendanceRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  shiftId: string;
  shiftName: string;
  firstPunchIn?: string;
  lastPunchOut?: string;
  totalWorkMinutes: number;
  totalWorkHours: number;
  status: AttendanceDayStatus;
  isLate: boolean;
  lateMinutes: number;
  isEarlyExit: boolean;
  earlyExitMinutes: number;
  overtimeHours: number;
  regularizationId?: string;
  regularizationStatus: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  anomalyFlags: string[];
  punches: PunchRecord[];
}

export interface BiometricDevicePunch {
  deviceId: string;
  deviceType: 'ZKTeco' | 'eSSL' | 'Matrix' | 'Suprema' | 'GenericApi';
  employeeCode: string;
  punchTimestamp: string; // ISO
  punchType?: PunchType;
  authMode: 'FINGERPRINT' | 'FACE_RECOGNITION' | 'RFID' | 'PIN';
  rawPayload?: Record<string, unknown>;
}

export interface PayrollFinalizedEmployee {
  employeeId: string;
  employeeName: string;
  department: string;
  totalCalendarDays: number;
  presentDays: number;
  halfDays: number;
  approvedLeaveDays: number;
  holidays: number;
  weekends: number;
  lossOfPayDays: number;       // LOP deductions
  overtimeHours: number;
  netPayableDays: number;
  unregularizedDays: number;
}

export interface PayrollCycleLock {
  id: string;
  tenantId: string;
  cycleMonth: string;         // '2026-10'
  startDate: string;          // '2026-10-01'
  endDate: string;            // '2026-10-31'
  cutOffDate: string;         // '2026-10-25'
  lockedAt: string;
  lockedBy: string;
  checksumSha256: string;
  totalEmployees: number;
  totalLopDays: number;
  totalOvertimeHours: number;
  employees: PayrollFinalizedEmployee[];
}

export interface TeamLiveStatusItem {
  employeeId: string;
  employeeName: string;
  department: string;
  avatarUrl?: string;
  shiftName: string;
  currentStatus: 'CLOCKED_IN' | 'NOT_YET_IN' | 'CLOCKED_OUT' | 'ON_LEAVE' | 'WORK_FROM_HOME' | 'ON_DUTY';
  punchInTime?: string;
  punchOutTime?: string;
  location?: string;
  isLate: boolean;
  lateMinutes: number;
  anomalyDetected: boolean;
}
