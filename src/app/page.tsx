'use client';

import React, { useState } from 'react';
import { Sidebar, NavigationTab } from '../components/Sidebar';
import { Header } from '../components/Header';
import { DashboardView } from '../components/DashboardView';
import { AttendanceView } from '../components/AttendanceView';
import { LeaveView } from '../components/LeaveView';
import { PayrollView } from '../components/PayrollView';
import { DirectoryView } from '../components/DirectoryView';
import { ApprovalsView } from '../components/ApprovalsView';
import { WorkflowBuilderView } from '../components/WorkflowBuilderView';

export default function HomePage() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(true);
  const [isOnBreak, setIsOnBreak] = useState<boolean>(false);
  const [applyModalOpen, setApplyModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(3);

  const handleToggleCheckIn = () => {
    setIsCheckedIn((prev) => !prev);
    if (isOnBreak) setIsOnBreak(false);
  };

  const handleToggleBreak = () => {
    setIsOnBreak((prev) => !prev);
  };

  const handleToggleAdminMode = () => {
    setIsAdminMode((prev) => {
      const next = !prev;
      if (next && currentTab !== 'approvals') {
        setCurrentTab('approvals');
      } else if (!next && currentTab === 'approvals') {
        setCurrentTab('dashboard');
      }
      return next;
    });
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 0 && currentTab !== 'directory') {
      setCurrentTab('directory');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* ------------------------------------------------------------- */}
      {/* Keka Sidebar */}
      {/* ------------------------------------------------------------- */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isAdminMode={isAdminMode}
        onToggleAdminMode={handleToggleAdminMode}
        pendingApprovalsCount={pendingApprovalsCount}
      />

      {/* ------------------------------------------------------------- */}
      {/* Main Content Area */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentTab={currentTab}
          onOpenApplyLeave={() => {
            setCurrentTab('leaves');
            setApplyModalOpen(true);
          }}
          isCheckedIn={isCheckedIn}
          isOnBreak={isOnBreak}
          onToggleCheckIn={handleToggleCheckIn}
          onToggleBreak={handleToggleBreak}
          isAdminMode={isAdminMode}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
        />

        <main className="flex-1 pb-16">
          {currentTab === 'dashboard' && (
            <DashboardView
              isCheckedIn={isCheckedIn}
              isOnBreak={isOnBreak}
              onToggleCheckIn={handleToggleCheckIn}
              onToggleBreak={handleToggleBreak}
              onNavigateTab={setCurrentTab}
              onOpenApplyLeave={() => {
                setCurrentTab('leaves');
                setApplyModalOpen(true);
              }}
            />
          )}

          {currentTab === 'attendance' && <AttendanceView />}

          {currentTab === 'leaves' && (
            <LeaveView
              applyModalOpen={applyModalOpen}
              onCloseApplyModal={() => setApplyModalOpen(false)}
              onOpenApplyModal={() => setApplyModalOpen(true)}
            />
          )}

          {currentTab === 'payroll' && <PayrollView />}

          {currentTab === 'directory' && (
            <DirectoryView initialSearch={searchQuery} />
          )}

          {currentTab === 'approvals' && (
            <ApprovalsView onUpdatePendingCount={setPendingApprovalsCount} />
          )}

          {currentTab === 'workflows' && <WorkflowBuilderView />}
        </main>
      </div>
    </div>
  );
}
