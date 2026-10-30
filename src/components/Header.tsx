'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  Clock,
  CalendarPlus,
  Sparkles,
  ChevronDown,
  Building,
  CheckCircle2,
  Coffee,
} from 'lucide-react';
import { NavigationTab } from './Sidebar';
import { CURRENT_USER } from '../data/mockData';

interface HeaderProps {
  currentTab: NavigationTab;
  onOpenApplyLeave: () => void;
  isCheckedIn: boolean;
  isOnBreak: boolean;
  onToggleCheckIn: () => void;
  onToggleBreak: () => void;
  isAdminMode: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenApplyLeave,
  isCheckedIn,
  isOnBreak,
  onToggleCheckIn,
  onToggleBreak,
  isAdminMode,
  searchQuery,
  onSearchChange,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setDateStr(
        now.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const titles: Record<NavigationTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Employee Dashboard & Shift Time',
      subtitle: 'Overview of work hours, attendance compliance, and team updates',
    },
    attendance: {
      title: 'Attendance & Punch Records',
      subtitle: 'Daily biometric web check-in logs and regularization workflow',
    },
    leaves: {
      title: 'Leave Balances & Holiday Calendar',
      subtitle: 'Track annual PL, CL, SL accruals and apply for time off',
    },
    payroll: {
      title: 'Payroll, CTC & Salary Slips',
      subtitle: 'Monthly payslip generator, statutory EPF/PT, and tax breakdown',
    },
    directory: {
      title: 'Employee Directory & Organization Tree',
      subtitle: 'Connect with colleagues across engineering, product, and leadership',
    },
    approvals: {
      title: 'HR Operations & Approvals Inbox',
      subtitle: 'Review pending leave requests, attendance regularization, and team claims',
    },
    workflows: {
      title: 'No-Code Workflow Studio & State Machine Builder',
      subtitle: 'Design visual approval trees, safe AST condition rules, and automated API actions',
    },
  };

  const { title, subtitle } = titles[currentTab];

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between">
      {/* Title & Context */}
      <div>
        <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          {title}
          {isAdminMode && (
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 text-[#5c3ba2] border border-purple-200">
              Admin Mode
            </span>
          )}
        </h1>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>

      {/* Center/Right Actions & Live Clock */}
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search colleagues, policies, payslips..."
            className="w-64 pl-9 pr-12 py-1.5 text-xs rounded-xl bg-slate-100/80 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5c3ba2]/20 focus:border-[#5c3ba2] text-slate-800 transition-all placeholder:text-slate-400"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded text-slate-400 shadow-2xs">
            ⌘K
          </kbd>
        </div>

        {/* Real-time IST Digital Clock Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50/70 border border-purple-100 text-xs font-mono text-[#5c3ba2]">
          <Clock className="w-3.5 h-3.5 text-[#5c3ba2] animate-pulse" />
          <span className="font-semibold">{timeStr}</span>
          <span className="text-purple-300">|</span>
          <span className="text-slate-600 font-sans text-[11px]">{dateStr}</span>
        </div>

        {/* Quick Web Check-In / Break Button */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
          <button
            onClick={onToggleCheckIn}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isCheckedIn
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:text-slate-900 shadow-2xs'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isCheckedIn ? 'bg-emerald-200 animate-ping' : 'bg-slate-400'
              }`}
            />
            <span>{isCheckedIn ? 'Checked In' : 'Web Check-In'}</span>
          </button>

          {isCheckedIn && (
            <button
              onClick={onToggleBreak}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                isOnBreak
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>{isOnBreak ? 'Resume Work' : 'Take Break'}</span>
            </button>
          )}
        </div>

        {/* Apply Leave CTA */}
        <button
          onClick={onOpenApplyLeave}
          className="btn-keka-primary px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5"
        >
          <CalendarPlus className="w-3.5 h-3.5" />
          <span>Apply Leave</span>
        </button>

        {/* Notifications Icon */}
        <button
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
};
