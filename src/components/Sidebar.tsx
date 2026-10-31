'use client';

import React from 'react';
import {
  LayoutDashboard,
  Clock,
  CalendarDays,
  ReceiptText,
  Users,
  CheckSquare,
  ShieldAlert,
  Sparkles,
  ChevronRight,
  LogOut,
  Building2,
  GitBranch,
  Briefcase,
} from 'lucide-react';
import { CURRENT_USER } from '../data/mockData';

export type NavigationTab =
  | 'dashboard'
  | 'hiring'
  | 'attendance'
  | 'leaves'
  | 'payroll'
  | 'directory'
  | 'approvals'
  | 'workflows';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isAdminMode: boolean;
  onToggleAdminMode: () => void;
  pendingApprovalsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isAdminMode,
  onToggleAdminMode,
  pendingApprovalsCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavigationTab,
      label: 'Home & Clock-In',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'hiring' as NavigationTab,
      label: 'Hire & ATS',
      icon: Briefcase,
      badge: '4 Active',
      badgeColor: 'bg-purple-100 text-[#5c3ba2] font-bold',
    },
    {
      id: 'attendance' as NavigationTab,
      label: 'Attendance & Logs',
      icon: Clock,
      badge: '96.2%',
    },
    {
      id: 'leaves' as NavigationTab,
      label: 'Leaves & Holidays',
      icon: CalendarDays,
      badge: '14.5 Left',
    },
    {
      id: 'payroll' as NavigationTab,
      label: 'Payroll & Payslips',
      icon: ReceiptText,
      badge: 'Oct Paid',
    },
    {
      id: 'directory' as NavigationTab,
      label: 'Team Directory',
      icon: Users,
      badge: '10+',
    },
    {
      id: 'workflows' as NavigationTab,
      label: 'Workflow Studio',
      icon: GitBranch,
      badge: 'Visual No-Code',
      badgeColor: 'bg-purple-100 text-[#5c3ba2]',
    },
    {
      id: 'approvals' as NavigationTab,
      label: 'HR Approvals',
      icon: CheckSquare,
      badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount} New` : null,
      badgeColor: 'bg-rose-500 text-white',
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between h-screen sticky top-0 z-30 select-none">
      {/* Brand & Workspace */}
      <div>
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5c3ba2] via-[#7544cf] to-[#9061e8] flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Sparkles className="w-5 h-5 text-purple-100" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 font-sans">
                  keka<span className="text-[#5c3ba2]">flow</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-[#5c3ba2] font-mono">
                  CLOUD
                </span>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-400" />
                Mohali Tech Campus
              </p>
            </div>
          </div>
        </div>

        {/* Role Switcher Pill */}
        <div className="px-4 pt-4 pb-2">
          <div className="p-1 rounded-xl bg-slate-100/80 border border-slate-200/80 flex items-center text-xs font-semibold">
            <button
              onClick={() => {
                if (isAdminMode) onToggleAdminMode();
              }}
              className={`flex-1 py-1.5 text-center rounded-lg transition-all ${
                !isAdminMode
                  ? 'bg-white text-[#5c3ba2] shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Employee ESS
            </button>
            <button
              onClick={() => {
                if (!isAdminMode) onToggleAdminMode();
              }}
              className={`flex-1 py-1.5 text-center rounded-lg transition-all flex items-center justify-center gap-1 ${
                isAdminMode
                  ? 'bg-[#5c3ba2] text-white shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              HR Admin
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase font-mono">
            {isAdminMode ? 'Management & Operations' : 'Self-Service Modules'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-purple-50 text-[#5c3ba2] font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-[#5c3ba2]' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      item.badgeColor
                        ? item.badgeColor
                        : isActive
                        ? 'bg-purple-200/70 text-[#5c3ba2]'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Card & Logout */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-200/70 shadow-xs">
          <img
            src={CURRENT_USER.avatar}
            alt={CURRENT_USER.name}
            className="w-10 h-10 rounded-xl object-cover ring-2 ring-purple-100"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-900 truncate">
                {CURRENT_USER.name}
              </p>
              <span className="text-[10px] font-mono text-purple-700 font-semibold px-1 bg-purple-50 rounded">
                {CURRENT_USER.employeeId}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              {isAdminMode ? 'HR Admin & Tech Lead' : CURRENT_USER.role.split('&')[0]}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
