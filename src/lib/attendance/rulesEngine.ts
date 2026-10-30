/**
 * NovaHR - Shift Rules & Attendance Evaluation Engine
 * Handles fixed/flexible/rotational shifts, grace periods, midnight crossings,
 * half-day/full-day thresholds, overtime, and biometric de-duplication.
 */

import {
  ShiftPolicy,
  PunchRecord,
  DailyAttendanceRecord,
  HolidayItem,
  BiometricDevicePunch,
  AttendanceDayStatus,
} from './types';

export class AttendanceRulesEngine {
  /**
   * Parses time string 'HH:MM' into minutes from 00:00.
   */
  static timeToMinutes(timeStr: string): number {
    const [hh, mm] = timeStr.split(':').map((x) => parseInt(x, 10));
    return (hh || 0) * 60 + (mm || 0);
  }

  /**
   * Evaluates a day's punches against a shift policy.
   */
  static evaluateDay(params: {
    tenantId: string;
    employeeId: string;
    employeeName: string;
    date: string; // YYYY-MM-DD
    shift: ShiftPolicy;
    punches: PunchRecord[];
    holidays?: HolidayItem[];
    isWeekend?: boolean;
    approvedLeaveType?: string;
  }): DailyAttendanceRecord {
    const { tenantId, employeeId, employeeName, date, shift, punches, holidays = [], isWeekend = false, approvedLeaveType } = params;

    // Check if the date is a declared holiday
    const matchingHoliday = holidays.find((h) => h.date === date);
    if (matchingHoliday) {
      return {
        id: `att_${employeeId}_${date}`,
        tenantId,
        employeeId,
        employeeName,
        date,
        shiftId: shift.id,
        shiftName: shift.name,
        totalWorkMinutes: 0,
        totalWorkHours: 0,
        status: 'HOLIDAY',
        isLate: false,
        lateMinutes: 0,
        isEarlyExit: false,
        earlyExitMinutes: 0,
        overtimeHours: 0,
        regularizationStatus: 'NONE',
        anomalyFlags: [],
        punches: [],
      };
    }

    // Check if employee has an approved leave on this date
    if (approvedLeaveType) {
      return {
        id: `att_${employeeId}_${date}`,
        tenantId,
        employeeId,
        employeeName,
        date,
        shiftId: shift.id,
        shiftName: shift.name,
        totalWorkMinutes: 0,
        totalWorkHours: 0,
        status: 'LEAVE',
        isLate: false,
        lateMinutes: 0,
        isEarlyExit: false,
        earlyExitMinutes: 0,
        overtimeHours: 0,
        regularizationStatus: 'NONE',
        anomalyFlags: [],
        punches: [],
      };
    }

    // Check if this date is a regular weekend with no punches
    if (isWeekend && punches.length === 0) {
      return {
        id: `att_${employeeId}_${date}`,
        tenantId,
        employeeId,
        employeeName,
        date,
        shiftId: shift.id,
        shiftName: shift.name,
        totalWorkMinutes: 0,
        totalWorkHours: 0,
        status: 'WEEKEND',
        isLate: false,
        lateMinutes: 0,
        isEarlyExit: false,
        earlyExitMinutes: 0,
        overtimeHours: 0,
        regularizationStatus: 'NONE',
        anomalyFlags: [],
        punches: [],
      };
    }

    // If no punches recorded on a workday, mark ABSENT
    if (punches.length === 0) {
      return {
        id: `att_${employeeId}_${date}`,
        tenantId,
        employeeId,
        employeeName,
        date,
        shiftId: shift.id,
        shiftName: shift.name,
        totalWorkMinutes: 0,
        totalWorkHours: 0,
        status: 'ABSENT',
        isLate: false,
        lateMinutes: 0,
        isEarlyExit: false,
        earlyExitMinutes: 0,
        overtimeHours: 0,
        regularizationStatus: 'NONE',
        anomalyFlags: ['NO_PUNCH_RECORDED'],
        punches: [],
      };
    }

    // Sort punches chronologically by deviceTimestamp
    const sortedPunches = [...punches].sort(
      (a, b) => new Date(a.deviceTimestamp).getTime() - new Date(b.deviceTimestamp).getTime()
    );

    const firstInPunch = sortedPunches.find((p) => p.punchType === 'IN') || sortedPunches[0];
    const lastOutPunch =
      [...sortedPunches].reverse().find((p) => p.punchType === 'OUT') ||
      (sortedPunches.length > 1 ? sortedPunches[sortedPunches.length - 1] : undefined);

    const firstInDate = new Date(firstInPunch.deviceTimestamp);
    const lastOutDate = lastOutPunch ? new Date(lastOutPunch.deviceTimestamp) : firstInDate;

    // Calculate total work duration in minutes
    let totalWorkMinutes = 0;
    if (lastOutPunch && lastOutDate.getTime() > firstInDate.getTime()) {
      totalWorkMinutes = Math.round((lastOutDate.getTime() - firstInDate.getTime()) / (1000 * 60));
    }

    const totalWorkHours = Math.round((totalWorkMinutes / 60) * 100) / 100;

    // Collect all anomaly flags across all punches
    const allAnomalyFlags = Array.from(
      new Set(sortedPunches.flatMap((p) => p.anomalyFlags))
    );

    // Evaluate Late Mark based on Shift Policy
    let isLate = false;
    let lateMinutes = 0;
    let isEarlyExit = false;
    let earlyExitMinutes = 0;

    if (shift.type === 'FIXED') {
      const shiftStartMins = this.timeToMinutes(shift.startTime);
      const shiftEndMins = this.timeToMinutes(shift.endTime);

      const punchInMins = firstInDate.getHours() * 60 + firstInDate.getMinutes();

      // Grace period calculation
      const allowedArrivalLimit = shiftStartMins + shift.gracePeriodMinutes;
      if (punchInMins > allowedArrivalLimit) {
        isLate = true;
        lateMinutes = punchInMins - shiftStartMins;
      }

      // Early exit calculation
      if (lastOutPunch && !shift.crossesMidnight) {
        const punchOutMins = lastOutDate.getHours() * 60 + lastOutDate.getMinutes();
        if (punchOutMins < shiftEndMins) {
          isEarlyExit = true;
          earlyExitMinutes = shiftEndMins - punchOutMins;
        }
      }
    }

    // Evaluate Status based on Hours worked
    let status: AttendanceDayStatus = 'PRESENT';
    if (totalWorkHours < shift.halfDayMinHours) {
      status = 'ABSENT';
    } else if (totalWorkHours < shift.fullDayMinHours) {
      status = 'HALF_DAY';
    } else {
      status = 'PRESENT';
    }

    // Overtime calculation
    let overtimeHours = 0;
    if (totalWorkHours > shift.overtimeThresholdHours) {
      overtimeHours = Math.round((totalWorkHours - shift.overtimeThresholdHours) * 100) / 100;
    }

    return {
      id: `att_${employeeId}_${date}`,
      tenantId,
      employeeId,
      employeeName,
      date,
      shiftId: shift.id,
      shiftName: shift.name,
      firstPunchIn: firstInPunch.deviceTimestamp,
      lastPunchOut: lastOutPunch?.deviceTimestamp,
      totalWorkMinutes,
      totalWorkHours,
      status,
      isLate,
      lateMinutes,
      isEarlyExit,
      earlyExitMinutes,
      overtimeHours,
      regularizationStatus: 'NONE',
      anomalyFlags: allAnomalyFlags,
      punches: sortedPunches,
    };
  }

  /**
   * Normalizes and de-duplicates raw biometric device punches,
   * dropping duplicate reads within 60 seconds from the same employee code.
   */
  static deduplicateBiometricPunches(
    rawPunches: BiometricDevicePunch[]
  ): BiometricDevicePunch[] {
    const sorted = [...rawPunches].sort(
      (a, b) => new Date(a.punchTimestamp).getTime() - new Date(b.punchTimestamp).getTime()
    );

    const deduped: BiometricDevicePunch[] = [];

    for (const punch of sorted) {
      const punchTime = new Date(punch.punchTimestamp).getTime();
      const isDuplicate = deduped.some((existing) => {
        if (existing.employeeCode !== punch.employeeCode) return false;
        const existingTime = new Date(existing.punchTimestamp).getTime();
        return Math.abs(punchTime - existingTime) < 60000; // 60 seconds
      });

      if (!isDuplicate) {
        deduped.push(punch);
      }
    }

    return deduped;
  }

  /**
   * Merges biometric punches with mobile app punches.
   * Precedence strategy: Earliest IN punch and Latest OUT punch across sources.
   */
  static mergeBiometricAndMobilePunches(
    mobilePunches: PunchRecord[],
    biometricPunches: BiometricDevicePunch[],
    tenantId: string,
    employeeId: string,
    employeeName: string
  ): PunchRecord[] {
    const convertedBiometric: PunchRecord[] = biometricPunches.map((b, idx) => ({
      id: `bio_${b.deviceId}_${b.employeeCode}_${idx}`,
      tenantId,
      employeeId,
      employeeName,
      punchType: b.punchType || 'IN',
      deviceTimestamp: b.punchTimestamp,
      serverTimestamp: new Date().toISOString(),
      driftSeconds: 0,
      verificationMethod: 'BIOMETRIC_DEVICE',
      deviceId: b.deviceId,
      clientSequenceNumber: idx + 1,
      syncStatus: 'REALTIME',
      anomalyFlags: [],
      notes: `Ingested via ${b.deviceType} (${b.authMode})`,
    }));

    const all = [...mobilePunches, ...convertedBiometric];
    return all.sort(
      (a, b) => new Date(a.deviceTimestamp).getTime() - new Date(b.deviceTimestamp).getTime()
    );
  }
}
