// NovaHR // Generic State Machine Workflow Engine
// Powers Approvals, Requisitions, Offers, Leaves, and Attendance Regularizations

import crypto from 'crypto';
import {
  WorkflowDefinition,
  WorkflowInstance,
  WorkflowNode,
  WorkflowEdge,
  WorkflowStepExecution,
  OutOfAppApprovalPayload,
  ApproverRule,
} from './types';
import { ExpressionEvaluator } from './expressionParser';
import { GraphValidator } from './graphValidator';

const WORKFLOW_SECRET = process.env.WORKFLOW_HMAC_SECRET || 'novahr-enterprise-workflow-secret-2026';

export class WorkflowEngine {
  private static definitions = new Map<string, WorkflowDefinition>();
  private static instances = new Map<string, WorkflowInstance>();

  // -------------------------------------------------------------
  // Workflow Definition Management
  // -------------------------------------------------------------
  static registerDefinition(definition: WorkflowDefinition): { success: boolean; errors?: string[] } {
    const validation = GraphValidator.validate(definition.nodes, definition.edges);
    if (!validation.isValid) {
      definition.validationStatus = 'HAS_ERRORS';
      definition.validationErrors = validation.errors;
      return { success: false, errors: validation.errors };
    }

    definition.validationStatus = 'VALID';
    this.definitions.set(definition.id, definition);
    this.definitions.set(`${definition.code}_v${definition.version}`, definition);
    return { success: true };
  }

  static getDefinition(idOrCode: string, version?: number): WorkflowDefinition | undefined {
    if (version) {
      return this.definitions.get(`${idOrCode}_v${version}`);
    }
    return this.definitions.get(idOrCode);
  }

  static listDefinitions(tenantId: string): WorkflowDefinition[] {
    const list: WorkflowDefinition[] = [];
    const seen = new Set<string>();
    for (const def of this.definitions.values()) {
      if (def.tenantId === tenantId && !seen.has(def.id)) {
        list.push(def);
        seen.add(def.id);
      }
    }
    return list;
  }

  // -------------------------------------------------------------
  // Workflow Instance Lifecycle & Execution
  // -------------------------------------------------------------
  static startInstance(params: {
    tenantId: string;
    workflowCode: string;
    entityType: string;
    entityId: string;
    initiatorId: string;
    contextData: Record<string, unknown>;
  }): WorkflowInstance {
    // Find active version of definition
    let def: WorkflowDefinition | undefined;
    for (const d of this.definitions.values()) {
      if (d.tenantId === params.tenantId && d.code === params.workflowCode && d.isActive) {
        def = d;
        break;
      }
    }

    if (!def) {
      throw new Error(`Active workflow definition not found for code '${params.workflowCode}' in tenant '${params.tenantId}'`);
    }

    const triggerNode = def.nodes.find((n) => n.type === 'TRIGGER');
    if (!triggerNode) {
      throw new Error(`Invalid workflow '${def.code}': missing TRIGGER node`);
    }

    const instanceId = `wfi-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const instance: WorkflowInstance = {
      id: instanceId,
      tenantId: params.tenantId,
      workflowDefinitionId: def.id,
      workflowVersion: def.version,
      initiatorId: params.initiatorId,
      entityType: params.entityType,
      entityId: params.entityId,
      currentNodeId: triggerNode.id,
      status: 'RUNNING',
      contextData: { ...params.contextData },
      stepHistory: [],
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.instances.set(instance.id, instance);

    // Progress from Trigger to next node
    this.progressInstance(instance, def, triggerNode.id);

    return instance;
  }

  static getInstance(instanceId: string): WorkflowInstance | undefined {
    return this.instances.get(instanceId);
  }

  static listInstances(tenantId: string, filter?: { status?: string; entityType?: string }): WorkflowInstance[] {
    const list: WorkflowInstance[] = [];
    for (const inst of this.instances.values()) {
      if (inst.tenantId === tenantId) {
        if (filter?.status && inst.status !== filter.status) continue;
        if (filter?.entityType && inst.entityType !== filter.entityType) continue;
        list.push(inst);
      }
    }
    return list.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  // -------------------------------------------------------------
  // Step Actions (Approve, Reject, Send-Back, Delegate)
  // -------------------------------------------------------------
  static executeAction(params: {
    tenantId: string;
    instanceId: string;
    stepId: string;
    action: 'APPROVE' | 'REJECT' | 'SEND_BACK' | 'DELEGATE';
    actorId: string;
    note?: string;
    delegateToId?: string;
  }): { success: boolean; instance: WorkflowInstance; message: string } {
    const instance = this.instances.get(params.instanceId);
    if (!instance || instance.tenantId !== params.tenantId) {
      throw new Error(`Workflow instance '${params.instanceId}' not found`);
    }

    if (instance.status !== 'WAITING_APPROVAL' && instance.status !== 'RUNNING') {
      throw new Error(`Instance is in state '${instance.status}'; no further approval actions can be taken.`);
    }

    const step = instance.stepHistory.find((s) => s.id === params.stepId);
    if (!step) {
      throw new Error(`Step execution '${params.stepId}' not found in instance '${params.instanceId}'`);
    }

    if (step.status !== 'PENDING') {
      throw new Error(`Step '${params.stepId}' has already been processed with status '${step.status}'`);
    }

    const def = this.definitions.get(instance.workflowDefinitionId);
    if (!def) {
      throw new Error(`Workflow definition '${instance.workflowDefinitionId}' missing`);
    }

    const now = new Date().toISOString();

    if (params.action === 'DELEGATE') {
      if (!params.delegateToId) {
        throw new Error('Delegation target user ID is required.');
      }
      step.status = 'DELEGATED';
      step.actionTakenBy = params.actorId;
      step.actionNote = `Delegated to user ${params.delegateToId}: ${params.note || ''}`;
      step.executedAt = now;

      // Create new delegated step
      const delegatedStep: WorkflowStepExecution = {
        id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tenantId: instance.tenantId,
        instanceId: instance.id,
        nodeId: step.nodeId,
        nodeType: step.nodeType,
        assignedToUserId: params.delegateToId,
        status: 'PENDING',
        createdAt: now,
      };
      instance.stepHistory.push(delegatedStep);
      instance.updatedAt = now;
      return { success: true, instance, message: `Step delegated to ${params.delegateToId}` };
    }

    if (params.action === 'REJECT') {
      step.status = 'REJECTED';
      step.actionTakenBy = params.actorId;
      step.actionNote = params.note || 'Rejected by approver';
      step.executedAt = now;

      instance.status = 'REJECTED';
      instance.completedAt = now;
      instance.updatedAt = now;

      return { success: true, instance, message: 'Workflow instance rejected.' };
    }

    if (params.action === 'SEND_BACK') {
      step.status = 'SKIPPED';
      step.actionTakenBy = params.actorId;
      step.actionNote = `Sent back for revision: ${params.note || ''}`;
      step.executedAt = now;

      // Reset to initiator or trigger
      instance.status = 'RUNNING';
      const triggerNode = def.nodes.find((n) => n.type === 'TRIGGER');
      if (triggerNode) {
        this.progressInstance(instance, def, triggerNode.id);
      }
      return { success: true, instance, message: 'Workflow sent back for edits.' };
    }

    // Default: APPROVE
    step.status = 'APPROVED';
    step.actionTakenBy = params.actorId;
    step.actionNote = params.note || 'Approved';
    step.executedAt = now;

    // Progress from current node to next node
    this.progressInstance(instance, def, step.nodeId);

    return { success: true, instance, message: 'Step approved successfully.' };
  }

  // -------------------------------------------------------------
  // Internal Graph Progression State Machine
  // -------------------------------------------------------------
  private static progressInstance(
    instance: WorkflowInstance,
    def: WorkflowDefinition,
    fromNodeId: string
  ): void {
    const nodeMap = new Map<string, WorkflowNode>();
    def.nodes.forEach((n) => nodeMap.set(n.id, n));

    let currentNode: WorkflowNode | undefined = nodeMap.get(fromNodeId);
    if (!currentNode) return;

    while (currentNode) {
      const activeNode: WorkflowNode = currentNode;

      // If we reached an END node
      if (activeNode.type === 'END') {
        instance.currentNodeId = activeNode.id;
        instance.status = activeNode.data.endStatus === 'REJECTED' ? 'REJECTED' : 'COMPLETED';
        instance.completedAt = new Date().toISOString();
        instance.updatedAt = new Date().toISOString();
        break;
      }

      // Find next node(s)
      const outgoingEdges = def.edges.filter((e) => e.source === activeNode.id);
      if (outgoingEdges.length === 0) {
        // Natural termination
        instance.status = 'COMPLETED';
        instance.completedAt = new Date().toISOString();
        break;
      }

      let nextNodeId: string | null = null;

      if (activeNode.type === 'CONDITION') {
        const expr = activeNode.data.conditionExpression || '';
        const evaluated = ExpressionEvaluator.evaluate(expr, instance.contextData);

        // Find edge with matching handle ('true' or 'false')
        const branchHandle = evaluated ? 'true' : 'false';
        const matchingEdge =
          outgoingEdges.find((e) => e.sourceHandle === branchHandle) ||
          outgoingEdges.find((e) => e.label?.toLowerCase() === branchHandle) ||
          outgoingEdges[0];

        nextNodeId = matchingEdge.target;
      } else {
        // Single transition
        nextNodeId = outgoingEdges[0].target;
      }

      const nextNode = nodeMap.get(nextNodeId);
      if (!nextNode) {
        throw new Error(`Target node '${nextNodeId}' missing in graph`);
      }

      instance.currentNodeId = nextNode.id;
      instance.updatedAt = new Date().toISOString();

      if (nextNode.type === 'APPROVAL') {
        // Pause execution and create pending step
        const assignedUserId = this.resolveApprover(nextNode.data.approverRule, instance);
        const stepId = `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

        // Generate out-of-app token
        const token = this.generateOutOfAppToken({
          instanceId: instance.id,
          stepId,
          nodeId: nextNode.id,
          action: 'APPROVE',
          tenantId: instance.tenantId,
          nonce: crypto.randomBytes(8).toString('hex'),
          expiresAt: Date.now() + (nextNode.data.slaPolicy?.timeoutHours || 48) * 3600 * 1000,
        });

        const step: WorkflowStepExecution = {
          id: stepId,
          tenantId: instance.tenantId,
          instanceId: instance.id,
          nodeId: nextNode.id,
          nodeType: 'APPROVAL',
          assignedToUserId: assignedUserId,
          assignedRole: nextNode.data.approverRule?.type,
          status: 'PENDING',
          outOfAppToken: token,
          tokenExpiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
        };

        instance.stepHistory.push(step);
        instance.status = 'WAITING_APPROVAL';
        break; // Stop loop, waiting for human action
      }

      if (nextNode.type === 'ACTION') {
        // Execute automated internal action
        const step: WorkflowStepExecution = {
          id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          tenantId: instance.tenantId,
          instanceId: instance.id,
          nodeId: nextNode.id,
          nodeType: 'ACTION',
          status: 'APPROVED',
          actionTakenBy: 'SYSTEM_AUTOMATION',
          actionNote: `Executed API endpoint: ${nextNode.data.actionEndpoint || 'Internal API Call'}`,
          executedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        instance.stepHistory.push(step);
        currentNode = nextNode;
        continue;
      }

      if (nextNode.type === 'NOTIFICATION') {
        const step: WorkflowStepExecution = {
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          tenantId: instance.tenantId,
          instanceId: instance.id,
          nodeId: nextNode.id,
          nodeType: 'NOTIFICATION',
          status: 'APPROVED',
          actionTakenBy: 'SYSTEM_NOTIFICATION_DISPATCHER',
          actionNote: `Dispatched message to [${(nextNode.data.channels || ['EMAIL']).join(', ')}]`,
          executedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        instance.stepHistory.push(step);
        currentNode = nextNode;
        continue;
      }

      // For condition or trigger, continue in loop
      currentNode = nextNode;
    }
  }

  // -------------------------------------------------------------
  // Dynamic Approver Resolution
  // -------------------------------------------------------------
  private static resolveApprover(rule: ApproverRule | undefined, instance: WorkflowInstance): string {
    if (!rule) return 'emp-manager-default';

    const ctx = instance.contextData;

    switch (rule.type) {
      case 'REPORTING_MANAGER': {
        const emp = ctx.employee as Record<string, unknown> | undefined;
        return (emp?.managerId as string) || 'emp-002'; // default to Priya Sharma (VP)
      }
      case 'SKIP_LEVEL_MANAGER':
        return 'emp-ceo-vikramaditya';
      case 'DEPARTMENT_HEAD': {
        const dept = ctx.department as string;
        if (dept === 'Engineering') return 'emp-002'; // Priya Sharma
        if (dept === 'People & HR') return 'emp-006'; // Arjun Singhania
        return 'emp-002';
      }
      case 'FINANCE_HEAD':
        return 'emp-009'; // Deepak Chopra (Finance Lead)
      case 'HR_PARTNER':
        return 'emp-007'; // Neha Kapoor (HR Operations)
      case 'SPECIFIC_USER':
        return rule.targetId || 'emp-002';
      case 'GROUP_ANY':
      case 'GROUP_ALL':
        return rule.targetGroup?.[0] || 'emp-002';
      case 'RULE_BASED': {
        if (rule.ruleExpression) {
          const isHighValue = ExpressionEvaluator.evaluate(rule.ruleExpression, ctx);
          return isHighValue ? 'emp-009' : 'emp-002'; // Finance vs Manager
        }
        return 'emp-002';
      }
      default:
        return 'emp-002';
    }
  }

  // -------------------------------------------------------------
  // Cryptographic Out-of-App Signed Token (Email / Slack / WhatsApp)
  // -------------------------------------------------------------
  static generateOutOfAppToken(payload: OutOfAppApprovalPayload): string {
    const dataString = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', WORKFLOW_SECRET)
      .update(dataString)
      .digest('base64url');

    return `${dataString}.${signature}`;
  }

  static verifyOutOfAppToken(token: string): OutOfAppApprovalPayload {
    const parts = token.split('.');
    if (parts.length !== 2) {
      throw new Error('Malformed out-of-app approval token');
    }

    const [dataString, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', WORKFLOW_SECRET)
      .update(dataString)
      .digest('base64url');

    if (signature !== expectedSignature) {
      throw new Error('Invalid token signature. Tampering detected.');
    }

    const payload = JSON.parse(Buffer.from(dataString, 'base64url').toString('utf-8')) as OutOfAppApprovalPayload;

    if (Date.now() > payload.expiresAt) {
      throw new Error('Out-of-app approval token has expired.');
    }

    return payload;
  }
}
