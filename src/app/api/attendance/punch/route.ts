import { NextRequest, NextResponse } from 'next/server';
import { attendanceStore, DEFAULT_GEOFENCES } from '@/lib/attendance/attendanceStore';
import { VerificationMethod, GeoCoordinate, NetworkContext, PunchType } from '@/lib/attendance/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tenantId = 'tenant_nova_default',
      employeeId,
      employeeName,
      punchType = 'IN',
      deviceTimestamp = new Date().toISOString(),
      verificationMethod = 'GEO',
      geo,
      network,
      selfieUrl,
      livenessScore,
      deviceId = 'device_unknown',
      clientSequenceNumber = 1,
      notes,
      clientVisitName,
    } = body;

    if (!employeeId || !employeeName) {
      return NextResponse.json(
        { success: false, error: 'employeeId and employeeName are required fields' },
        { status: 400 }
      );
    }

    const result = attendanceStore.registerPunch({
      tenantId,
      employeeId,
      employeeName,
      punchType: punchType as PunchType,
      deviceTimestamp,
      verificationMethod: verificationMethod as VerificationMethod,
      geo: geo as GeoCoordinate | undefined,
      network: network as NetworkContext | undefined,
      selfieUrl,
      livenessScore,
      deviceId,
      clientSequenceNumber,
      syncStatus: 'REALTIME',
      notes,
      clientVisitName,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          punch: result.punch,
          verification: {
            verified: result.verification.verified,
            distanceMeters: result.verification.distanceMeters,
            inRadius: result.verification.inRadius,
            reasons: result.verification.reasons,
          },
          anomalyReport: {
            isSuspicious: result.anomalies.isSuspicious,
            riskScore: result.anomalies.riskScore,
            flags: result.anomalies.flags,
          },
        },
      },
      { status: 201 }
    );
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
    const employeeId = searchParams.get('employeeId') || undefined;

    const punches = attendanceStore.getPunches(employeeId);
    return NextResponse.json({
      success: true,
      count: punches.length,
      data: punches,
      geofences: DEFAULT_GEOFENCES,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
