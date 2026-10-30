'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Coffee,
  CheckCircle2,
  Calendar,
  AlertCircle,
  TrendingUp,
  Receipt,
  PartyPopper,
  Megaphone,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Sparkles,
  Heart,
  ChevronRight,
  Send,
} from 'lucide-react';
import {
  CURRENT_USER,
  LEAVE_BALANCES,
  UPCOMING_HOLIDAYS,
  ANNOUNCEMENTS,
} from '../data/mockData';
import { NavigationTab } from './Sidebar';

interface DashboardViewProps {
  isCheckedIn: boolean;
  isOnBreak: boolean;
  onToggleCheckIn: () => void;
  onToggleBreak: () => void;
  onNavigateTab: (tab: NavigationTab) => void;
  onOpenApplyLeave: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  isCheckedIn,
  isOnBreak,
  onToggleCheckIn,
  onToggleBreak,
  onNavigateTab,
  onOpenApplyLeave,
}) => {
  const [secondsWorked, setSecondsWorked] = useState(29780); // ~8h 16m 20s
  const [breakSeconds, setBreakSeconds] = useState(2700); // 45m
  const [wishedState, setWishedState] = useState<Record<string, boolean>>({});

  // Increment work timer live every second when checked in
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCheckedIn && !isOnBreak) {
      interval = setInterval(() => {
        setSecondsWorked((prev) => prev + 1);
      }, 1000);
    } else if (isCheckedIn && isOnBreak) {
      interval = setInterval(() => {
        setBreakSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCheckedIn, isOnBreak]);

  const formatHMS = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}h ${m
      .toString()
      .padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  const targetSeconds = 8.5 * 3600; // 8h 30m required shift
  const progressPercent = Math.min(100, Math.round((secondsWorked / targetSeconds) * 100));

  const handleWish = (name: string) => {
    setWishedState((prev) => ({ ...prev, [name]: true }));
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ------------------------------------------------------------- */}
      {/* Top Banner: Greeting & Quick Check-In Station */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Keka Signature Clock-In Card */}
        <div className="lg:col-span-2 keka-card p-6 bg-gradient-to-br from-white via-white to-purple-50/40 border border-purple-100/80 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-[#5c3ba2] px-2 py-0.5 rounded-md bg-purple-100">
                  SHIFTS & TIME TRACKING
                </span>
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  General Shift (09:00 AM – 06:30 PM)
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
                Good Afternoon, Rahul!
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isCheckedIn
                  ? isOnBreak
                    ? 'You are currently on a designated break. Timer paused.'
                    : 'Your shift timer is actively recording effective work hours.'
                  : 'You have not checked in yet today. Click Web Check-In below.'}
              </p>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  !isCheckedIn
                    ? 'bg-slate-400'
                    : isOnBreak
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-emerald-500 animate-pulse'
                }`}
              />
              <span className="text-xs font-semibold text-slate-700">
                {!isCheckedIn
                  ? 'Checked Out'
                  : isOnBreak
                  ? 'On Break'
                  : 'Actively Working'}
              </span>
            </div>
          </div>

          {/* Real-time Shift Timers & Progress */}
          <div className="py-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Effective Hours */}
            <div className="p-4 rounded-xl bg-white border border-purple-100/70 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium block mb-1">
                Effective Work Hours
              </span>
              <div className="text-2xl font-mono font-extrabold text-slate-900 tracking-tight">
                {formatHMS(secondsWorked)}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" />
                Target 08h 30m ({progressPercent}%)
              </span>
            </div>

            {/* Break Taken */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium block mb-1">
                Break Time Taken
              </span>
              <div className="text-2xl font-mono font-extrabold text-slate-800">
                {formatHMS(breakSeconds)}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Lunch 45m allowed
              </span>
            </div>

            {/* Today's Punch Time */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium block mb-1">
                First Punch In
              </span>
              <div className="text-2xl font-mono font-extrabold text-purple-700">
                09:14 AM
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Web Check-In • IP 10.42.0.12
              </span>
            </div>
          </div>

          {/* Shift Target Progress Bar */}
          <div className="space-y-1.5 mb-6">
            <div className="flex justify-between text-xs font-medium text-slate-600">
              <span>Shift Progress: {progressPercent}% Completed</span>
              <span className="font-mono text-slate-500">
                Remaining: {Math.max(0, Math.floor((targetSeconds - secondsWorked) / 60))} mins
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#5c3ba2] via-indigo-600 to-emerald-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onToggleCheckIn}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all shadow-sm flex items-center gap-2 ${
                isCheckedIn
                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  : 'btn-keka-primary'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{isCheckedIn ? 'Clock Out for the Day' : 'Web Check-In Now'}</span>
            </button>

            {isCheckedIn && (
              <button
                onClick={onToggleBreak}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${
                  isOnBreak
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 shadow-2xs'
                }`}
              >
                <Coffee className="w-4 h-4 text-amber-500" />
                <span>{isOnBreak ? 'End Break & Resume Work' : 'Take Coffee / Lunch Break'}</span>
              </button>
            )}

            <button
              onClick={() => onNavigateTab('attendance')}
              className="text-xs text-slate-500 hover:text-[#5c3ba2] font-semibold flex items-center gap-1 ml-auto transition-colors"
            >
              <span>View Full Attendance Log</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Leave Balance Widget */}
        <div className="keka-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 font-sans">
                Leave Balances
              </h3>
              <button
                onClick={onOpenApplyLeave}
                className="text-xs font-bold text-[#5c3ba2] hover:underline"
              >
                Apply
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {LEAVE_BALANCES.map((leave) => (
                <div
                  key={leave.code}
                  className="p-3 rounded-xl bg-slate-50/70 border border-slate-100"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-extrabold px-1.5 py-0.5 rounded text-white"
                      style={{ backgroundColor: leave.color }}
                    >
                      {leave.code}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      of {leave.total}d
                    </span>
                  </div>
                  <div className="mt-2 text-xl font-extrabold text-slate-900 font-mono">
                    {leave.remaining.toFixed(1)}
                  </div>
                  <span className="text-[11px] text-slate-500 truncate block mt-0.5">
                    {leave.type.split('(')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Next Accrual: +1.5d on Nov 1</span>
            <button
              onClick={() => onNavigateTab('leaves')}
              className="text-[#5c3ba2] font-bold hover:underline"
            >
              Policy Details →
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Mid Metrics: Compliance, Net Pay, Celebrations */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Compliance */}
        <div
          onClick={() => onNavigateTab('attendance')}
          className="keka-card p-5 cursor-pointer hover:border-[#5c3ba2]/40"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Attendance Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            96.4%
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            ↑ 1.2% higher than department avg
          </span>
        </div>

        {/* Next Salary */}
        <div
          onClick={() => onNavigateTab('payroll')}
          className="keka-card p-5 cursor-pointer hover:border-[#5c3ba2]/40"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">October Net Pay</span>
            <Receipt className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-purple-900 font-mono">
            ₹1,71,400
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Disbursement: 01 Nov 2026 (In 2 Days)
          </span>
        </div>

        {/* Approvals */}
        <div
          onClick={() => onNavigateTab('approvals')}
          className="keka-card p-5 cursor-pointer hover:border-[#5c3ba2]/40"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Pending Approvals</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-700 font-mono">
            3 Requests
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            2 team leaves • 1 regularization
          </span>
        </div>

        {/* Upcoming Holiday */}
        <div
          onClick={() => onNavigateTab('leaves')}
          className="keka-card p-5 cursor-pointer hover:border-[#5c3ba2]/40"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Next Holiday</span>
            <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 truncate">
            Diwali Festival
          </div>
          <span className="text-[11px] text-indigo-600 font-semibold mt-1 block">
            08 Nov 2026 (National Off)
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Lower Row: Announcements & Team Celebrations */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Announcements Feed */}
        <div className="lg:col-span-2 keka-card p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-[#5c3ba2]" />
              <h3 className="text-base font-bold text-slate-900 font-sans">
                Company Announcements & Townhalls
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">Oct 2026</span>
          </div>

          <div className="space-y-4">
            {ANNOUNCEMENTS.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-50/60 border border-slate-200/70 hover:border-purple-200 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.priority === 'Important'
                        ? 'bg-rose-100 text-rose-700'
                        : item.priority === 'Celebration'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-purple-100 text-[#5c3ba2]'
                    }`}
                  >
                    {item.tag}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {item.date}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.content}
                </p>
                <div className="mt-2 text-[11px] text-slate-400">
                  Posted by <span className="font-semibold text-slate-600">{item.author}</span> • {item.authorRole}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Celebrations & Birthdays */}
        <div className="keka-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-4">
              <PartyPopper className="w-4 h-4 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900 font-sans">
                Team Celebrations
              </h3>
            </div>

            <div className="space-y-4">
              {/* Celebration item 1 */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-xs">
                    AV
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">
                      Ananya Verma
                    </h5>
                    <p className="text-[11px] text-amber-700 font-medium">
                      🎂 Birthday Tomorrow!
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleWish('Ananya Verma')}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                    wishedState['Ananya Verma']
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-slate-700 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  {wishedState['Ananya Verma'] ? 'Wished ❤️' : 'Wish'}
                </button>
              </div>

              {/* Celebration item 2 */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/60 border border-purple-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-purple-200 text-purple-900 flex items-center justify-center font-bold text-xs">
                    KM
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">
                      Karan Mehra
                    </h5>
                    <p className="text-[11px] text-purple-700 font-medium">
                      🎉 2 Years Work Anniversary
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleWish('Karan Mehra')}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                    wishedState['Karan Mehra']
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-slate-700 hover:bg-purple-100 border border-purple-200'
                  }`}
                >
                  {wishedState['Karan Mehra'] ? 'Congratulated 🎉' : 'Congratulate'}
                </button>
              </div>

              {/* Upcoming Holidays mini list */}
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-700 block mb-2">
                  Upcoming Holidays
                </span>
                <div className="space-y-2">
                  {UPCOMING_HOLIDAYS.slice(0, 3).map((h) => (
                    <div
                      key={h.name}
                      className="flex items-center justify-between text-xs py-1 text-slate-600"
                    >
                      <span className="truncate max-w-[140px] font-medium">
                        {h.name}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {h.date}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400">
              KekaFlow Culture & Social Feed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
