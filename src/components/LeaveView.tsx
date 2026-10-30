'use client';

import React, { useState } from 'react';
import {
  Calendar,
  CalendarPlus,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  Info,
  ChevronRight,
  ShieldCheck,
  PartyPopper,
} from 'lucide-react';
import {
  LEAVE_BALANCES,
  INITIAL_LEAVE_REQUESTS,
  UPCOMING_HOLIDAYS,
  CURRENT_USER,
} from '../data/mockData';
import { LeaveRequest, LeaveBalance } from '../types/hrms';

interface LeaveViewProps {
  applyModalOpen: boolean;
  onCloseApplyModal: () => void;
  onOpenApplyModal: () => void;
}

export const LeaveView: React.FC<LeaveViewProps> = ({
  applyModalOpen,
  onCloseApplyModal,
  onOpenApplyModal,
}) => {
  const [balances, setBalances] = useState<LeaveBalance[]>(LEAVE_BALANCES);
  const [requests, setRequests] = useState<LeaveRequest[]>(INITIAL_LEAVE_REQUESTS);
  const [selectedType, setSelectedType] = useState<'PL' | 'CL' | 'SL' | 'OH'>('CL');
  const [startDate, setStartDate] = useState<string>('2026-11-05');
  const [endDate, setEndDate] = useState<string>('2026-11-05');
  const [isHalfDay, setIsHalfDay] = useState<boolean>(false);
  const [halfDayType, setHalfDayType] = useState<'First Half' | 'Second Half'>('First Half');
  const [reason, setReason] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Compute requested days count
  const calculateDays = () => {
    if (isHalfDay) return 0.5;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diffDays);
  };

  const calculatedDays = calculateDays();
  const currentBalanceObj = balances.find((b) => b.code === selectedType);

  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please provide a reason for your leave application.');
      return;
    }

    const newRequest: LeaveRequest = {
      id: `lr-${Date.now()}`,
      employeeId: CURRENT_USER.employeeId,
      employeeName: CURRENT_USER.name,
      employeeRole: CURRENT_USER.role,
      department: CURRENT_USER.department,
      leaveType: currentBalanceObj?.type || 'Casual Leave (CL)',
      leaveCode: selectedType,
      startDate,
      endDate: isHalfDay ? startDate : endDate,
      daysCount: calculatedDays,
      isHalfDay,
      halfDayType: isHalfDay ? halfDayType : undefined,
      reason: reason.trim(),
      status: 'Pending',
      appliedOn: new Date().toISOString().split('T')[0],
    };

    setRequests([newRequest, ...requests]);

    // Deduct remaining balance tentatively
    setBalances((prev) =>
      prev.map((b) => {
        if (b.code === selectedType) {
          return {
            ...b,
            remaining: Math.max(0, b.remaining - calculatedDays),
            used: b.used + calculatedDays,
          };
        }
        return b;
      })
    );

    setToastMessage(`Leave request for ${calculatedDays} day(s) submitted to ${CURRENT_USER.managerName}!`);
    setTimeout(() => setToastMessage(null), 5000);
    setReason('');
    onCloseApplyModal();
  };

  const handleWithdrawRequest = (id: string) => {
    const target = requests.find((r) => r.id === id);
    if (!target) return;

    if (confirm('Are you sure you want to withdraw this leave request?')) {
      setRequests((prev) => prev.filter((r) => r.id !== id));
      // Refund balance
      setBalances((prev) =>
        prev.map((b) => {
          if (b.code === target.leaveCode) {
            return {
              ...b,
              remaining: b.remaining + target.daysCount,
              used: Math.max(0, b.used - target.daysCount),
            };
          }
          return b;
        })
      );
      setToastMessage('Leave request withdrawn successfully.');
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#5c3ba2]" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-purple-600 hover:text-purple-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4 Leave Balance Cards */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {balances.map((b) => {
          const usedPercent = Math.round((b.used / b.total) * 100);
          return (
            <div key={b.code} className="keka-card p-5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-xs font-extrabold px-2 py-0.5 rounded text-white"
                  style={{ backgroundColor: b.color }}
                >
                  {b.code}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Total: {b.total} Days
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-slate-900">
                  {b.remaining.toFixed(1)}
                </span>
                <span className="text-xs font-medium text-slate-500">Days Available</span>
              </div>

              <p className="text-xs font-bold text-slate-700 mt-1 truncate">
                {b.type.split('(')[0]}
              </p>

              {/* Progress bar */}
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>Used: {b.used.toFixed(1)}d</span>
                  <span>{usedPercent}% Consumed</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${usedPercent}%`,
                      backgroundColor: b.color,
                    }}
                  />
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Accrual: +{b.accruedPerMonth}d/mo</span>
                <button
                  onClick={() => {
                    setSelectedType(b.code);
                    onOpenApplyModal();
                  }}
                  className="font-bold text-[#5c3ba2] hover:underline"
                >
                  Apply {b.code} →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Leave Application & History Table */}
      {/* ------------------------------------------------------------- */}
      <div className="keka-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-sans flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#5c3ba2]" />
              Leave Application History & Status
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-tier approval workflow routed to VP of Engineering
            </p>
          </div>

          <button
            onClick={onOpenApplyModal}
            className="btn-keka-primary px-4 py-2 text-xs font-semibold flex items-center gap-2"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Apply For Leave</span>
          </button>
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-200/80">
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Days</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Applied Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Approver Note</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900">{req.leaveType}</span>
                    {req.isHalfDay && (
                      <span className="block text-[11px] text-amber-700 font-medium">
                        Half Day ({req.halfDayType})
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-800">
                    {req.startDate === req.endDate ? req.startDate : `${req.startDate} to ${req.endDate}`}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {req.daysCount} Day{req.daysCount > 1 ? 's' : ''}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={req.reason}>
                    {req.reason}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">
                    {req.appliedOn}
                  </td>
                  <td className="py-3.5 px-4">
                    {req.status === 'Approved' && (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Approved
                      </span>
                    )}
                    {req.status === 'Pending' && (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                        Pending Review
                      </span>
                    )}
                    {req.status === 'Rejected' && (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        Rejected
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate" title={req.managerComments || req.approvedBy}>
                    {req.managerComments ? (
                      <span className="italic">{req.managerComments}</span>
                    ) : req.approvedBy ? (
                      `Approved by ${req.approvedBy}`
                    ) : (
                      'Awaiting Review'
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {req.status === 'Pending' && (
                      <button
                        onClick={() => handleWithdrawRequest(req.id)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline"
                      >
                        Withdraw
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2026 Official Company Holiday Calendar */}
      {/* ------------------------------------------------------------- */}
      <div className="keka-card p-6">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-4">
          <PartyPopper className="w-5 h-5 text-amber-500" />
          <div>
            <h3 className="text-base font-bold text-slate-900 font-sans">
              2026 Official Holiday Calendar (Mohali Tech Campus)
            </h3>
            <p className="text-xs text-slate-500">
              Mandatory and restricted holidays approved by Punjab State Labour Board
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {UPCOMING_HOLIDAYS.map((hol) => (
            <div
              key={hol.name}
              className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold text-slate-900 block">{hol.name}</span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {hol.date} • {hol.dayOfWeek}
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-[#5c3ba2]">
                {hol.type.split('/')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Apply Leave Modal */}
      {/* ------------------------------------------------------------- */}
      {applyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarPlus className="w-5 h-5 text-[#5c3ba2]" />
                <h3 className="text-base font-bold text-slate-900 font-sans">
                  Apply for Leave
                </h3>
              </div>
              <button
                onClick={onCloseApplyModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitLeave} className="space-y-4">
              {/* Leave Type Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Select Leave Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {balances.map((b) => (
                    <button
                      type="button"
                      key={b.code}
                      onClick={() => setSelectedType(b.code)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        selectedType === b.code
                          ? 'border-[#5c3ba2] bg-purple-50/70 ring-1 ring-[#5c3ba2]'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-900 block truncate">
                        {b.type.split('(')[0]}
                      </span>
                      <span className="text-[11px] text-[#5c3ba2] font-mono font-semibold">
                        {b.remaining.toFixed(1)} Days Left
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date pickers */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    From Date *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5c3ba2]/20 focus:border-[#5c3ba2]"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    To Date *
                  </label>
                  <input
                    type="date"
                    value={isHalfDay ? startDate : endDate}
                    disabled={isHalfDay}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5c3ba2]/20 focus:border-[#5c3ba2] disabled:bg-slate-100"
                    required
                  />
                </div>
              </div>

              {/* Half Day Toggle */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Half-Day Leave</span>
                  <span className="text-[11px] text-slate-500">Apply for a 0.5-day morning or evening session</span>
                </div>
                <input
                  type="checkbox"
                  checked={isHalfDay}
                  onChange={(e) => setIsHalfDay(e.target.checked)}
                  className="w-4 h-4 text-[#5c3ba2] rounded cursor-pointer accent-[#5c3ba2]"
                />
              </div>

              {isHalfDay && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setHalfDayType('First Half')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border ${
                      halfDayType === 'First Half'
                        ? 'bg-[#5c3ba2] text-white border-[#5c3ba2]'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    First Half (09:00 AM – 01:30 PM)
                  </button>
                  <button
                    type="button"
                    onClick={() => setHalfDayType('Second Half')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border ${
                      halfDayType === 'Second Half'
                        ? 'bg-[#5c3ba2] text-white border-[#5c3ba2]'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    Second Half (02:00 PM – 06:30 PM)
                  </button>
                </div>
              )}

              {/* Total Days Computed Pill */}
              <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-purple-50 text-[#5c3ba2] font-semibold border border-purple-100">
                <span>Total Leave Days:</span>
                <span className="font-mono text-sm">{calculatedDays} Day{calculatedDays > 1 ? 's' : ''}</span>
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Reason for Absence *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="State the purpose of your leave (family commitment, sickness, appointment)..."
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5c3ba2]/20 focus:border-[#5c3ba2] placeholder:text-slate-400"
                  required
                />
              </div>

              {/* Approver info */}
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Approval will be routed to: <strong>{CURRENT_USER.managerName}</strong></span>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onCloseApplyModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-keka-primary px-5 py-2 text-xs font-semibold"
                >
                  Confirm & Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
