import { NextResponse } from 'next/server';
import { attendanceStore, DEFAULT_SHIFTS } from '@/lib/attendance/attendanceStore';

export async function GET() {
  try {
    const teamStatus = attendanceStore.getTeamLiveStatus();

    const summary = {
      total: teamStatus.length,
      clockedIn: teamStatus.filter((t) => t.currentStatus === 'CLOCKED_IN').length,
      onDutyClientVisit: teamStatus.filter((t) => t.currentStatus === 'ON_DUTY').length,
      clockedOut: teamStatus.filter((t) => t.currentStatus === 'CLOCKED_OUT').length,
      notYetIn: teamStatus.filter((t) => t.currentStatus === 'NOT_YET_IN').length,
      lateArrivals: teamStatus.filter((t) => t.isLate).length,
      anomalies: teamStatus.filter((t) => t.anomalyDetected).length,
    };

    return NextResponse.json({
      success: true,
      summary,
      shifts: DEFAULT_SHIFTS,
      data: teamStatus,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
