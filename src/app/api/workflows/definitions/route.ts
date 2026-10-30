import { NextRequest, NextResponse } from 'next/server';
import { WorkflowEngine } from '@/lib/workflow/engine';
import { DEFAULT_TENANT_ID, SEED_WORKFLOW_DEFINITIONS } from '@/lib/workflow/defaultWorkflows';
import { WorkflowDefinition } from '@/lib/workflow/types';

// Ensure seed workflows are loaded in engine
SEED_WORKFLOW_DEFINITIONS.forEach((def) => {
  if (!WorkflowEngine.getDefinition(def.id)) {
    WorkflowEngine.registerDefinition(def);
  }
});

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || DEFAULT_TENANT_ID;
    const definitions = WorkflowEngine.listDefinitions(tenantId);
    return NextResponse.json({ success: true, count: definitions.length, data: definitions });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to list workflow definitions';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || DEFAULT_TENANT_ID;
    const body = await req.json();

    const newDef: WorkflowDefinition = {
      id: body.id || `wf-def-${Date.now()}`,
      tenantId,
      code: body.code,
      name: body.name,
      description: body.description || '',
      version: body.version || 1,
      isActive: body.isActive ?? true,
      nodes: body.nodes || [],
      edges: body.edges || [],
      validationStatus: 'VALID',
      createdBy: body.createdBy || 'user-admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const res = WorkflowEngine.registerDefinition(newDef);
    if (!res.success) {
      return NextResponse.json(
        { success: false, error: 'Workflow Graph Validation Failed', details: res.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Workflow definition saved and validated', data: newDef }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
