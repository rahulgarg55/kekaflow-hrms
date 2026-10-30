import { NextRequest, NextResponse } from 'next/server';
import { WorkflowDefinition, WorkflowNode } from '@/lib/workflow/types';
import { ExpressionEvaluator } from '@/lib/workflow/expressionParser';
import { GraphValidator } from '@/lib/workflow/graphValidator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const definition = body.definition as WorkflowDefinition;
    const contextData = body.contextData || {};

    if (!definition || !definition.nodes || !definition.edges) {
      return NextResponse.json({ success: false, error: 'Definition must contain nodes and edges' }, { status: 400 });
    }

    // 1. Graph validation check
    const validation = GraphValidator.validate(definition.nodes, definition.edges);
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'Graph validation failed',
        details: validation.errors,
      }, { status: 400 });
    }

    // 2. Trace simulation
    const trace: Array<{
      stepNumber: number;
      nodeId: string;
      nodeType: string;
      label: string;
      evaluation?: string;
      resultNote: string;
    }> = [];

    const nodeMap = new Map<string, WorkflowNode>();
    definition.nodes.forEach((n) => nodeMap.set(n.id, n));

    const triggerNode = definition.nodes.find((n) => n.type === 'TRIGGER');
    if (!triggerNode) {
      return NextResponse.json({ success: false, error: 'No TRIGGER node found' }, { status: 400 });
    }

    let currentNode: WorkflowNode | undefined = triggerNode;
    let stepCount = 1;
    const maxSteps = 50; // loop guard

    while (currentNode && stepCount <= maxSteps) {
      if (currentNode.type === 'END') {
        trace.push({
          stepNumber: stepCount++,
          nodeId: currentNode.id,
          nodeType: currentNode.type,
          label: currentNode.label,
          resultNote: `Reached terminal end state: ${currentNode.data.endStatus || 'COMPLETED'}`,
        });
        break;
      }

      const outgoing = definition.edges.filter((e) => e.source === currentNode?.id);
      if (outgoing.length === 0) {
        trace.push({
          stepNumber: stepCount++,
          nodeId: currentNode.id,
          nodeType: currentNode.type,
          label: currentNode.label,
          resultNote: 'No outgoing edge. Reached natural termination.',
        });
        break;
      }

      let nextNodeId: string | null = null;
      let evalNote = '';

      if (currentNode.type === 'CONDITION') {
        const expr = currentNode.data.conditionExpression || '';
        const evaluated = ExpressionEvaluator.evaluate(expr, contextData);
        evalNote = `Evaluated: "${expr}" => ${evaluated}`;

        const branchHandle = evaluated ? 'true' : 'false';
        const matchingEdge =
          outgoing.find((e) => e.sourceHandle === branchHandle) ||
          outgoing.find((e) => e.label?.toLowerCase() === branchHandle) ||
          outgoing[0];

        nextNodeId = matchingEdge.target;
      } else {
        nextNodeId = outgoing[0].target;
        evalNote = `Transitioned via default path to '${nextNodeId}'`;
      }

      trace.push({
        stepNumber: stepCount++,
        nodeId: currentNode.id,
        nodeType: currentNode.type,
        label: currentNode.label,
        evaluation: evalNote,
        resultNote: `Proceeded to node ${nextNodeId}`,
      });

      currentNode = nodeMap.get(nextNodeId);
    }

    return NextResponse.json({
      success: true,
      simulationTrace: trace,
      totalStepsExecuted: trace.length,
      finalState: currentNode?.type === 'END' ? 'TERMINATED_CLEANLY' : 'HALTED',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Simulation failed';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
