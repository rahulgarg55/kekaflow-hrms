import { NextRequest, NextResponse } from 'next/server';
import { WorkflowEngine } from '@/lib/workflow/engine';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const overrideAction = searchParams.get('action') as 'APPROVE' | 'REJECT' | null;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Missing signed approval token' }, { status: 400 });
    }

    const payload = WorkflowEngine.verifyOutOfAppToken(token);
    const actionToTake = overrideAction || payload.action;

    const result = WorkflowEngine.executeAction({
      tenantId: payload.tenantId,
      instanceId: payload.instanceId,
      stepId: payload.stepId,
      action: actionToTake,
      actorId: 'OUT_OF_APP_CHANNEL_USER',
      note: `Action taken via external signed link channel (${actionToTake})`,
    });

    return NextResponse.json({
      success: true,
      message: `Out-of-app request successfully processed: ${actionToTake}`,
      details: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid or expired token';
    return NextResponse.json({ success: false, error: message }, { status: 403 });
  }
}
