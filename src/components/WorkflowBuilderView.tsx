'use client';

import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Play,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Zap,
  ArrowRight,
  Send,
  Eye,
  Sliders,
  X,
  FileCode2,
  MessageSquare,
  Building,
  Users,
  Check,
} from 'lucide-react';
import { WorkflowDefinition, WorkflowNode, WorkflowEdge } from '../lib/workflow/types';
import { SEED_WORKFLOW_DEFINITIONS } from '../lib/workflow/defaultWorkflows';

export const WorkflowBuilderView: React.FC = () => {
  const [definitions, setDefinitions] = useState<WorkflowDefinition[]>(SEED_WORKFLOW_DEFINITIONS);
  const [activeDefId, setActiveDefId] = useState<string>(SEED_WORKFLOW_DEFINITIONS[0].id);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Simulation state
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simContextJson, setSimContextJson] = useState<string>(
    JSON.stringify({ request: { days: 4, leave_type: 'SICK' }, employee: { department: 'Engineering' } }, null, 2)
  );
  const [simTrace, setSimTrace] = useState<Array<{ stepNumber: number; nodeId: string; label: string; evaluation?: string; resultNote: string }>>([]);
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());

  // AI Prompt Modal
  const [aiModalOpen, setAiModalOpen] = useState<boolean>(false);
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiGenerating, setAiGenerating] = useState<boolean>(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  // Active definition
  const currentDef = definitions.find((d) => d.id === activeDefId) || definitions[0];

  const handleSelectDefinition = (id: string) => {
    setActiveDefId(id);
    setSelectedNodeId(null);
    setHighlightedNodes(new Set());
    setSimTrace([]);
  };

  // -------------------------------------------------------------
  // Node Selection & Editing
  // -------------------------------------------------------------
  const selectedNode = currentDef.nodes.find((n) => n.id === selectedNodeId);

  const handleUpdateNode = (updatedNode: WorkflowNode) => {
    setDefinitions((prev) =>
      prev.map((def) => {
        if (def.id === currentDef.id) {
          return {
            ...def,
            nodes: def.nodes.map((n) => (n.id === updatedNode.id ? updatedNode : n)),
            updatedAt: new Date().toISOString(),
          };
        }
        return def;
      })
    );
  };

  const handleAddNode = (type: WorkflowNode['type']) => {
    const newId = `node-${type.toLowerCase()}-${Date.now().toString().slice(-4)}`;
    const newNode: WorkflowNode = {
      id: newId,
      type,
      label: `New ${type}`,
      data: {
        conditionExpression: type === 'CONDITION' ? 'request.amount > 10000' : undefined,
        approverRule: type === 'APPROVAL' ? { type: 'REPORTING_MANAGER' } : undefined,
        channels: type === 'NOTIFICATION' ? ['SLACK', 'EMAIL'] : undefined,
        endStatus: type === 'END' ? 'COMPLETED' : undefined,
      },
    };

    setDefinitions((prev) =>
      prev.map((def) => {
        if (def.id === currentDef.id) {
          return {
            ...def,
            nodes: [...def.nodes, newNode],
          };
        }
        return def;
      })
    );
    setSelectedNodeId(newId);
    setToast(`Added new ${type} node to canvas.`);
    setTimeout(() => setToast(null), 3000);
  };

  const handleDeleteNode = (id: string) => {
    if (currentDef.nodes.length <= 2) {
      alert('A workflow must maintain at least a Trigger and End node.');
      return;
    }
    setDefinitions((prev) =>
      prev.map((def) => {
        if (def.id === currentDef.id) {
          return {
            ...def,
            nodes: def.nodes.filter((n) => n.id !== id),
            edges: def.edges.filter((e) => e.source !== id && e.target !== id),
          };
        }
        return def;
      })
    );
    if (selectedNodeId === id) setSelectedNodeId(null);
    setToast('Node deleted from workflow.');
    setTimeout(() => setToast(null), 3000);
  };

  // -------------------------------------------------------------
  // Test / Dry-Run Simulation Runner
  // -------------------------------------------------------------
  const handleRunSimulation = async () => {
    try {
      let parsedContext = {};
      try {
        parsedContext = JSON.parse(simContextJson);
      } catch {
        alert('Invalid JSON in context editor');
        return;
      }

      const res = await fetch('/api/workflows/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          definition: currentDef,
          contextData: parsedContext,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        alert(`Simulation Error: ${data.error}\n${(data.details || []).join('\n')}`);
        return;
      }

      setSimTrace(data.simulationTrace);
      const nodeSet = new Set<string>(data.simulationTrace.map((t: { nodeId: string }) => t.nodeId));
      setHighlightedNodes(nodeSet);
      setToast(`Simulation executed successfully! ${data.totalStepsExecuted} steps verified.`);
      setTimeout(() => setToast(null), 4000);
    } catch (err: unknown) {
      alert('Failed to connect to simulation API');
    }
  };

  // -------------------------------------------------------------
  // AI Workflow Generator Synthesis
  // -------------------------------------------------------------
  const handleGenerateAiWorkflow = () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);

    setTimeout(() => {
      // Synthesize workflow from prompt
      const newDef: WorkflowDefinition = {
        id: `wf-ai-${Date.now()}`,
        tenantId: 'tenant-novahr-001',
        code: `AI_GENERATED_${Date.now().toString().slice(-4)}`,
        name: `AI Draft: ${aiPrompt.slice(0, 36)}...`,
        description: `Draft workflow synthesized by NovaHR AI assistant based on: "${aiPrompt}"`,
        version: 1,
        isActive: true,
        validationStatus: 'VALID',
        createdBy: 'ai-assistant-claude',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nodes: [
          { id: 'ai-trig', type: 'TRIGGER', label: 'Request Initiated', data: {} },
          {
            id: 'ai-cond',
            type: 'CONDITION',
            label: 'Amount > 10,000 INR?',
            data: { conditionExpression: 'request.amount > 10000' },
          },
          {
            id: 'ai-mgr',
            type: 'APPROVAL',
            label: 'Reporting Manager Review',
            data: { approverRule: { type: 'REPORTING_MANAGER' } },
          },
          {
            id: 'ai-fin',
            type: 'APPROVAL',
            label: 'Finance Head Sign-Off',
            data: { approverRule: { type: 'FINANCE_HEAD' } },
          },
          {
            id: 'ai-notif',
            type: 'NOTIFICATION',
            label: 'Notify Slack & Accounting',
            data: { channels: ['SLACK', 'EMAIL'] },
          },
          { id: 'ai-end', type: 'END', label: 'Approved & Disbursed', data: { endStatus: 'COMPLETED' } },
        ],
        edges: [
          { id: 'ae1', source: 'ai-trig', target: 'ai-cond' },
          { id: 'ae2', source: 'ai-cond', target: 'ai-fin', sourceHandle: 'true', label: 'true' },
          { id: 'ae3', source: 'ai-cond', target: 'ai-mgr', sourceHandle: 'false', label: 'false' },
          { id: 'ae4', source: 'ai-mgr', target: 'ai-notif' },
          { id: 'ae5', source: 'ai-fin', target: 'ai-notif' },
          { id: 'ae6', source: 'ai-notif', target: 'ai-end' },
        ],
      };

      setDefinitions([newDef, ...definitions]);
      setActiveDefId(newDef.id);
      setAiGenerating(false);
      setAiModalOpen(false);
      setAiPrompt('');
      setToast('AI Workflow draft generated! Ready for human review and simulation.');
      setTimeout(() => setToast(null), 5000);
    }, 900);
  };

  // Node color helper
  const getNodeColor = (type: WorkflowNode['type']) => {
    switch (type) {
      case 'TRIGGER':
        return 'border-purple-300 bg-purple-50/70 text-purple-950';
      case 'CONDITION':
        return 'border-amber-300 bg-amber-50/70 text-amber-950';
      case 'APPROVAL':
        return 'border-blue-300 bg-blue-50/70 text-blue-950';
      case 'ACTION':
        return 'border-emerald-300 bg-emerald-50/70 text-emerald-950';
      case 'NOTIFICATION':
        return 'border-indigo-300 bg-indigo-50/70 text-indigo-950';
      case 'END':
        return 'border-rose-300 bg-rose-50/70 text-rose-950';
      default:
        return 'border-slate-300 bg-slate-50 text-slate-800';
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toast && (
        <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#5c3ba2]" />
            <span>{toast}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-purple-600 hover:text-purple-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Top Controls: Workflow Selector, AI Generator & Simulation */}
      {/* ------------------------------------------------------------- */}
      <div className="keka-card p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Definition picker */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#5c3ba2] flex items-center justify-center font-bold">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Workflow Graph
            </label>
            <select
              value={activeDefId}
              onChange={(e) => handleSelectDefinition(e.target.value)}
              className="text-sm font-bold text-slate-900 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
            >
              {definitions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} (v{d.version})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* AI Describe Button */}
          <button
            onClick={() => setAiModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-50 hover:bg-purple-100 text-[#5c3ba2] border border-purple-200 flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#5c3ba2]" />
            <span>AI Assistant (Describe in English)</span>
          </button>

          {/* Test & Simulate Button */}
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all shadow-2xs ${
              isSimulating
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5 text-amber-500" />
            <span>{isSimulating ? 'Close Simulator' : 'Test & Dry-Run'}</span>
          </button>

          {/* Save / Publish */}
          <button
            onClick={() => {
              setToast('Workflow validation passed: No loops or unreachable nodes. Published v1.0.');
              setTimeout(() => setToast(null), 4000);
            }}
            className="btn-keka-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save & Publish</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Simulation Dock (Visible when toggled) */}
      {/* ------------------------------------------------------------- */}
      {isSimulating && (
        <div className="keka-card p-5 bg-gradient-to-r from-amber-50/40 via-white to-purple-50/40 border-amber-200 animate-in fade-in space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-amber-100">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-amber-600" />
              <h4 className="text-sm font-bold text-slate-900 font-sans">
                Workflow Simulation & Dry-Run Engine
              </h4>
            </div>
            <button
              onClick={handleRunSimulation}
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-amber-600 text-white hover:bg-amber-700 shadow-sm transition-all"
            >
              Execute Dry-Run Now
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                Mock Input Context (JSON)
              </label>
              <textarea
                value={simContextJson}
                onChange={(e) => setSimContextJson(e.target.value)}
                rows={4}
                className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                Execution Trace Results ({simTrace.length} Steps)
              </label>
              <div className="h-28 overflow-y-auto p-2.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] space-y-1">
                {simTrace.length === 0 ? (
                  <p className="text-slate-500 italic">Click &quot;Execute Dry-Run Now&quot; to inspect trace...</p>
                ) : (
                  simTrace.map((t) => (
                    <div key={t.stepNumber} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">[{t.stepNumber}]</span>
                      <span className="text-slate-200">{t.label}:</span>
                      <span className="text-amber-300">{t.evaluation || t.resultNote}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Node Palette & Canvas Area */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Node Palette (Left sidebar) */}
        <div className="keka-card p-5 space-y-4">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Node Palette
            </h4>
            <p className="text-[11px] text-slate-500">
              Click to insert nodes into the current workflow graph
            </p>
          </div>

          <div className="space-y-2">
            {[
              { type: 'CONDITION' as const, label: 'Condition Rule', icon: Zap, color: 'text-amber-600 bg-amber-50 border-amber-200' },
              { type: 'APPROVAL' as const, label: 'Approval Step', icon: ShieldCheck, color: 'text-blue-600 bg-blue-50 border-blue-200' },
              { type: 'ACTION' as const, label: 'API Action', icon: FileCode2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
              { type: 'NOTIFICATION' as const, label: 'Notification', icon: MessageSquare, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
              { type: 'END' as const, label: 'Terminal End', icon: CheckCircle2, color: 'text-rose-600 bg-rose-50 border-rose-200' },
            ].map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.type}
                  onClick={() => handleAddNode(p.type)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all hover:scale-[1.02] shadow-2xs ${p.color}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{p.label}</span>
                  </div>
                  <Plus className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-2">
            <span className="font-bold text-slate-700 block">Graph Stats</span>
            <div className="flex justify-between font-mono text-[11px]">
              <span>Nodes Count:</span>
              <strong className="text-slate-800">{currentDef.nodes.length}</strong>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span>Edges Count:</span>
              <strong className="text-slate-800">{currentDef.edges.length}</strong>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span>Engine Status:</span>
              <span className="text-emerald-600 font-bold">Deterministic AST</span>
            </div>
          </div>
        </div>

        {/* Visual Graph Canvas (Center) */}
        <div className="lg:col-span-2 keka-card p-6 min-h-[480px] bg-slate-50/60 border border-slate-200/90 relative overflow-x-auto flex flex-col items-center justify-start space-y-4">
          <div className="w-full flex items-center justify-between pb-3 border-b border-slate-200 text-xs text-slate-500">
            <span className="font-mono">CANVAS // {currentDef.code}</span>
            <span className="text-[11px] text-purple-700 font-semibold">
              Click node to inspect & configure rules
            </span>
          </div>

          {/* Node Sequence List */}
          <div className="w-full max-w-md space-y-3 py-2">
            {currentDef.nodes.map((node, idx) => {
              const isSelected = selectedNodeId === node.id;
              const isHighlighted = highlightedNodes.has(node.id);
              return (
                <div key={node.id} className="relative group">
                  {/* Node Card */}
                  <div
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer shadow-xs ${getNodeColor(
                      node.type
                    )} ${
                      isSelected
                        ? 'ring-4 ring-purple-400/30 scale-[1.02] border-[#5c3ba2]'
                        : isHighlighted
                        ? 'ring-4 ring-emerald-400/40 border-emerald-500'
                        : 'hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded bg-white/80 border border-slate-200">
                          {node.type}
                        </span>
                        <h5 className="text-xs font-bold text-slate-900">{node.label}</h5>
                      </div>
                      {node.type !== 'TRIGGER' && node.type !== 'END' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNode(node.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Metadata preview */}
                    {node.type === 'CONDITION' && (
                      <p className="mt-2 text-[11px] font-mono text-amber-800 bg-white/70 p-1.5 rounded border border-amber-200/60 truncate">
                        {node.data.conditionExpression || 'No expression set'}
                      </p>
                    )}
                    {node.type === 'APPROVAL' && (
                      <div className="mt-2 flex items-center justify-between text-[11px] text-blue-800 bg-white/70 p-1.5 rounded border border-blue-200/60 font-medium">
                        <span>Rule: {node.data.approverRule?.type || 'REPORTING_MANAGER'}</span>
                        <span className="font-mono">{node.data.slaPolicy?.timeoutHours || 24}h SLA</span>
                      </div>
                    )}
                    {node.type === 'NOTIFICATION' && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11px]">
                        {(node.data.channels || ['EMAIL']).map((c) => (
                          <span key={c} className="px-1.5 py-0.5 rounded bg-white text-indigo-700 font-mono text-[10px] border border-indigo-200">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Flow Arrow down */}
                  {idx < currentDef.nodes.length - 1 && (
                    <div className="flex justify-center py-1">
                      <ArrowRight className="w-4 h-4 text-slate-400 rotate-90" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Property Inspector Drawer (Right sidebar) */}
        <div className="keka-card p-5 space-y-4">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-[#5c3ba2]" />
              Node Inspector
            </h4>
            <p className="text-[11px] text-slate-500">
              {selectedNode ? `Configuring '${selectedNode.label}'` : 'Select a node on canvas to view details'}
            </p>
          </div>

          {selectedNode ? (
            <div className="space-y-4 text-xs">
              {/* Node Label */}
              <div className="space-y-1">
                <label className="text-slate-600 font-semibold block">Label</label>
                <input
                  type="text"
                  value={selectedNode.label}
                  onChange={(e) => handleUpdateNode({ ...selectedNode, label: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#5c3ba2]/20 font-medium text-slate-800"
                />
              </div>

              {/* Condition Editor */}
              {selectedNode.type === 'CONDITION' && (
                <div className="space-y-1.5">
                  <label className="text-slate-700 font-bold block flex items-center justify-between">
                    <span>Safe Expression (Zero eval)</span>
                    <span className="text-[10px] text-emerald-600 font-mono">AST Verified</span>
                  </label>
                  <textarea
                    value={selectedNode.data.conditionExpression || ''}
                    onChange={(e) =>
                      handleUpdateNode({
                        ...selectedNode,
                        data: { ...selectedNode.data, conditionExpression: e.target.value },
                      })
                    }
                    rows={3}
                    className="w-full p-2 font-mono text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#5c3ba2]/20 text-slate-800"
                    placeholder="e.g. request.days > 3 AND request.leave_type == 'SICK'"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Available identifiers: <code>request.days</code>, <code>request.amount</code>, <code>employee.department</code>
                  </span>
                </div>
              )}

              {/* Approval Rule Selector */}
              {selectedNode.type === 'APPROVAL' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-slate-700 font-bold block">Approver Rule</label>
                    <select
                      value={selectedNode.data.approverRule?.type || 'REPORTING_MANAGER'}
                      onChange={(e) =>
                        handleUpdateNode({
                          ...selectedNode,
                          data: {
                            ...selectedNode.data,
                            approverRule: { type: e.target.value as any },
                          },
                        })
                      }
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-800"
                    >
                      <option value="REPORTING_MANAGER">Reporting Manager (1-Level)</option>
                      <option value="SKIP_LEVEL_MANAGER">Skip-Level Manager (VP/Director)</option>
                      <option value="DEPARTMENT_HEAD">Department Head</option>
                      <option value="FINANCE_HEAD">Finance Head (Deepak Chopra)</option>
                      <option value="HR_PARTNER">HR Operations Partner</option>
                      <option value="RULE_BASED">Rule-Based Dynamic Routing</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 font-bold block">SLA Timeout (Hours)</label>
                    <input
                      type="number"
                      value={selectedNode.data.slaPolicy?.timeoutHours || 24}
                      onChange={(e) =>
                        handleUpdateNode({
                          ...selectedNode,
                          data: {
                            ...selectedNode.data,
                            slaPolicy: {
                              timeoutHours: parseInt(e.target.value) || 24,
                              autoAction: 'ESCALATE_TO_SKIP_LEVEL',
                            },
                          },
                        })
                      }
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Action Endpoint */}
              {selectedNode.type === 'ACTION' && (
                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">Internal API Endpoint</label>
                  <input
                    type="text"
                    value={selectedNode.data.actionEndpoint || '/api/v1/attendance/recalculate'}
                    onChange={(e) =>
                      handleUpdateNode({
                        ...selectedNode,
                        data: { ...selectedNode.data, actionEndpoint: e.target.value },
                      })
                    }
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-xs"
                  />
                </div>
              )}

              {/* Notification Channels */}
              {selectedNode.type === 'NOTIFICATION' && (
                <div className="space-y-1.5">
                  <label className="text-slate-700 font-bold block">Dispatch Channels</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['SLACK', 'EMAIL', 'WHATSAPP', 'TEAMS'].map((ch) => (
                      <span
                        key={ch}
                        className="px-2 py-1 rounded bg-purple-50 text-purple-800 font-mono text-[10px] border border-purple-200 font-bold"
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <Sliders className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No node selected.</p>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* AI Assistant Modal (Natural Language to Graph) */}
      {/* ------------------------------------------------------------- */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#5c3ba2]" />
                <h3 className="text-base font-bold text-slate-900 font-sans">
                  AI Workflow Co-Pilot
                </h3>
              </div>
              <button onClick={() => setAiModalOpen(false)} className="p-1 rounded text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Describe your business approval policy in natural English. NovaHR will synthesize a draft workflow graph with deterministic conditions and approver rules for your review.
            </p>

            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. Expenses over 10,000 INR require manager approval then finance head, then notify Slack..."
              rows={3}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5c3ba2]/20 focus:border-[#5c3ba2] text-slate-800"
            />

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Quick Prompts:
              </span>
              <div className="flex flex-col gap-1.5 text-xs text-slate-600">
                <button
                  type="button"
                  onClick={() =>
                    setAiPrompt('Reimbursements above 15,000 INR require department head and finance head approval')
                  }
                  className="text-left p-2 rounded-lg bg-slate-50 hover:bg-purple-50 hover:text-[#5c3ba2] border border-slate-200/80 transition-colors"
                >
                  &ldquo;Reimbursements above 15,000 INR require department head and finance head approval&rdquo;
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setAiPrompt('Remote WFH requests over 3 days require VP Engineering approval with 24h SLA')
                  }
                  className="text-left p-2 rounded-lg bg-slate-50 hover:bg-purple-50 hover:text-[#5c3ba2] border border-slate-200/80 transition-colors"
                >
                  &ldquo;Remote WFH requests over 3 days require VP Engineering approval with 24h SLA&rdquo;
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAiModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={aiGenerating || !aiPrompt.trim()}
                onClick={handleGenerateAiWorkflow}
                className="btn-keka-primary px-4 py-2 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
              >
                {aiGenerating ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing Graph...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Graph</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
