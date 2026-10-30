import { NextRequest, NextResponse } from 'next/server';
import { WorkflowEngine } from '@/lib/workflow/engine';
import { DEFAULT_TENANT_ID } from '@/lib/workflow/defaultWorkflows';

export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || DEFAULT_TENANT_ID;
    const body = await req.json();

    if (!body.instanceId || !body.stepId || !body.action || !body.actorId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: instanceId, stepId, action, actorId' },
        { status: 400 }
      );
    }

    const result = WorkflowEngine.executeAction({
      tenantId,
      instanceId: body.instanceId,
      stepId: body.stepId,
      action: body.action,
      actorId: body.actorId,
      note: body.note,
      delegateToId: body.delegateToId,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Action execution failed';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
