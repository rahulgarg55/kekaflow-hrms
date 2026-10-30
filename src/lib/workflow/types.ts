// NovaHR // Generic Workflow Builder Core Type Definitions

export type WorkflowNodeType =
  | 'TRIGGER'
  | 'CONDITION'
  | 'APPROVAL'
  | 'ACTION'
  | 'NOTIFICATION'
  | 'WAIT'
  | 'PARALLEL_FORK'
  | 'JOIN'
  | 'END';

export type ApproverRuleType =
  | 'REPORTING_MANAGER'
  | 'SKIP_LEVEL_MANAGER'
  | 'DEPARTMENT_HEAD'
  | 'HR_PARTNER'
  | 'FINANCE_HEAD'
  | 'SPECIFIC_USER'
  | 'SPECIFIC_ROLE'
  | 'GROUP_ANY'
  | 'GROUP_ALL'
  | 'RULE_BASED';

export interface ApproverRule {
  type: ApproverRuleType;
  targetId?: string; // userId or roleName
  targetGroup?: string[]; // userIds for GROUP_ANY / GROUP_ALL
  ruleExpression?: string; // e.g. "if context.amount > 50000 then 'emp-finance-head'"
}

export interface SlaPolicy {
  timeoutHours: number;
  autoAction: 'AUTO_APPROVE' | 'AUTO_REJECT' | 'ESCALATE_TO_SKIP_LEVEL' | 'ESCALATE_TO_HR';
  reminderIntervalHours?: number;
}

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  label: string;
  description?: string;
  position?: { x: number; y: number };
  data: {
    // TRIGGER data
    triggerEvent?: 'LEAVE_REQUEST' | 'ATTENDANCE_REG' | 'JOB_REQUISITION' | 'JOB_OFFER' | 'EXPENSE_CLAIM';
    
    // CONDITION data
    conditionExpression?: string; // e.g. "request.days > 3 AND request.leave_type == 'SICK'"
    
    // APPROVAL data
    approverRule?: ApproverRule;
    slaPolicy?: SlaPolicy;
    allowDelegation?: boolean;
    requireSignature?: boolean;
    
    // ACTION data
    actionEndpoint?: string; // internal API endpoint to invoke
    actionMethod?: 'POST' | 'PUT' | 'PATCH';
    actionPayloadTemplate?: Record<string, unknown>;
    
    // NOTIFICATION data
    channels?: Array<'EMAIL' | 'SLACK' | 'WHATSAPP' | 'TEAMS'>;
    recipientRule?: 'INITIATOR' | 'CURRENT_APPROVER' | 'MANAGER' | 'ALL_PARTICIPANTS';
    templateTitle?: string;
    templateBody?: string;
    
    // WAIT data
    waitDurationHours?: number;
    
    // END data
    endStatus?: 'COMPLETED' | 'REJECTED' | 'CANCELLED';
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: 'true' | 'false' | 'default';
  label?: string;
  conditionExpression?: string;
}

export interface WorkflowDefinition {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description: string;
  version: number;
  isActive: boolean;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  validationStatus: 'VALID' | 'HAS_ERRORS';
  validationErrors?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type WorkflowInstanceStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'WAITING_APPROVAL'
  | 'ESCALATED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'TIMED_OUT'
  | 'CANCELLED'
  | 'FAILED';

export interface WorkflowStepExecution {
  id: string;
  tenantId: string;
  instanceId: string;
  nodeId: string;
  nodeType: WorkflowNodeType;
  assignedToUserId?: string;
  assignedRole?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED' | 'DELEGATED' | 'AUTO_TIMEOUT';
  actionTakenBy?: string;
  actionNote?: string;
  slaDueAt?: string;
  outOfAppToken?: string;
  tokenExpiresAt?: string;
  executedAt?: string;
  createdAt: string;
}

export interface WorkflowInstance {
  id: string;
  tenantId: string;
  workflowDefinitionId: string;
  workflowVersion: number;
  initiatorId: string;
  entityType: string;
  entityId: string;
  currentNodeId: string;
  status: WorkflowInstanceStatus;
  contextData: Record<string, unknown>;
  stepHistory: WorkflowStepExecution[];
  startedAt: string;
  completedAt?: string;
  updatedAt: string;
}

export interface OutOfAppApprovalPayload {
  instanceId: string;
  stepId: string;
  nodeId: string;
  action: 'APPROVE' | 'REJECT';
  tenantId: string;
  nonce: string;
  expiresAt: number;
}
