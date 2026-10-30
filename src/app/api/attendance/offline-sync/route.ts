import { NextRequest, NextResponse } from 'next/server';
import { attendanceStore } from '@/lib/attendance/attendanceStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { batch } = body;

    if (!Array.isArray(batch) || batch.length === 0) {
      return NextResponse.json(
        { success: false, error: 'batch must be a non-empty array of offline punches' },
        { status: 400 }
      );
    }

    const { synced, flagged } = attendanceStore.syncOfflinePunches(batch);

    return NextResponse.json({
      success: true,
      data: {
        totalReceived: batch.length,
        syncedCount: synced.length,
        flaggedCount: flagged.length,
        synced,
        flagged,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
