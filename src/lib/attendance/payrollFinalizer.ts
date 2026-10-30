/**
 * NovaHR - Attendance Cycle Finalization & Payroll Hand-off Engine
 * Locks attendance data per cycle, computes LOP days and overtime,
 * and produces a tamper-proof cryptographic snapshot for the payroll module.
 */

import crypto from 'crypto';
import {
  DailyAttendanceRecord,
  PayrollCycleLock,
  PayrollFinalizedEmployee,
} from './types';

export interface FinalizeCycleParams {
  tenantId: string;
  cycleMonth: string; // '2026-10'
  startDate: string;  // '2026-10-01'
  endDate: string;    // '2026-10-31'
  cutOffDate: string; // '2026-10-25'
  lockedBy: string;
  employees: Array<{
    id: string;
    name: string;
    department: string;
  }>;
  dailyRecords: DailyAttendanceRecord[];
}

export class PayrollFinalizer {
  private static locks: Map<string, PayrollCycleLock> = new Map();

  /**
   * Finalizes an attendance cycle for payroll calculation.
   */
  static finalizeCycle(params: FinalizeCycleParams): PayrollCycleLock {
    const { tenantId, cycleMonth, startDate, endDate, cutOffDate, lockedBy, employees, dailyRecords } = params;

    // Calculate total calendar days in cycle window
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalCalendarDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const finalizedEmployees: PayrollFinalizedEmployee[] = [];
    let totalOrgLop = 0;
    let totalOrgOt = 0;

    for (const emp of employees) {
      const empRecords = dailyRecords.filter(
        (r) => r.tenantId === tenantId && r.employeeId === emp.id && r.date >= startDate && r.date <= endDate
      );

      let presentDays = 0;
      let halfDays = 0;
      let approvedLeaveDays = 0;
      let holidays = 0;
      let weekends = 0;
      let unregularizedDays = 0;
      let totalOvertimeHours = 0;

      for (const rec of empRecords) {
        totalOvertimeHours += rec.overtimeHours || 0;

        switch (rec.status) {
          case 'PRESENT':
            presentDays += 1;
            break;
          case 'HALF_DAY':
            halfDays += 1;
            if (rec.regularizationStatus !== 'APPROVED') {
              unregularizedDays += 0.5;
            }
            break;
          case 'LEAVE':
            approvedLeaveDays += 1;
            break;
          case 'HOLIDAY':
            holidays += 1;
            break;
          case 'WEEKEND':
            weekends += 1;
            break;
          case 'ABSENT':
            if (rec.regularizationStatus !== 'APPROVED') {
              unregularizedDays += 1;
            } else {
              presentDays += 1; // Converted via approved regularization workflow
            }
            break;
          case 'ON_DUTY':
            presentDays += 1;
            break;
        }
      }

      // Any day without record in the cycle up to cut-off counts as absent if not weekend/holiday
      const recordedDates = new Set(empRecords.map((r) => r.date));
      const cutOff = new Date(cutOffDate);
      const curr = new Date(startDate);

      while (curr <= cutOff) {
        const dateStr = curr.toISOString().split('T')[0];
        const dayOfWeek = curr.getDay(); // 0 is Sunday, 6 is Saturday

        if (!recordedDates.has(dateStr)) {
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            weekends += 1;
          } else {
            // Unrecorded workday -> Absence / LOP
            unregularizedDays += 1;
          }
        }
        curr.setDate(curr.getDate() + 1);
      }

      // Loss of Pay (LOP) calculation:
      // Half-days count as 0.5 LOP unless regularized; full absent days count as 1.0 LOP
      const lossOfPayDays = Math.round(unregularizedDays * 10) / 10;
      const netPayableDays = Math.max(0, Math.round((totalCalendarDays - lossOfPayDays) * 10) / 10);

      totalOrgLop += lossOfPayDays;
      totalOrgOt += totalOvertimeHours;

      finalizedEmployees.push({
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        totalCalendarDays,
        presentDays,
        halfDays,
        approvedLeaveDays,
        holidays,
        weekends,
        lossOfPayDays,
        overtimeHours: Math.round(totalOvertimeHours * 100) / 100,
        netPayableDays,
        unregularizedDays,
      });
    }

    const lockId = `lock_${tenantId}_${cycleMonth}`;
    const payloadForChecksum = JSON.stringify({
      tenantId,
      cycleMonth,
      startDate,
      endDate,
      cutOffDate,
      finalizedEmployees,
    });

    const checksumSha256 = crypto
      .createHash('sha256')
      .update(payloadForChecksum)
      .digest('hex');

    const cycleLock: PayrollCycleLock = {
      id: lockId,
      tenantId,
      cycleMonth,
      startDate,
      endDate,
      cutOffDate,
      lockedAt: new Date().toISOString(),
      lockedBy,
      checksumSha256,
      totalEmployees: finalizedEmployees.length,
      totalLopDays: Math.round(totalOrgLop * 10) / 10,
      totalOvertimeHours: Math.round(totalOrgOt * 100) / 100,
      employees: finalizedEmployees,
    };

    this.locks.set(lockId, cycleLock);
    return cycleLock;
  }

  static getLock(tenantId: string, cycleMonth: string): PayrollCycleLock | undefined {
    return this.locks.get(`lock_${tenantId}_${cycleMonth}`);
  }

  static listLocks(tenantId: string): PayrollCycleLock[] {
    return Array.from(this.locks.values()).filter((l) => l.tenantId === tenantId);
  }
}
