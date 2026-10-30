'use client';

import React, { useState } from 'react';
import {
  CheckSquare,
  Check,
  X,
  AlertCircle,
  Clock,
  Calendar,
  Users,
  ShieldCheck,
  Building,
  TrendingUp,
  FileCheck2,
} from 'lucide-react';
import { INITIAL_LEAVE_REQUESTS, EMPLOYEES } from '../data/mockData';
import { LeaveRequest } from '../types/hrms';

interface ApprovalsViewProps {
  onUpdatePendingCount: (count: number) => void;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({ onUpdatePendingCount }) => {
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>(
    INITIAL_LEAVE_REQUESTS.filter((r) => r.status === 'Pending')
  );

  const [regularizations, setRegularizations] = useState([
    {
      id: 'reg-01',
      employeeName: 'Rahul Garg',
      employeeId: 'KEKA-1024',
      date: '2026-10-26 (Monday)',
      systemPunch: '09:42 AM – 07:15 PM (Late by 42m)',
      reason: 'Highway Flyover Traffic Jam at Tribune Chowk',
      status: 'Pending',
    },
    {
      id: 'reg-02',
      employeeName: 'Karan Mehra',
      employeeId: 'KEKA-1065',
      date: '2026-10-27 (Tuesday)',
      systemPunch: 'Missing Out-Punch',
      reason: 'Biometric Machine Glitch during evening mass exit',
      status: 'Pending',
    },
  ]);

  const [toast, setToast] = useState<string | null>(null);

  const handleApproveLeave = (id: string) => {
    const updated = pendingLeaves.filter((r) => r.id !== id);
    setPendingLeaves(updated);
    onUpdatePendingCount(updated.length + regularizations.length);
    setToast('Leave request approved and employee notified via email/SMS.');
    setTimeout(() => setToast(null), 4000);
  };

  const handleRejectLeave = (id: string) => {
    const updated = pendingLeaves.filter((r) => r.id !== id);
    setPendingLeaves(updated);
    onUpdatePendingCount(updated.length + regularizations.length);
    setToast('Leave request rejected with notification sent to applicant.');
    setTimeout(() => setToast(null), 4000);
  };

  const handleApproveRegularization = (id: string) => {
    const updated = regularizations.filter((r) => r.id !== id);
    setRegularizations(updated);
    onUpdatePendingCount(pendingLeaves.length + updated.length);
    setToast('Attendance regularization approved! Late mark waived.');
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#5c3ba2]" />
            <span>{toast}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-purple-600 hover:text-purple-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Top HR Compliance Stats */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="keka-card p-5 border-l-4 border-l-[#5c3ba2]">
          <span className="text-xs font-semibold text-slate-500 block mb-1">
            Total Organization Headcount
          </span>
          <div className="text-2xl font-extrabold font-mono text-slate-900">
            52 Active
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Across 5 Departments
          </span>
        </div>

        <div className="keka-card p-5 border-l-4 border-l-emerald-500">
          <span className="text-xs font-semibold text-slate-500 block mb-1">
            Today's Office Presence
          </span>
          <div className="text-2xl font-extrabold font-mono text-emerald-700">
            94.2%
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            44 in Campus • 5 WFH • 3 on Leave
          </span>
        </div>

        <div className="keka-card p-5 border-l-4 border-l-amber-500">
          <span className="text-xs font-semibold text-slate-500 block mb-1">
            Pending Leave Requests
          </span>
          <div className="text-2xl font-extrabold font-mono text-amber-700">
            {pendingLeaves.length} Awaiting
          </div>
          <span className="text-[11px] text-amber-600 font-semibold mt-1 block">
            Action required by Manager
          </span>
        </div>

        <div className="keka-card p-5 border-l-4 border-l-indigo-500">
          <span className="text-xs font-semibold text-slate-500 block mb-1">
            Pending Regularizations
          </span>
          <div className="text-2xl font-extrabold font-mono text-indigo-700">
            {regularizations.length} Awaiting
          </div>
          <span className="text-[11px] text-indigo-600 font-semibold mt-1 block">
            Biometric & Punch Reviews
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Pending Leave Requests Approvals Queue */}
      {/* ------------------------------------------------------------- */}
      <div className="keka-card p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#5c3ba2]" />
            <h3 className="text-base font-bold text-slate-900 font-sans">
              Leave Requests Pending Management Approval ({pendingLeaves.length})
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Escalation SLA: 24 Hours
          </span>
        </div>

        {pendingLeaves.length === 0 ? (
          <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <FileCheck2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">All Leave Requests Cleared!</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              No employee leave applications are pending review right now.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingLeaves.map((req) => (
              <div
                key={req.id}
                className="p-5 rounded-xl bg-slate-50/70 border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-purple-200 transition-colors"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">
                      {req.employeeName}
                    </h4>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-100 text-[#5c3ba2] font-semibold">
                      {req.employeeId}
                    </span>
                    <span className="text-xs text-slate-500">
                      • {req.employeeRole} ({req.department})
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="font-semibold text-purple-900">
                      {req.leaveType}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-slate-800">
                      {req.startDate} to {req.endDate}
                    </span>
                    <span>•</span>
                    <span className="font-bold text-slate-900">
                      {req.daysCount} Day{req.daysCount > 1 ? 's' : ''}
                      {req.isHalfDay && ` (${req.halfDayType})`}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-200/60 mt-1">
                    "{req.reason}"
                  </p>
                </div>

                {/* Approve / Reject buttons */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => handleRejectLeave(req.id)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleApproveLeave(req.id)}
                    className="btn-keka-primary px-4 py-2 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Leave</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Attendance Regularization Approvals */}
      {/* ------------------------------------------------------------- */}
      <div className="keka-card p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#5c3ba2]" />
            <h3 className="text-base font-bold text-slate-900 font-sans">
              Attendance Regularization Requests ({regularizations.length})
            </h3>
          </div>
        </div>

        {regularizations.length === 0 ? (
          <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">Zero Pending Regularizations</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              All punch exceptions and late arrivals have been resolved.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {regularizations.map((reg) => (
              <div
                key={reg.id}
                className="p-5 rounded-xl bg-slate-50/70 border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{reg.employeeName}</span>
                    <span className="text-[11px] font-mono font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                      {reg.employeeId}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">• {reg.date}</span>
                  </div>

                  <p className="text-xs text-slate-500">
                    Recorded Punch: <span className="font-mono text-slate-800 font-medium">{reg.systemPunch}</span>
                  </p>
                  <p className="text-xs text-slate-700 font-medium bg-white p-2.5 rounded-lg border border-slate-200/60 mt-1">
                    Submitted Reason: "{reg.reason}"
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => handleApproveRegularization(reg.id)}
                    className="btn-keka-primary px-4 py-2 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Exception</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
