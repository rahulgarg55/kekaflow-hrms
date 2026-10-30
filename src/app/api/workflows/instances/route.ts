import { NextRequest, NextResponse } from 'next/server';
import { WorkflowEngine } from '@/lib/workflow/engine';
import { DEFAULT_TENANT_ID } from '@/lib/workflow/defaultWorkflows';

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || DEFAULT_TENANT_ID;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const entityType = searchParams.get('entityType') || undefined;

    const instances = WorkflowEngine.listInstances(tenantId, { status, entityType });
    return NextResponse.json({ success: true, count: instances.length, data: instances });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to query instances';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || DEFAULT_TENANT_ID;
    const body = await req.json();

    if (!body.workflowCode || !body.entityType || !body.entityId || !body.initiatorId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: workflowCode, entityType, entityId, initiatorId' },
        { status: 400 }
      );
    }

    const instance = WorkflowEngine.startInstance({
      tenantId,
      workflowCode: body.workflowCode,
      entityType: body.entityType,
      entityId: body.entityId,
      initiatorId: body.initiatorId,
      contextData: body.contextData || {},
    });

    return NextResponse.json({ success: true, message: 'Workflow instance started', data: instance }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to start instance';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
