import { NextRequest, NextResponse } from 'next/server';
import { PayrollFinalizer } from '@/lib/attendance/payrollFinalizer';
import { attendanceStore, DEFAULT_SHIFTS } from '@/lib/attendance/attendanceStore';
import { AttendanceRulesEngine } from '@/lib/attendance/rulesEngine';
import { DailyAttendanceRecord } from '@/lib/attendance/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tenantId = 'tenant_nova_default',
      cycleMonth = '2026-10',
      startDate = '2026-10-01',
      endDate = '2026-10-31',
      cutOffDate = '2026-10-25',
      lockedBy = 'Rahul Garg (HR Operations)',
    } = body;

    const employees = attendanceStore.getEmployees();
    const shift = DEFAULT_SHIFTS[0];

    // Build simulated daily attendance records for the month up to cutoff
    const dailyRecords: DailyAttendanceRecord[] = [];
    const allPunches = attendanceStore.getPunches();

    for (const emp of employees) {
      // Evaluate recorded punches
      const empPunches = allPunches.filter((p) => p.employeeId === emp.id);

      // Check dates
      const uniqueDates = Array.from(new Set(empPunches.map((p) => p.deviceTimestamp.split('T')[0])));

      for (const date of uniqueDates) {
        const dayPunches = empPunches.filter((p) => p.deviceTimestamp.startsWith(date));
        const dayRecord = AttendanceRulesEngine.evaluateDay({
          tenantId,
          employeeId: emp.id,
          employeeName: emp.name,
          date,
          shift,
          punches: dayPunches,
        });
        dailyRecords.push(dayRecord);
      }
    }

    const lockResult = PayrollFinalizer.finalizeCycle({
      tenantId,
      cycleMonth,
      startDate,
      endDate,
      cutOffDate,
      lockedBy,
      employees: employees.map((e) => ({
        id: e.id,
        name: e.name,
        department: e.department,
      })),
      dailyRecords,
    });

    return NextResponse.json({
      success: true,
      message: `Attendance cycle ${cycleMonth} locked successfully for payroll hand-off`,
      data: lockResult,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId') || 'tenant_nova_default';
    const cycleMonth = searchParams.get('cycleMonth');

    if (cycleMonth) {
      const lock = PayrollFinalizer.getLock(tenantId, cycleMonth);
      if (!lock) {
        return NextResponse.json(
          { success: false, error: `No finalized lock found for cycle ${cycleMonth}` },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: lock });
    }

    const locks = PayrollFinalizer.listLocks(tenantId);
    return NextResponse.json({ success: true, count: locks.length, data: locks });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
