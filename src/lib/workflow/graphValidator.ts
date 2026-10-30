// NovaHR // Graph Topology Validator
// Ensures published workflows have zero dead ends, no unreachable nodes, and valid branching.

import { WorkflowNode, WorkflowEdge } from './types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class GraphValidator {
  static validate(nodes: WorkflowNode[], edges: WorkflowEdge[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!nodes || nodes.length === 0) {
      return { isValid: false, errors: ['Workflow graph must contain at least one node.'], warnings };
    }

    const nodeMap = new Map<string, WorkflowNode>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    // 1. Verify Trigger node presence
    const triggerNodes = nodes.filter((n) => n.type === 'TRIGGER');
    if (triggerNodes.length === 0) {
      errors.push('Workflow must have exactly one TRIGGER node.');
    } else if (triggerNodes.length > 1) {
      errors.push(`Workflow has ${triggerNodes.length} TRIGGER nodes; only 1 is permitted.`);
    }

    // 2. Verify End node presence
    const endNodes = nodes.filter((n) => n.type === 'END');
    if (endNodes.length === 0) {
      errors.push('Workflow must contain at least one terminal END node.');
    }

    // 3. Check edge endpoints integrity
    edges.forEach((edge) => {
      if (!nodeMap.has(edge.source)) {
        errors.push(`Edge references non-existent source node: ${edge.source}`);
      }
      if (!nodeMap.has(edge.target)) {
        errors.push(`Edge references non-existent target node: ${edge.target}`);
      }
    });

    if (errors.length > 0) {
      return { isValid: false, errors, warnings };
    }

    // 4. Adjacency lists for graph traversal
    const outgoing = new Map<string, string[]>();
    const incoming = new Map<string, string[]>();
    nodes.forEach((n) => {
      outgoing.set(n.id, []);
      incoming.set(n.id, []);
    });

    edges.forEach((e) => {
      outgoing.get(e.source)?.push(e.target);
      incoming.get(e.target)?.push(e.source);
    });

    // 5. Dead-end check (non-END nodes must have outgoing edges)
    nodes.forEach((n) => {
      if (n.type !== 'END') {
        const outList = outgoing.get(n.id) || [];
        if (outList.length === 0) {
          errors.push(`Dead-end detected at node '${n.label}' (${n.id}). Non-terminal nodes must have outgoing edges.`);
        }
      }
    });

    // 6. Reachability Check via BFS from TRIGGER
    if (triggerNodes.length === 1) {
      const startId = triggerNodes[0].id;
      const visited = new Set<string>();
      const queue: string[] = [startId];
      visited.add(startId);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        const neighbors = outgoing.get(curr) || [];
        for (const nextId of neighbors) {
          if (!visited.has(nextId)) {
            visited.add(nextId);
            queue.push(nextId);
          }
        }
      }

      nodes.forEach((n) => {
        if (!visited.has(n.id)) {
          errors.push(`Unreachable node detected: '${n.label}' (${n.id}) cannot be reached from TRIGGER.`);
        }
      });
    }

    // 7. Cycle Detection with Tarjan's / DFS traversal
    const visitedState = new Map<string, 'UNVISITED' | 'VISITING' | 'VISITED'>();
    nodes.forEach((n) => visitedState.set(n.id, 'UNVISITED'));

    let hasCycle = false;
    const checkCycle = (nodeId: string) => {
      visitedState.set(nodeId, 'VISITING');
      const neighbors = outgoing.get(nodeId) || [];
      for (const nxt of neighbors) {
        if (visitedState.get(nxt) === 'VISITING') {
          hasCycle = true;
          warnings.push(`Loop detected at transition ${nodeId} -> ${nxt}. Ensure an exit condition is configured to avoid infinite execution.`);
        } else if (visitedState.get(nxt) === 'UNVISITED') {
          checkCycle(nxt);
        }
      }
      visitedState.set(nodeId, 'VISITED');
    };

    if (triggerNodes.length === 1) {
      checkCycle(triggerNodes[0].id);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
