'use client';

import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Home,
  Coffee,
  X,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
} from 'lucide-react';
import { OCTOBER_ATTENDANCE } from '../data/mockData';
import { AttendanceRecord, AttendanceStatus } from '../types/hrms';

export const AttendanceView: React.FC = () => {
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>(OCTOBER_ATTENDANCE);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedRecordForRegularize, setSelectedRecordForRegularize] = useState<AttendanceRecord | null>(null);
  const [regularizeReason, setRegularizeReason] = useState<string>('Biometric Machine Glitch');
  const [customNote, setCustomNote] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Status counts
  const presentCount = attendanceList.filter((r) => r.status === 'Present').length;
  const wfhCount = attendanceList.filter((r) => r.status === 'WFH').length;
  const lateCount = attendanceList.filter((r) => r.status === 'Late').length;
  const leaveCount = attendanceList.filter((r) => r.status === 'On Leave').length;
  const holidayCount = attendanceList.filter((r) => r.status === 'Holiday' || r.status === 'Weekend').length;

  const filteredList = attendanceList.filter((r) => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  const handleOpenRegularize = (record: AttendanceRecord) => {
    setSelectedRecordForRegularize(record);
    setRegularizeReason('Biometric Machine Glitch');
    setCustomNote('');
  };

  const handleConfirmRegularize = () => {
    if (!selectedRecordForRegularize) return;
    setAttendanceList((prev) =>
      prev.map((item) => {
        if (item.date === selectedRecordForRegularize.date) {
          return {
            ...item,
            regularizationStatus: 'Pending',
            regularizationReason: `${regularizeReason}${customNote ? ': ' + customNote : ''}`,
          };
        }
        return item;
      })
    );

    setSuccessToast(`Regularization requested for ${selectedRecordForRegularize.date}. Sent to manager for approval.`);
    setTimeout(() => setSuccessToast(null), 4000);
    setSelectedRecordForRegularize(null);
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'Present':
        return <span className="badge-present text-xs font-semibold px-2.5 py-0.5 rounded-md">Present</span>;
      case 'WFH':
        return <span className="badge-wfh text-xs font-semibold px-2.5 py-0.5 rounded-md">WFH</span>;
      case 'Late':
        return <span className="badge-late text-xs font-semibold px-2.5 py-0.5 rounded-md">Late Arrival</span>;
      case 'On Leave':
        return <span className="badge-leave text-xs font-semibold px-2.5 py-0.5 rounded-md">On Leave</span>;
      case 'Holiday':
        return <span className="badge-holiday text-xs font-semibold px-2.5 py-0.5 rounded-md">Holiday</span>;
      case 'Weekend':
        return <span className="badge-weekend text-xs font-semibold px-2.5 py-0.5 rounded-md">Weekend</span>;
      default:
        return <span className="text-xs text-slate-500">{status}</span>;
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Success notification toast */}
      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Attendance Summary Cards */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="keka-card p-4">
          <span className="text-xs text-slate-400 font-medium">Days in Month</span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">31</div>
          <span className="text-[11px] text-slate-500 font-medium">October 2026</span>
        </div>

        <div className="keka-card p-4 border-l-4 border-l-emerald-500">
          <span className="text-xs text-slate-400 font-medium">Present (Office)</span>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">{presentCount}</div>
          <span className="text-[11px] text-emerald-600 font-semibold">100% Avg Hours</span>
        </div>

        <div className="keka-card p-4 border-l-4 border-l-blue-500">
          <span className="text-xs text-slate-400 font-medium">Work From Home</span>
          <div className="text-2xl font-bold font-mono text-blue-700 mt-1">{wfhCount}</div>
          <span className="text-[11px] text-blue-600 font-semibold">Approved Remote</span>
        </div>

        <div className="keka-card p-4 border-l-4 border-l-amber-500">
          <span className="text-xs text-slate-400 font-medium">Late Marks</span>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-1">{lateCount}</div>
          <span className="text-[11px] text-amber-600 font-semibold">1 Regularized</span>
        </div>

        <div className="keka-card p-4 border-l-4 border-l-purple-500">
          <span className="text-xs text-slate-400 font-medium">Leaves Taken</span>
          <div className="text-2xl font-bold font-mono text-purple-700 mt-1">{leaveCount}</div>
          <span className="text-[11px] text-purple-600 font-semibold">Paid Casual Leave</span>
        </div>

        <div className="keka-card p-4 border-l-4 border-l-slate-400">
          <span className="text-xs text-slate-400 font-medium">Holidays & Offs</span>
          <div className="text-2xl font-bold font-mono text-slate-700 mt-1">{holidayCount}</div>
          <span className="text-[11px] text-slate-500 font-semibold">Scheduled Off</span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Visual Monthly Calendar Strip / Heatmap */}
      {/* ------------------------------------------------------------- */}
      <div className="keka-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-sans flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#5c3ba2]" />
              Monthly Attendance Matrix (October 2026)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any calendar day to inspect punch timestamps or request regularization
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold overflow-x-auto">
            {['ALL', 'Present', 'WFH', 'Late', 'On Leave'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterStatus === st
                    ? 'bg-white text-[#5c3ba2] shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? 'All Days' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 py-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500" />
            <span>Present (Office)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-500" />
            <span>Work From Home</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500" />
            <span>Late Arrival</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-purple-500" />
            <span>On Leave</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-300" />
            <span>Weekend / Holiday</span>
          </div>
        </div>

        {/* Interactive Attendance Table */}
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-semibold border-y border-slate-200/80">
                <th className="py-3 px-4">Date & Day</th>
                <th className="py-3 px-4">First In</th>
                <th className="py-3 px-4">Last Out</th>
                <th className="py-3 px-4">Break Time</th>
                <th className="py-3 px-4">Effective Hours</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Regularization</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((rec) => {
                const isLateOrMissing = rec.status === 'Late' || (rec.status === 'Present' && rec.checkOut === '--:--');
                return (
                  <tr key={rec.date} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                      <div>
                        <span className="font-bold text-slate-900">{rec.date}</span>
                        <span className="text-slate-400 block text-[11px] font-sans">{rec.day}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {rec.checkIn}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {rec.checkOut}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {rec.breakMinutes > 0 ? `${rec.breakMinutes} mins` : '--'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {rec.effectiveHours}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(rec.status)}
                    </td>
                    <td className="py-3.5 px-4">
                      {rec.regularizationStatus === 'Approved' && (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Approved
                        </span>
                      )}
                      {rec.regularizationStatus === 'Pending' && (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 animate-pulse">
                          Pending Approval
                        </span>
                      )}
                      {(!rec.regularizationStatus || rec.regularizationStatus === 'None') && (
                        <span className="text-slate-400 text-[11px]">--</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {rec.status === 'Late' && !rec.regularizationStatus && (
                        <button
                          onClick={() => handleOpenRegularize(rec)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                        >
                          Regularize
                        </button>
                      )}
                      {rec.status !== 'Weekend' && rec.status !== 'Holiday' && (
                        <button
                          onClick={() => handleOpenRegularize(rec)}
                          className="text-xs text-[#5c3ba2] font-semibold hover:underline"
                        >
                          Details
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Regularize Attendance Modal */}
      {/* ------------------------------------------------------------- */}
      {selectedRecordForRegularize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#5c3ba2]" />
                <h3 className="text-base font-bold text-slate-900 font-sans">
                  Attendance Regularization
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecordForRegularize(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Date Details */}
            <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-100 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Selected Date:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {selectedRecordForRegularize.date} ({selectedRecordForRegularize.day})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">System Recorded Timings:</span>
                <span className="font-mono text-slate-800">
                  {selectedRecordForRegularize.checkIn} → {selectedRecordForRegularize.checkOut}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Status:</span>
                <span>{getStatusBadge(selectedRecordForRegularize.status)}</span>
              </div>
            </div>

            {/* Reason selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Reason for Regularization *
              </label>
              <select
                value={regularizeReason}
                onChange={(e) => setRegularizeReason(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5c3ba2]/20 focus:border-[#5c3ba2] bg-white text-slate-800"
              >
                <option value="Biometric Machine Glitch">Biometric Machine / Network Glitch</option>
                <option value="On-Site Client Meeting">External Client Meeting / On-Site Deployment</option>
                <option value="Heavy Traffic / Metro Delay">Severe Highway / Traffic Delay</option>
                <option value="Approved Pre-Planned WFH">Pre-Approved WFH / Power Outage</option>
                <option value="Forgot to Punch Out">Forgot to Web Clock-Out at End of Shift</option>
              </select>
            </div>

            {/* Custom Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Additional Comments for Manager (Optional)
              </label>
              <textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Briefly describe what happened..."
                rows={3}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5c3ba2]/20 focus:border-[#5c3ba2] placeholder:text-slate-400 text-slate-800"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedRecordForRegularize(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRegularize}
                className="btn-keka-primary px-4 py-2 text-xs font-semibold"
              >
                Submit Regularization
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
