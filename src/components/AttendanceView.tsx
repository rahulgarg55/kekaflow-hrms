'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  MapPin,
  Camera,
  Wifi,
  QrCode,
  Smartphone,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  WifiOff,
  RefreshCw,
  Calendar,
  UserCheck,
  Users,
  Lock,
  FileText,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Eye,
  X,
  Play,
  Send,
  Info,
  Download,
  Building2,
} from 'lucide-react';
import { OCTOBER_ATTENDANCE } from '../data/mockData';
import { AttendanceRecord, AttendanceStatus } from '../types/hrms';
import { TeamLiveStatusItem, PayrollCycleLock, GeofenceZone, ShiftPolicy } from '../lib/attendance/types';
import { DEFAULT_GEOFENCES, DEFAULT_SHIFTS } from '../lib/attendance/attendanceStore';

export const AttendanceView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'pwa' | 'team' | 'matrix' | 'payroll_lock'>('pwa');
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(true);

  // PWA Punch State
  const [isClockedIn, setIsClockedIn] = useState<boolean>(true);
  const [clockInTime, setClockInTime] = useState<string>('09:25 AM');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(27900); // ~7 hours 45 mins
  const [selectedGeofence, setSelectedGeofence] = useState<GeofenceZone>(DEFAULT_GEOFENCES[0]);
  const [isMockGpsActive, setIsMockGpsActive] = useState<boolean>(false);
  const [isOnDutyFieldVisit, setIsOnDutyFieldVisit] = useState<boolean>(false);
  const [clientVisitName, setClientVisitName] = useState<string>('Tata Consultancy Services (Noida)');
  const [clientNotes, setClientNotes] = useState<string>('Quarterly cloud architecture sprint sync on-site');
  const [selfieScore, setSelfieScore] = useState<number>(0.96);
  const [isSelfieCaptured, setIsSelfieCaptured] = useState<boolean>(true);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<Array<{ timestamp: string; type: 'IN' | 'OUT'; seq: number }>>([]);
  const [dpdpConsentGiven, setDpdpConsentGiven] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warn' | 'error' } | null>(null);

  // Today's Local Timeline of Punches
  const [todayPunches, setTodayPunches] = useState<Array<{ time: string; type: 'IN' | 'OUT'; method: string; location: string; status: 'VALID' | 'ANOMALY' }>>([
    { time: '09:25 AM', type: 'IN', method: 'GEO + Biometric', location: 'Cyber City HQ (Tower 10B)', status: 'VALID' },
    { time: '01:15 PM', type: 'OUT', method: 'Mobile PWA', location: 'Cyber City HQ Cafeteria', status: 'VALID' },
    { time: '01:55 PM', type: 'IN', method: 'Mobile PWA', location: 'Cyber City HQ (Tower 10B)', status: 'VALID' },
  ]);

  // Team Live Status (Manager View)
  const [teamMembers, setTeamMembers] = useState<TeamLiveStatusItem[]>([]);
  const [teamSummary, setTeamSummary] = useState<{ total: number; clockedIn: number; lateArrivals: number; anomalies: number }>({
    total: 5,
    clockedIn: 3,
    lateArrivals: 2,
    anomalies: 1,
  });

  // Payroll Lock State
  const [cycleLockData, setCycleLockData] = useState<PayrollCycleLock | null>(null);
  const [isLockingInProgress, setIsLockingInProgress] = useState<boolean>(false);

  // Monthly Matrix & Regularization
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>(OCTOBER_ATTENDANCE);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedRecordForRegularize, setSelectedRecordForRegularize] = useState<AttendanceRecord | null>(null);
  const [regularizeReason, setRegularizeReason] = useState<string>('Biometric Machine / Network Glitch');
  const [customNote, setCustomNote] = useState<string>('');

  // Elapsed timer tick
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isClockedIn && !isOfflineMode) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isClockedIn, isOfflineMode]);

  // Fetch Team Live Status
  useEffect(() => {
    fetchTeamStatus();
  }, []);

  const fetchTeamStatus = async () => {
    try {
      const res = await fetch('/api/attendance/team-status');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setTeamMembers(json.data);
          setTeamSummary({
            total: json.summary.total,
            clockedIn: json.summary.clockedIn + json.summary.onDutyClientVisit,
            lateArrivals: json.summary.lateArrivals,
            anomalies: json.summary.anomalies,
          });
        }
      }
    } catch {
      // Fallback handled gracefully
    }
  };

  const showToast = (text: string, type: 'success' | 'warn' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Perform Clock-In / Clock-Out
  const handlePunchToggle = async () => {
    const nextPunchType = isClockedIn ? 'OUT' : 'IN';
    const currentTimeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    if (isOfflineMode) {
      const offlineItem = {
        timestamp: new Date().toISOString(),
        type: nextPunchType as 'IN' | 'OUT',
        seq: offlineQueue.length + 1,
      };
      setOfflineQueue((prev) => [...prev, offlineItem]);
      setIsClockedIn(!isClockedIn);
      showToast(`Offline mode active. Punch queued locally with monotonic seq #${offlineItem.seq}.`, 'warn');
      return;
    }

    try {
      const payload = {
        employeeId: 'emp_001',
        employeeName: 'Aarav Sharma',
        punchType: nextPunchType,
        deviceTimestamp: new Date().toISOString(),
        verificationMethod: isOnDutyFieldVisit ? 'GEO' : 'SELFIE_LIVENESS',
        geo: {
          latitude: isMockGpsActive ? 26.9124 : selectedGeofence.latitude,
          longitude: isMockGpsActive ? 75.7873 : selectedGeofence.longitude,
          accuracyMeters: isMockGpsActive ? 0.05 : 12,
          isMocked: isMockGpsActive,
        },
        network: {
          clientIp: '192.168.1.45',
          bssid: 'c4:ad:34:89:12:ef',
          ssid: 'NovaHR-Corp-5G',
        },
        livenessScore: isSelfieCaptured ? selfieScore : 0.55,
        deviceId: 'device_pixel8_aarav_bound',
        clientVisitName: isOnDutyFieldVisit ? clientVisitName : undefined,
        notes: isOnDutyFieldVisit ? clientNotes : undefined,
      };

      const res = await fetch('/api/attendance/punch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setIsClockedIn(nextPunchType === 'IN');
        if (nextPunchType === 'IN') {
          setClockInTime(currentTimeStr);
        }

        const isAnomaly = json.data.anomalyReport.isSuspicious;
        setTodayPunches((prev) => [
          ...prev,
          {
            time: currentTimeStr,
            type: nextPunchType,
            method: isOnDutyFieldVisit ? 'Client Visit (On-Duty)' : 'Geo + Selfie Liveness',
            location: isOnDutyFieldVisit ? clientVisitName : selectedGeofence.name,
            status: isAnomaly ? 'ANOMALY' : 'VALID',
          },
        ]);

        if (isAnomaly) {
          showToast(`Punch recorded but FLAGGED for HR review: ${json.data.anomalyReport.flags.join(', ')}`, 'error');
        } else {
          showToast(`Punch ${nextPunchType} verified successfully via ${json.data.verification.inRadius ? 'Geofence' : 'Network Anchor'}!`, 'success');
        }

        fetchTeamStatus();
      } else {
        showToast(json.error || 'Failed to record punch', 'error');
      }
    } catch {
      showToast('Network error while processing punch', 'error');
    }
  };

  // Sync Offline Punches
  const handleSyncOffline = async () => {
    if (offlineQueue.length === 0) return;

    try {
      const payload = {
        batch: offlineQueue.map((item) => ({
          tenantId: 'tenant_nova_default',
          employeeId: 'emp_001',
          employeeName: 'Aarav Sharma',
          punchType: item.type,
          deviceTimestamp: item.timestamp,
          verificationMethod: 'OFFLINE_SYNC',
          deviceId: 'device_pixel8_aarav_bound',
          clientSequenceNumber: item.seq,
        })),
      };

      const res = await fetch('/api/attendance/offline-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToast(`Successfully synced ${json.data.syncedCount} offline punches to server!`, 'success');
        setOfflineQueue([]);
        setIsOfflineMode(false);
      } else {
        showToast(json.error || 'Sync failed', 'error');
      }
    } catch {
      showToast('Error syncing offline punches', 'error');
    }
  };

  // Trigger Payroll Cycle Lock
  const handleLockPayrollCycle = async () => {
    setIsLockingInProgress(true);
    try {
      const res = await fetch('/api/attendance/cycle-lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycleMonth: '2026-10',
          startDate: '2026-10-01',
          endDate: '2026-10-31',
          cutOffDate: '2026-10-25',
          lockedBy: 'Rahul Garg (HR Operations)',
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setCycleLockData(json.data);
        showToast('Attendance cycle for October 2026 finalized and cryptographically sealed for Payroll!', 'success');
      } else {
        showToast(json.error || 'Cycle locking failed', 'error');
      }
    } catch {
      showToast('Error while locking attendance cycle', 'error');
    } finally {
      setIsLockingInProgress(false);
    }
  };

  // Format seconds to HH:MM:SS
  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Circular progress math (8 hours = 28,800s target)
  const targetSeconds = 8 * 3600;
  const progressPercent = Math.min(100, Math.round((elapsedSeconds / targetSeconds) * 100));
  const strokeDashoffset = 283 - (283 * progressPercent) / 100;

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast notification */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-lg transition-all border animate-in fade-in ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : toastMessage.type === 'warn'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {toastMessage.type === 'warn' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
            {toastMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Sub-Tab Navigation */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5c3ba2] to-[#7f56d9] flex items-center justify-center text-white shadow-md shadow-[#5c3ba2]/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 font-sans tracking-tight flex items-center gap-2">
                Attendance & Time Hub
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-[#5c3ba2] border border-purple-200">
                  Mobile-First PWA
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                AI-native geofencing, selfie liveness, offline sync, team telemetry, and payroll cycle finalization
              </p>
            </div>
          </div>
        </div>

        {/* Sub-tab pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('pwa')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'pwa'
                ? 'bg-white text-[#5c3ba2] shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile PWA Punch</span>
          </button>

          <button
            onClick={() => setActiveSubTab('team')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'team'
                ? 'bg-white text-[#5c3ba2] shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team Live Status</span>
            {teamSummary.anomalies > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('matrix')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'matrix'
                ? 'bg-white text-[#5c3ba2] shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Monthly Matrix</span>
          </button>

          <button
            onClick={() => setActiveSubTab('payroll_lock')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'payroll_lock'
                ? 'bg-white text-[#5c3ba2] shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Payroll Cycle Lock</span>
          </button>
        </div>
      </div>

      {/* ============================================================= */}
      {/* TAB 1: MOBILE PWA CLOCK-IN EXPERIENCE */}
      {/* ============================================================= */}
      {activeSubTab === 'pwa' && (
        <div className="space-y-6">
          {/* Mobile Shell Toggle & DPDP Consent Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-purple-50/60 border border-purple-200/80 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#5c3ba2] text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-900">DPDP Act 2023 Compliant Geolocation Tracking</span>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  GPS coordinates and selfie snapshots are stored with 30-day retention limits solely for shift verification.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                onClick={() => setIsOfflineMode(!isOfflineMode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                  isOfflineMode
                    ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {isOfflineMode ? <WifiOff className="w-3.5 h-3.5 text-rose-600" /> : <Wifi className="w-3.5 h-3.5 text-emerald-600" />}
                <span>{isOfflineMode ? 'Airplane / Offline Mode (ON)' : 'Online Mode'}</span>
              </button>

              <button
                onClick={() => setIsMobileFrame(!isMobileFrame)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#5c3ba2]" />
                <span>{isMobileFrame ? 'Fluid Grid View' : 'Device Frame View'}</span>
              </button>
            </div>
          </div>

          <div className={`grid gap-6 ${isMobileFrame ? 'max-w-md mx-auto' : 'grid-cols-1 lg:grid-cols-12'}`}>
            {/* The Mobile PWA Card */}
            <div className={`${isMobileFrame ? 'w-full' : 'lg:col-span-6'} space-y-5`}>
              <div className="keka-card p-6 border-slate-200 shadow-xl rounded-3xl relative overflow-hidden bg-gradient-to-b from-white via-white to-purple-50/30">
                {/* Header status inside phone */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isClockedIn ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isClockedIn ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {isClockedIn ? 'Currently Clocked In' : 'Currently Clocked Out'}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    Shift: 09:30 - 18:30 (15m Grace)
                  </span>
                </div>

                {/* Circular Working-Hours Progress Ring */}
                <div className="py-6 flex flex-col items-center justify-center">
                  <div className="relative w-48 h-48 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        className="text-slate-100 stroke-current"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        className="text-[#5c3ba2] stroke-current transition-all duration-700 ease-out"
                        strokeWidth="8"
                        strokeDasharray="283"
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>

                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-3xl font-extrabold font-mono text-slate-900 tracking-tight">
                        {formatTimer(elapsedSeconds)}
                      </span>
                      <span className="text-xs text-slate-500 font-medium mt-0.5">
                        {progressPercent}% of 8.0h Target
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 border border-emerald-200">
                        In: {clockInTime}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Clock-In / Out Button */}
                <div className="space-y-3">
                  <button
                    onClick={handlePunchToggle}
                    className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${
                      isClockedIn
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>{isClockedIn ? 'Clock Out for Day / Break' : 'One-Tap Clock In'}</span>
                  </button>

                  {/* Offline Warning Banner if queued */}
                  {offlineQueue.length > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-amber-800">
                        <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
                        <span><strong>{offlineQueue.length}</strong> punches queued offline</span>
                      </div>
                      <button
                        onClick={handleSyncOffline}
                        className="px-2.5 py-1 bg-amber-600 text-white font-bold rounded-lg text-[11px] hover:bg-amber-700"
                      >
                        Sync Now
                      </button>
                    </div>
                  )}
                </div>

                {/* Today's Punch Timeline inside Mobile */}
                <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 font-sans">Today's Punch Timeline</span>
                    <span className="text-[11px] text-slate-400">3 Punches Logged</span>
                  </div>

                  <div className="space-y-2">
                    {todayPunches.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold ${
                              p.type === 'IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {p.type}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">{p.time}</div>
                            <div className="text-[10px] text-slate-500">{p.location}</div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              p.status === 'VALID'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {p.status}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">{p.method}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Config & Anomaly Simulation Console */}
            <div className={`${isMobileFrame ? 'w-full' : 'lg:col-span-6'} space-y-5`}>
              <div className="keka-card p-6 border-slate-200 shadow-sm rounded-3xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#5c3ba2]" />
                    <h3 className="text-sm font-bold text-slate-900 font-sans">
                      Verification Anchors & Field Mode
                    </h3>
                  </div>
                  <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                    Live Telemetry
                  </span>
                </div>

                {/* Office Geofence Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Active Office Geofence
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {DEFAULT_GEOFENCES.map((zone) => (
                      <button
                        key={zone.id}
                        onClick={() => setSelectedGeofence(zone)}
                        className={`p-3 rounded-2xl text-left border transition-all text-xs ${
                          selectedGeofence.id === zone.id
                            ? 'bg-purple-50/70 border-[#5c3ba2] text-slate-900 ring-2 ring-[#5c3ba2]/20'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-bold flex items-center justify-between">
                          <span>{zone.name}</span>
                          {selectedGeofence.id === zone.id && <CheckCircle2 className="w-3.5 h-3.5 text-[#5c3ba2]" />}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 truncate">{zone.locationName}</div>
                        <div className="text-[10px] text-[#5c3ba2] font-semibold mt-1">Perimeter: {zone.radiusMeters}m</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Field Work & Client Visit Toggle */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800">Field / Client Visit (On-Duty)</span>
                      <p className="text-[11px] text-slate-500">Enable when punching at client premises outside HQ</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isOnDutyFieldVisit}
                      onChange={(e) => setIsOnDutyFieldVisit(e.target.checked)}
                      className="w-4 h-4 accent-[#5c3ba2] rounded"
                    />
                  </div>

                  {isOnDutyFieldVisit && (
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block">Client / Site Name</label>
                        <input
                          type="text"
                          value={clientVisitName}
                          onChange={(e) => setClientVisitName(e.target.value)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block">Meeting / Agenda Note</label>
                        <input
                          type="text"
                          value={clientNotes}
                          onChange={(e) => setClientNotes(e.target.value)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Selfie Liveness & Mock GPS Simulator */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-[#5c3ba2]" />
                        Selfie Liveness
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {(selfieScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Facial depth & blink analysis threshold is 70%
                    </p>
                    <button
                      onClick={() => setSelfieScore(selfieScore === 0.96 ? 0.45 : 0.96)}
                      className="text-[10px] font-semibold text-[#5c3ba2] hover:underline"
                    >
                      Toggle Low Liveness (0.45)
                    </button>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Mock GPS Test
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isMockGpsActive ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                        {isMockGpsActive ? 'Spoofed' : 'Clean'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Simulate fake GPS emulator coordinates
                    </p>
                    <button
                      onClick={() => setIsMockGpsActive(!isMockGpsActive)}
                      className="text-[10px] font-semibold text-amber-700 hover:underline"
                    >
                      {isMockGpsActive ? 'Disable Spoofing' : 'Simulate Mock Jump'}
                    </button>
                  </div>
                </div>

                {/* Device Hardware Binding Card */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-slate-600" />
                    <div>
                      <div className="font-bold text-slate-800">Authorized Device Binding</div>
                      <div className="text-[10px] text-slate-500 font-mono">Pixel 8 Pro • ID: dev_pixel8_aarav_bound</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Bound
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 2: MANAGER LIVE TEAM STATUS */}
      {/* ============================================================= */}
      {activeSubTab === 'team' && (
        <div className="space-y-6">
          {/* Summary Metric Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="keka-card p-4 border-l-4 border-l-purple-500">
              <span className="text-xs text-slate-400 font-medium">Total Team Members</span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{teamSummary.total}</div>
              <span className="text-[11px] text-slate-500 font-medium">Engineering & HR</span>
            </div>

            <div className="keka-card p-4 border-l-4 border-l-emerald-500">
              <span className="text-xs text-slate-400 font-medium">Clocked In (Active)</span>
              <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">{teamSummary.clockedIn}</div>
              <span className="text-[11px] text-emerald-600 font-semibold">1 On Client Visit</span>
            </div>

            <div className="keka-card p-4 border-l-4 border-l-amber-500">
              <span className="text-xs text-slate-400 font-medium">Late Arrivals</span>
              <div className="text-2xl font-bold font-mono text-amber-700 mt-1">{teamSummary.lateArrivals}</div>
              <span className="text-[11px] text-amber-600 font-semibold">Past 15m Grace</span>
            </div>

            <div className="keka-card p-4 border-l-4 border-l-rose-500">
              <span className="text-xs text-slate-400 font-medium">Anomalies Detected</span>
              <div className="text-2xl font-bold font-mono text-rose-700 mt-1">{teamSummary.anomalies}</div>
              <span className="text-[11px] text-rose-600 font-semibold">Human Review Required</span>
            </div>
          </div>

          {/* Live Team Table */}
          <div className="keka-card p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-sans flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#5c3ba2]" />
                  Live Team Presence Roster
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time GPS anchors, shift times, and anomaly diagnostics for direct reports
                </p>
              </div>

              <button
                onClick={fetchTeamStatus}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#5c3ba2]" />
                <span>Refresh Live Telemetry</span>
              </button>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 font-semibold border-y border-slate-200/80">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Shift & Policy</th>
                    <th className="py-3 px-4">Punch In</th>
                    <th className="py-3 px-4">Current Status</th>
                    <th className="py-3 px-4">Location / Site</th>
                    <th className="py-3 px-4 text-right">Anomalies</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamMembers.map((emp) => (
                    <tr key={emp.employeeId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div className="font-bold">{emp.employeeName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{emp.employeeId}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{emp.department}</td>
                      <td className="py-3.5 px-4 text-slate-600">{emp.shiftName}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-800">
                        {emp.punchInTime ? new Date(emp.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </td>
                      <td className="py-3.5 px-4">
                        {emp.currentStatus === 'CLOCKED_IN' && (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                            Clocked In
                          </span>
                        )}
                        {emp.currentStatus === 'ON_DUTY' && (
                          <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                            On Duty (Client Visit)
                          </span>
                        )}
                        {emp.currentStatus === 'NOT_YET_IN' && (
                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                            Not Yet In
                          </span>
                        )}
                        {emp.currentStatus === 'CLOCKED_OUT' && (
                          <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200">
                            Clocked Out
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {emp.location || 'Cyber City HQ'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {emp.anomalyDetected ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Suspicious Activity
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Verified
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 3: MONTHLY MATRIX & REGULARIZATION */}
      {/* ============================================================= */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-6">
          {/* AI Nudge Banner */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold">NovaHR AI Attendance Nudge:</span>
                <span className="ml-1 text-slate-700">
                  You have 1 unregularized late mark on Oct 14. Regularize before the payroll cut-off on <strong>Oct 25</strong> to prevent a 0.5-day Loss of Pay (LOP) deduction.
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                const lateItem = attendanceList.find((r) => r.status === 'Late');
                if (lateItem) setSelectedRecordForRegularize(lateItem);
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 shrink-0"
            >
              1-Click Regularize
            </button>
          </div>

          {/* Matrix Table */}
          <div className="keka-card p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-sans flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#5c3ba2]" />
                  Monthly Attendance Records (October 2026)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any row to view punch breakdown or initiate workflow regularization
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

            {/* Table */}
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 font-semibold border-y border-slate-200/80">
                    <th className="py-3 px-4">Date & Day</th>
                    <th className="py-3 px-4">Check In</th>
                    <th className="py-3 px-4">Check Out</th>
                    <th className="py-3 px-4">Break Mins</th>
                    <th className="py-3 px-4">Work Hours</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Regularization Workflow</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceList
                    .filter((r) => filterStatus === 'ALL' || r.status === filterStatus)
                    .map((rec) => (
                      <tr key={rec.date} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-slate-900">
                          <span className="font-bold">{rec.date}</span>
                          <span className="text-slate-400 block text-[11px] font-sans">{rec.day}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">{rec.checkIn}</td>
                        <td className="py-3 px-4 font-mono text-slate-700">{rec.checkOut}</td>
                        <td className="py-3 px-4 text-slate-600">{rec.breakMinutes > 0 ? `${rec.breakMinutes}m` : '--'}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{rec.effectiveHours}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                              rec.status === 'Present'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : rec.status === 'Late'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : rec.status === 'WFH'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {rec.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
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
                        <td className="py-3 px-4 text-right">
                          {rec.status === 'Late' && !rec.regularizationStatus && (
                            <button
                              onClick={() => setSelectedRecordForRegularize(rec)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                            >
                              Regularize
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Regularize Modal */}
          {selectedRecordForRegularize && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#5c3ba2]" />
                    <h3 className="text-base font-bold text-slate-900 font-sans">
                      Regularization Workflow Trigger
                    </h3>
                  </div>
                  <button onClick={() => setSelectedRecordForRegularize(null)} className="text-slate-400 hover:text-slate-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-100 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date:</span>
                    <span className="font-bold text-slate-900 font-mono">{selectedRecordForRegularize.date} ({selectedRecordForRegularize.day})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Recorded Hours:</span>
                    <span className="font-mono text-slate-800">{selectedRecordForRegularize.checkIn} → {selectedRecordForRegularize.checkOut}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">Reason for Regularization *</label>
                  <select
                    value={regularizeReason}
                    onChange={(e) => setRegularizeReason(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Biometric Machine / Network Glitch">Biometric Machine / Network Glitch</option>
                    <option value="On-Site Client Meeting">External Client Meeting / On-Site Deployment</option>
                    <option value="Heavy Traffic / Metro Delay">Severe Highway / Metro Commute Delay</option>
                    <option value="Approved Pre-Planned WFH">Pre-Approved WFH / Power Outage</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">Comments for Reporting Manager</label>
                  <textarea
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="Briefly explain the cause of delay..."
                    rows={3}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setSelectedRecordForRegularize(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setAttendanceList((prev) =>
                        prev.map((item) =>
                          item.date === selectedRecordForRegularize.date
                            ? { ...item, regularizationStatus: 'Pending', regularizationReason: regularizeReason }
                            : item
                        )
                      );
                      showToast(`Regularization for ${selectedRecordForRegularize.date} submitted to Workflow Engine!`, 'success');
                      setSelectedRecordForRegularize(null);
                    }}
                    className="btn-keka-primary px-4 py-2 text-xs font-semibold"
                  >
                    Submit via Workflow Builder
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 4: PAYROLL CYCLE FINALIZATION & LOCK */}
      {/* ============================================================= */}
      {activeSubTab === 'payroll_lock' && (
        <div className="space-y-6">
          <div className="keka-card p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-sans flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#5c3ba2]" />
                  Monthly Attendance Cycle Finalization (October 2026)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Computes unregularized Loss of Pay (LOP) days and overtime hours; locks data with an immutable SHA-256 seal.
                </p>
              </div>

              <button
                onClick={handleLockPayrollCycle}
                disabled={isLockingInProgress}
                className="btn-keka-primary px-4 py-2 text-xs font-semibold flex items-center gap-1.5 shadow-md"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isLockingInProgress ? 'Finalizing Cycle...' : 'Finalize & Lock October Cycle'}</span>
              </button>
            </div>

            {/* If cycle is locked */}
            {cycleLockData ? (
              <div className="space-y-5 animate-in fade-in">
                {/* Cryptographic Seal Banner */}
                <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold flex items-center gap-2 text-emerald-400">
                      <ShieldCheck className="w-4 h-4" />
                      Cryptographic Hand-Off Seal Generated
                    </span>
                    <span className="font-mono text-slate-400 text-[11px]">{cycleLockData.lockedAt}</span>
                  </div>
                  <div className="font-mono text-xs text-slate-300 break-all bg-black/40 p-2.5 rounded-xl border border-slate-800">
                    SHA-256: {cycleLockData.checksumSha256}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Locked By: {cycleLockData.lockedBy}</span>
                    <span>Total Employees Finalized: {cycleLockData.totalEmployees}</span>
                    <span>Total Org LOP Days: {cycleLockData.totalLopDays}</span>
                  </div>
                </div>

                {/* Finalized Employees Breakdown Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 text-slate-500 font-semibold border-y border-slate-200/80">
                        <th className="py-3 px-4">Employee</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Total Days</th>
                        <th className="py-3 px-4">Present</th>
                        <th className="py-3 px-4">Paid Leave</th>
                        <th className="py-3 px-4">Loss of Pay (LOP)</th>
                        <th className="py-3 px-4">Overtime Hours</th>
                        <th className="py-3 px-4 text-right">Net Payable Days</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cycleLockData.employees.map((emp) => (
                        <tr key={emp.employeeId} className="hover:bg-slate-50/60">
                          <td className="py-3 px-4 font-bold text-slate-900">{emp.employeeName}</td>
                          <td className="py-3 px-4 text-slate-600">{emp.department}</td>
                          <td className="py-3 px-4 font-mono">{emp.totalCalendarDays}</td>
                          <td className="py-3 px-4 font-mono text-emerald-700 font-semibold">{emp.presentDays}</td>
                          <td className="py-3 px-4 font-mono text-purple-700">{emp.approvedLeaveDays}</td>
                          <td className="py-3 px-4 font-mono font-bold text-rose-700">
                            {emp.lossOfPayDays > 0 ? `-${emp.lossOfPayDays}` : '0.0'}
                          </td>
                          <td className="py-3 px-4 font-mono text-blue-700">+{emp.overtimeHours}h</td>
                          <td className="py-3 px-4 font-mono font-extrabold text-slate-900 text-right">
                            {emp.netPayableDays} Days
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <Clock className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">October 2026 Cycle Pending Finalization</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Click the button above to run the rules engine, compute unregularized LOP days, and generate the cryptographic hand-off package for the Payroll engine.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
