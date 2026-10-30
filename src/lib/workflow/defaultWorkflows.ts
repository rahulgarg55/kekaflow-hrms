import { WorkflowDefinition } from './types';

export const DEFAULT_TENANT_ID = 'tenant-novahr-001';

export const SEED_WORKFLOW_DEFINITIONS: WorkflowDefinition[] = [
  // 1. LEAVE APPROVAL WORKFLOW
  {
    id: 'wf-def-leave-001',
    tenantId: DEFAULT_TENANT_ID,
    code: 'LEAVE_APPROVAL',
    name: 'Leave Approval Workflow (Tiered SLA)',
    description: 'Auto-routes casual leaves <= 2 days to Reporting Manager; leaves > 2 days require Department Head sign-off.',
    version: 1,
    isActive: true,
    validationStatus: 'VALID',
    createdBy: 'emp-006', // Arjun Singhania (Director of People)
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
    nodes: [
      {
        id: 'node-trigger',
        type: 'TRIGGER',
        label: 'Leave Request Submitted',
        data: { triggerEvent: 'LEAVE_REQUEST' },
        position: { x: 250, y: 50 },
      },
      {
        id: 'node-cond-short',
        type: 'CONDITION',
        label: 'Duration <= 2 Days?',
        data: { conditionExpression: 'request.days <= 2' },
        position: { x: 250, y: 160 },
      },
      {
        id: 'node-appr-mgr',
        type: 'APPROVAL',
        label: 'Reporting Manager Review',
        data: {
          approverRule: { type: 'REPORTING_MANAGER' },
          slaPolicy: { timeoutHours: 24, autoAction: 'ESCALATE_TO_SKIP_LEVEL' },
          allowDelegation: true,
        },
        position: { x: 120, y: 280 },
      },
      {
        id: 'node-appr-dept',
        type: 'APPROVAL',
        label: 'Department Head Endorsement',
        data: {
          approverRule: { type: 'DEPARTMENT_HEAD' },
          slaPolicy: { timeoutHours: 48, autoAction: 'AUTO_APPROVE' },
        },
        position: { x: 380, y: 280 },
      },
      {
        id: 'node-notif-success',
        type: 'NOTIFICATION',
        label: 'Notify Employee & Calendar Sync',
        data: {
          channels: ['SLACK', 'EMAIL'],
          recipientRule: 'INITIATOR',
          templateTitle: 'Leave Request Approved',
        },
        position: { x: 250, y: 400 },
      },
      {
        id: 'node-end-approved',
        type: 'END',
        label: 'Leave Granted',
        data: { endStatus: 'COMPLETED' },
        position: { x: 250, y: 500 },
      },
    ],
    edges: [
      { id: 'e1', source: 'node-trigger', target: 'node-cond-short' },
      { id: 'e2', source: 'node-cond-short', target: 'node-appr-mgr', sourceHandle: 'true', label: 'true' },
      { id: 'e3', source: 'node-cond-short', target: 'node-appr-dept', sourceHandle: 'false', label: 'false' },
      { id: 'e4', source: 'node-appr-mgr', target: 'node-notif-success' },
      { id: 'e5', source: 'node-appr-dept', target: 'node-notif-success' },
      { id: 'e6', source: 'node-notif-success', target: 'node-end-approved' },
    ],
  },

  // 2. JOB REQUISITION WORKFLOW
  {
    id: 'wf-def-req-002',
    tenantId: DEFAULT_TENANT_ID,
    code: 'JOB_REQUISITION',
    name: 'Headcount Requisition & Budget Approval',
    description: 'Requires Department Head approval. Requisitions with CTC > 20 LPA automatically invoke Finance Head review.',
    version: 1,
    isActive: true,
    validationStatus: 'VALID',
    createdBy: 'emp-002',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
    nodes: [
      {
        id: 'n-req-trig',
        type: 'TRIGGER',
        label: 'Hiring Requisition Raised',
        data: { triggerEvent: 'JOB_REQUISITION' },
      },
      {
        id: 'n-req-dept',
        type: 'APPROVAL',
        label: 'Department Head Approval',
        data: { approverRule: { type: 'DEPARTMENT_HEAD' } },
      },
      {
        id: 'n-req-budget-check',
        type: 'CONDITION',
        label: 'Budget > 20 LPA?',
        data: { conditionExpression: 'requisition.budget_max_inr > 2000000' },
      },
      {
        id: 'n-req-fin',
        type: 'APPROVAL',
        label: 'Finance Head Sign-Off',
        data: { approverRule: { type: 'FINANCE_HEAD' } },
      },
      {
        id: 'n-req-action-publish',
        type: 'ACTION',
        label: 'Auto-Provision Job Posting',
        data: { actionEndpoint: '/api/v1/ats/jobs/auto-create' },
      },
      {
        id: 'n-req-end',
        type: 'END',
        label: 'Requisition Open & Sourcing Active',
        data: { endStatus: 'COMPLETED' },
      },
    ],
    edges: [
      { id: 'er1', source: 'n-req-trig', target: 'n-req-dept' },
      { id: 'er2', source: 'n-req-dept', target: 'n-req-budget-check' },
      { id: 'er3', source: 'n-req-budget-check', target: 'n-req-fin', sourceHandle: 'true', label: 'true' },
      { id: 'er4', source: 'n-req-budget-check', target: 'n-req-action-publish', sourceHandle: 'false', label: 'false' },
      { id: 'er5', source: 'n-req-fin', target: 'n-req-action-publish' },
      { id: 'er6', source: 'n-req-action-publish', target: 'n-req-end' },
    ],
  },

  // 3. ATTENDANCE REGULARIZATION WORKFLOW
  {
    id: 'wf-def-att-003',
    tenantId: DEFAULT_TENANT_ID,
    code: 'ATTENDANCE_REGULARIZATION',
    name: 'Biometric & Attendance Regularization Exception',
    description: 'Processes punch corrections and highway traffic waivers with automated shift adjustment.',
    version: 1,
    isActive: true,
    validationStatus: 'VALID',
    createdBy: 'emp-007',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
    nodes: [
      {
        id: 'n-att-trig',
        type: 'TRIGGER',
        label: 'Regularization Requested',
        data: { triggerEvent: 'ATTENDANCE_REG' },
      },
      {
        id: 'n-att-appr',
        type: 'APPROVAL',
        label: 'Reporting Manager Review',
        data: { approverRule: { type: 'REPORTING_MANAGER' } },
      },
      {
        id: 'n-att-action',
        type: 'ACTION',
        label: 'Recalculate Hours & Waive Late Mark',
        data: { actionEndpoint: '/api/v1/attendance/recalculate' },
      },
      {
        id: 'n-att-end',
        type: 'END',
        label: 'Punch Regularized',
        data: { endStatus: 'COMPLETED' },
      },
    ],
    edges: [
      { id: 'ea1', source: 'n-att-trig', target: 'n-att-appr' },
      { id: 'ea2', source: 'n-att-appr', target: 'n-att-action' },
      { id: 'ea3', source: 'n-att-action', target: 'n-att-end' },
    ],
  },
];
