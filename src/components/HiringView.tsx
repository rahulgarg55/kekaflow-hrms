'use client';

import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Users,
  UserCheck,
  Star,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  Filter,
  Plus,
  Eye,
  EyeOff,
  Sparkles,
  FileText,
  Building2,
  MapPin,
  Calendar,
  X,
  Send,
  Download,
  ShieldCheck,
  Award,
  ArrowRight,
  Sliders,
  DollarSign,
  UserPlus,
} from 'lucide-react';
import {
  CandidateProfile,
  JobRequisition,
  InterviewScorecard,
  CandidateOffer,
  CandidateStage,
  EmployeeConversionResult,
} from '../lib/ats/types';
import { SEED_JOBS, SEED_CANDIDATES, SEED_SCORECARDS, SEED_OFFERS } from '../lib/ats/atsStore';

export const HiringView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'pipeline' | 'jobs' | 'careers' | 'scorecards' | 'offers'>('pipeline');
  const [candidates, setCandidates] = useState<CandidateProfile[]>(SEED_CANDIDATES);
  const [jobs, setJobs] = useState<JobRequisition[]>(SEED_JOBS);
  const [scorecards, setScorecards] = useState<InterviewScorecard[]>(SEED_SCORECARDS);
  const [offers, setOffers] = useState<CandidateOffer[]>(SEED_OFFERS);

  // Filters & Toggles
  const [selectedJobId, setSelectedJobId] = useState<string>('ALL');
  const [isBlindScreeningMode, setIsBlindScreeningMode] = useState<boolean>(false);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateProfile | null>(null);

  // Modals
  const [isNewRequisitionOpen, setIsNewRequisitionOpen] = useState<boolean>(false);
  const [isPublicApplyOpen, setIsPublicApplyOpen] = useState<boolean>(false);
  const [conversionModalData, setConversionModalData] = useState<EmployeeConversionResult | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warn' } | null>(null);

  // New Requisition Form State
  const [reqTitle, setReqTitle] = useState<string>('Senior Frontend Engineer (React 19)');
  const [reqDept, setReqDept] = useState<string>('Engineering');
  const [reqLocation, setReqLocation] = useState<string>('DLF Cyber City, Gurugram');
  const [reqMinExp, setReqMinExp] = useState<number>(4);
  const [reqMaxExp, setReqMaxExp] = useState<number>(7);
  const [reqMinSalary, setReqMinSalary] = useState<number>(20);
  const [reqMaxSalary, setReqMaxSalary] = useState<number>(28);
  const [reqHeadcount, setReqHeadcount] = useState<number>(1);
  const [reqManager, setReqManager] = useState<string>('Aarav Sharma');

  // Candidate Apply Form State
  const [applyName, setApplyName] = useState<string>('Rishabh Dev');
  const [applyEmail, setApplyEmail] = useState<string>('rishabh.dev@example.com');
  const [applyPhone, setApplyPhone] = useState<string>('+91 98765 11223');
  const [applyResumeText, setApplyResumeText] = useState<string>(
    'Full Stack React Engineer with 5 years experience at Urban Company. Skills: React, Node.js, TypeScript, PostgreSQL, REST APIs. Current CTC: 19 LPA, Expected CTC: 24 LPA, Notice Period: 30 days.'
  );
  const [applyConsent, setApplyConsent] = useState<boolean>(true);

  // Score override state
  const [overrideScore, setOverrideScore] = useState<number>(90);
  const [overrideNotes, setOverrideNotes] = useState<string>('');

  const showToast = (text: string, type: 'success' | 'warn' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const STAGES: Array<{ id: CandidateStage; label: string; color: string }> = [
    { id: 'APPLIED', label: 'Applied', color: 'border-t-blue-500' },
    { id: 'SCREENING', label: 'Screening', color: 'border-t-purple-500' },
    { id: 'TECHNICAL_INTERVIEW', label: 'Tech Round', color: 'border-t-amber-500' },
    { id: 'CULTURE_FIT', label: 'HR / Culture', color: 'border-t-indigo-500' },
    { id: 'OFFER_MADE', label: 'Offer Made', color: 'border-t-emerald-500' },
    { id: 'HIRED', label: 'Hired', color: 'border-t-emerald-700' },
  ];

  // Move candidate to another stage
  const handleMoveStage = async (candidateId: string, nextStage: CandidateStage) => {
    try {
      const res = await fetch('/api/ats/candidates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, stage: nextStage }),
      });
      if (res.ok) {
        setCandidates((prev) =>
          prev.map((c) => (c.id === candidateId ? { ...c, stage: nextStage } : c))
        );
        showToast(`Candidate moved to ${nextStage.replace('_', ' ')} stage.`, 'success');
        if (selectedCandidate && selectedCandidate.id === candidateId) {
          setSelectedCandidate({ ...selectedCandidate, stage: nextStage });
        }
      }
    } catch {
      showToast('Error updating candidate stage', 'warn');
    }
  };

  // Submit Recruiter Score Override
  const handleSaveScoreOverride = async () => {
    if (!selectedCandidate) return;
    try {
      const res = await fetch('/api/ats/candidates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: selectedCandidate.id,
          recruiterScoreOverride: overrideScore,
          recruiterNotes: overrideNotes,
        }),
      });
      if (res.ok) {
        setCandidates((prev) =>
          prev.map((c) =>
            c.id === selectedCandidate.id
              ? {
                  ...c,
                  aiScore: {
                    ...c.aiScore,
                    recruiterScoreOverride: overrideScore,
                    recruiterNotes: overrideNotes,
                  },
                }
              : c
          )
        );
        showToast('Recruiter score override saved. Human decision recorded in audit log.', 'success');
      }
    } catch {
      showToast('Error saving override', 'warn');
    }
  };

  // Convert Candidate to Employee (1-Click)
  const handleConvertToEmployee = async (candidateId: string) => {
    try {
      const res = await fetch('/api/ats/convert-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setConversionModalData(json.data);
        setCandidates((prev) =>
          prev.map((c) => (c.id === candidateId ? { ...c, stage: 'HIRED' } : c))
        );
        showToast(`Candidate converted to official employee (${json.data.employeeId})!`, 'success');
      } else {
        showToast(json.error || 'Conversion failed', 'warn');
      }
    } catch {
      showToast('Error executing employee conversion', 'warn');
    }
  };

  // Submit New Requisition
  const handleCreateRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: reqTitle,
        department: reqDept,
        location: reqLocation,
        employmentType: 'FULL_TIME',
        experienceRangeYears: { min: reqMinExp, max: reqMaxExp },
        salaryRangeLpa: { min: reqMinSalary, max: reqMaxSalary },
        headcountBudget: { totalBudgeted: 3, currentFilled: 1, requestedCount: reqHeadcount },
        hiringManager: reqManager,
        mustHaveSkills: ['React', 'TypeScript', 'Node.js'],
        goodToHaveSkills: ['Tailwind CSS', 'PostgreSQL'],
        description: `New headcount requisition for ${reqTitle} in ${reqDept}.`,
      };

      const res = await fetch('/api/ats/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setJobs((prev) => [...prev, json.data]);
        showToast(`Job requisition created and approved within headcount budget!`, 'success');
        setIsNewRequisitionOpen(false);
      } else {
        showToast(json.error || 'Failed to create requisition', 'warn');
      }
    } catch {
      showToast('Error submitting requisition', 'warn');
    }
  };

  // Submit Candidate Application
  const handleApplyCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        jobId: jobs[0]?.id || 'job_fullstack_01',
        fullName: applyName,
        email: applyEmail,
        phone: applyPhone,
        resumeRawText: applyResumeText,
        source: 'Direct Careers Portal',
      };

      const res = await fetch('/api/ats/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setCandidates((prev) => [json.data.candidate, ...prev]);
        showToast('Application received! Resume parsed and scored with AI explainable breakdown.', 'success');
        setIsPublicApplyOpen(false);
      } else {
        showToast(json.error || 'Application submission failed', 'warn');
      }
    } catch {
      showToast('Error processing candidate application', 'warn');
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    if (selectedJobId === 'ALL') return true;
    return c.jobId === selectedJobId;
  });

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-lg border animate-in fade-in ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Sub-Tab Navigation */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5c3ba2] to-[#7f56d9] flex items-center justify-center text-white shadow-md shadow-[#5c3ba2]/20">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 font-sans tracking-tight flex items-center gap-2">
                Hire & ATS Hub
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-[#5c3ba2] border border-purple-200">
                  Keka Talent Suite
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Headcount requisitions, candidate pipeline Kanban, explainable AI ranking, and Indian CTC offers
              </p>
            </div>
          </div>
        </div>

        {/* Sub-tab pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('pipeline')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'pipeline'
                ? 'bg-white text-[#5c3ba2] shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Candidate Pipeline</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 text-[#5c3ba2]">
              {candidates.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('jobs')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'jobs'
                ? 'bg-white text-[#5c3ba2] shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Job Requisitions</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
              {jobs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('careers')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'careers'
                ? 'bg-white text-[#5c3ba2] shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Careers Portal</span>
          </button>

          <button
            onClick={() => setActiveSubTab('scorecards')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'scorecards'
                ? 'bg-white text-[#5c3ba2] shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-500" />
            <span>Scorecards</span>
          </button>

          <button
            onClick={() => setActiveSubTab('offers')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'offers'
                ? 'bg-white text-[#5c3ba2] shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-emerald-600" />
            <span>Offers & Onboarding</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              {offers.length}
            </span>
          </button>
        </div>
      </div>

      {/* ============================================================= */}
      {/* SUB-TAB 1: CANDIDATE PIPELINE (KANBAN BOARD) */}
      {/* ============================================================= */}
      {activeSubTab === 'pipeline' && (
        <div className="space-y-5">
          {/* Controls Bar: Job Filter, Blind Screening Switch & Requisition CTA */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Filter by Role:</span>
              </div>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="text-xs font-semibold p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5c3ba2]/20"
              >
                <option value="ALL">All Open Positions ({candidates.length} candidates)</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.department})
                  </option>
                ))}
              </select>

              {/* Blind Screening / Bias Reduction Toggle */}
              <button
                onClick={() => setIsBlindScreeningMode(!isBlindScreeningMode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                  isBlindScreeningMode
                    ? 'bg-purple-100 border-[#5c3ba2] text-[#5c3ba2] font-bold ring-2 ring-[#5c3ba2]/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {isBlindScreeningMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
                <span>Blind Screening (Bias-Free)</span>
              </button>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => setIsPublicApplyOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-[#5c3ba2]" />
                <span>Simulate Candidate Apply</span>
              </button>

              <button
                onClick={() => setIsNewRequisitionOpen(true)}
                className="btn-keka-primary px-4 py-2 text-xs font-semibold flex items-center gap-1.5 shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Job Requisition</span>
              </button>
            </div>
          </div>

          {/* Blind Screening Notice Banner */}
          {isBlindScreeningMode && (
            <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200 text-xs text-[#5c3ba2] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-[#5c3ba2]" />
                <span>
                  <strong>Blind Screening Active:</strong> Candidate names, photos, gender, and institutions are masked to eliminate unconscious bias until the technical interview shortlist.
                </span>
              </div>
              <span className="text-[11px] font-semibold bg-white px-2 py-0.5 rounded-full border border-purple-200">
                Fairness Mode
              </span>
            </div>
          )}

          {/* Kanban Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3.5 items-start">
            {STAGES.map((col) => {
              const colCandidates = filteredCandidates.filter((c) => c.stage === col.id);
              return (
                <div key={col.id} className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-3 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-800 font-sans">{col.label}</span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                      {colCandidates.length}
                    </span>
                  </div>

                  <div className="space-y-2.5 min-h-[300px]">
                    {colCandidates.map((cand) => {
                      const displayName = isBlindScreeningMode ? `Candidate #${cand.id.slice(-3)}` : cand.fullName;
                      const displayCollege = isBlindScreeningMode ? 'Accredited University' : cand.collegeName;

                      return (
                        <div
                          key={cand.id}
                          onClick={() => setSelectedCandidate(cand)}
                          className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-2 group"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-bold text-xs text-slate-900 group-hover:text-[#5c3ba2] transition-colors">
                                {displayName}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                {cand.currentCompany} • {cand.totalExperienceYears} yrs
                              </div>
                            </div>

                            {/* Match score pill */}
                            <span
                              className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border ${
                                cand.aiScore.overallMatchPercent >= 90
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : cand.aiScore.overallMatchPercent >= 80
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {cand.aiScore.recruiterScoreOverride || cand.aiScore.overallMatchPercent}%
                            </span>
                          </div>

                          {/* Skill Tags */}
                          <div className="flex flex-wrap gap-1">
                            {cand.parsedSkills.slice(0, 3).map((sk) => (
                              <span
                                key={sk}
                                className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600"
                              >
                                {sk}
                              </span>
                            ))}
                          </div>

                          {/* Compensation & Notice Period */}
                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                            <span className="font-semibold text-slate-700">₹{cand.expectedCtcLpa} LPA</span>
                            <span>{cand.noticePeriodDays}d Notice</span>
                          </div>
                        </div>
                      );
                    })}

                    {colCandidates.length === 0 && (
                      <div className="py-8 text-center text-[11px] text-slate-400 italic">
                        No candidates
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* SUB-TAB 2: JOB OPENINGS & HEADCOUNT REQUISITIONS */}
      {/* ============================================================= */}
      {activeSubTab === 'jobs' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-sans">Active Job Requisitions</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Managed under approval workflow with real-time department headcount budget tracking
              </p>
            </div>
            <button
              onClick={() => setIsNewRequisitionOpen(true)}
              className="btn-keka-primary px-4 py-2 text-xs font-semibold flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Headcount Requisition</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <div key={job.id} className="keka-card p-6 border-slate-200 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                      {job.department}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1.5">{job.title}</h4>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {job.location}
                      </span>
                      <span>•</span>
                      <span>{job.experienceRangeYears.min}-{job.experienceRangeYears.max} yrs exp</span>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    ₹{job.salaryRangeLpa.min} - {job.salaryRangeLpa.max} LPA
                  </span>
                </div>

                {/* Headcount Budget Bar */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-600">Headcount Budget:</span>
                    <span className="text-slate-900 font-mono">
                      {job.headcountBudget.currentFilled} of {job.headcountBudget.totalBudgeted} Filled ({job.headcountBudget.requestedCount} Open)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#5c3ba2] h-full rounded-full transition-all"
                      style={{
                        width: `${(job.headcountBudget.currentFilled / job.headcountBudget.totalBudgeted) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Must Have Skills */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-600">Required Stack:</span>
                  <div className="flex flex-wrap gap-1">
                    {job.mustHaveSkills.map((sk) => (
                      <span
                        key={sk}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-[#5c3ba2] border border-purple-200"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <span>Hiring Manager: <strong>{job.hiringManager}</strong></span>
                  <button
                    onClick={() => {
                      setSelectedJobId(job.id);
                      setActiveSubTab('pipeline');
                    }}
                    className="text-[#5c3ba2] font-bold hover:underline flex items-center gap-1"
                  >
                    <span>View Candidates</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* SUB-TAB 3: BRANDED PUBLIC CAREERS PORTAL PREVIEW */}
      {/* ============================================================= */}
      {activeSubTab === 'careers' && (
        <div className="space-y-6">
          <div className="keka-card p-6 shadow-sm border-slate-200 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl">
            <div className="max-w-2xl space-y-3">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-purple-200 border border-white/20">
                Tenant Public Careers Portal
              </span>
              <h2 className="text-2xl font-bold font-sans">Build the Future of Work at NovaHR</h2>
              <p className="text-xs text-slate-300">
                Join our mission-driven product and engineering teams in DLF Cyber City Gurugram & Indiranagar Bengaluru. Transparent salary bands, comprehensive health benefits, and flexible hybrid culture.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => setIsPublicApplyOpen(true)}
                  className="px-4 py-2 rounded-xl bg-white text-[#5c3ba2] font-bold text-xs hover:bg-slate-100 shadow-lg"
                >
                  Apply for Open Roles
                </button>
                <span className="text-xs text-slate-400">careers.novahr.internal/openings</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Current Job Openings (Public View)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs.map((job) => (
                <div key={job.id} className="keka-card p-5 border-slate-200 shadow-2xs space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{job.title}</h4>
                      <div className="text-xs text-slate-500 mt-0.5">{job.department} • {job.location}</div>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ₹{job.salaryRangeLpa.min} - {job.salaryRangeLpa.max} LPA
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{job.description}</p>
                  <button
                    onClick={() => setIsPublicApplyOpen(true)}
                    className="w-full py-2 rounded-xl text-xs font-bold bg-purple-50 text-[#5c3ba2] hover:bg-purple-100 transition-colors"
                  >
                    Apply Now (Direct Applicant)
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* SUB-TAB 4: INTERVIEW SCORECARDS & PANELS */}
      {/* ============================================================= */}
      {activeSubTab === 'scorecards' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-sans">Structured Interview Scorecards</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Competency-based ratings with interviewer alignment and disagreement detection
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scorecards.map((sc) => (
              <div key={sc.id} className="keka-card p-5 border-slate-200 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                      {sc.interviewRound}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{sc.candidateName}</h4>
                    <div className="text-xs text-slate-500">{sc.jobTitle}</div>
                  </div>

                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                      sc.overallRecommendation === 'STRONG_HIRE'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-blue-50 text-blue-800 border-blue-200'
                    }`}
                  >
                    {sc.overallRecommendation.replace('_', ' ')}
                  </span>
                </div>

                {/* Competency Ratings */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {sc.competencyRatings.map((comp, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{comp.competency}</span>
                        <div className="flex items-center text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < comp.rating ? 'fill-current' : 'text-slate-300'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600">{comp.comments}</p>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 text-xs text-slate-700">
                  <span className="font-bold block text-[#5c3ba2]">Interviewer Summary Notes:</span>
                  <p className="mt-0.5 text-[11px]">{sc.summaryNotes}</p>
                  <div className="text-[10px] text-slate-400 mt-1 text-right">Interviewer: {sc.interviewerName}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* SUB-TAB 5: OFFERS & 1-CLICK EMPLOYEE ONBOARDING */}
      {/* ============================================================= */}
      {activeSubTab === 'offers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-sans">
                Offers & 1-Click Employee Onboarding
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Indian CTC salary structure with e-signature tracking and instant employee record generation
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {offers.map((offer) => (
              <div key={offer.id} className="keka-card p-6 border-slate-200 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900">{offer.candidateName}</h4>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Offer Accepted & E-Signed
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {offer.jobTitle} • {offer.department} • Joining: <strong>{offer.joiningDate}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-lg font-extrabold text-slate-900 font-mono">
                      ₹{offer.offeredCtcLpa} LPA
                    </span>
                    <button
                      onClick={() => handleConvertToEmployee(offer.candidateId)}
                      className="btn-keka-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 shadow-md"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>1-Click Convert to Employee</span>
                    </button>
                  </div>
                </div>

                {/* Indian CTC Breakup Table */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Indian Statutory Salary Structure (Annual CTC: ₹{offer.offeredCtcLpa} Lakhs)</span>
                    <span className="text-[#5c3ba2] font-mono">Monthly Gross: ₹{offer.breakup.monthlyGross.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Basic (50%)</span>
                      <span className="font-bold font-mono text-slate-900">₹{offer.breakup.basicSalary.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">HRA (20%)</span>
                      <span className="font-bold font-mono text-slate-900">₹{offer.breakup.hra.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Special Allowance</span>
                      <span className="font-bold font-mono text-slate-900">₹{offer.breakup.specialAllowance.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Employer PF (12%)</span>
                      <span className="font-bold font-mono text-slate-900">₹{offer.breakup.employerPf.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Gratuity (4.81%)</span>
                      <span className="font-bold font-mono text-slate-900">₹{offer.breakup.gratuity.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200">
                      <span className="text-[10px] text-[#5c3ba2] font-semibold block">Approx In-Hand</span>
                      <span className="font-bold font-mono text-[#5c3ba2]">₹{offer.breakup.monthlyTakeHomeApprox.toLocaleString('en-IN')}/mo</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* CANDIDATE DETAIL DRAWER MODAL */}
      {/* ============================================================= */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#5c3ba2] font-bold flex items-center justify-center text-sm">
                  {selectedCandidate.fullName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-sans">
                    {isBlindScreeningMode ? `Candidate #${selectedCandidate.id.slice(-3)}` : selectedCandidate.fullName}
                  </h3>
                  <div className="text-xs text-slate-500">
                    {selectedCandidate.jobTitle} • {selectedCandidate.currentCompany}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedCandidate(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI Explainable Score Card */}
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#5c3ba2]" />
                  <span className="font-bold text-slate-900">Explainable AI Candidate Match</span>
                </div>
                <span className="text-sm font-extrabold text-[#5c3ba2] font-mono">
                  {selectedCandidate.aiScore.overallMatchPercent}% Match
                </span>
              </div>

              <div className="space-y-1 text-slate-700">
                <span className="font-semibold block text-[11px] text-[#5c3ba2]">Key Strengths:</span>
                {selectedCandidate.aiScore.strengths.map((st, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{st}</span>
                  </div>
                ))}
              </div>

              {selectedCandidate.aiScore.potentialGaps.length > 0 && (
                <div className="space-y-1 text-slate-700 pt-1">
                  <span className="font-semibold block text-[11px] text-amber-700">Identified Gaps:</span>
                  {selectedCandidate.aiScore.potentialGaps.map((gp, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{gp}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Human Recruiter Override Dock */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#5c3ba2]" />
                Human Recruiter Decision Override (Audit Logged)
              </span>
              <p className="text-[11px] text-slate-500">
                Our policy forbids auto-rejection on AI scores. Recruiters have final authority to override ratings.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={overrideScore}
                  onChange={(e) => setOverrideScore(parseInt(e.target.value, 10))}
                  className="flex-1 accent-[#5c3ba2]"
                />
                <span className="font-mono font-bold text-slate-900 w-12 text-right">{overrideScore}%</span>
              </div>
              <input
                type="text"
                placeholder="Optional recruiter override notes..."
                value={overrideNotes}
                onChange={(e) => setOverrideNotes(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white"
              />
              <button
                onClick={handleSaveScoreOverride}
                className="px-3 py-1.5 rounded-xl bg-purple-100 text-[#5c3ba2] font-bold text-xs hover:bg-purple-200 transition-colors"
              >
                Save Recruiter Override
              </button>
            </div>

            {/* Move Stage CTA Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500">Current Stage: <strong>{selectedCandidate.stage}</strong></span>
              <div className="flex items-center gap-1.5">
                {selectedCandidate.stage !== 'TECHNICAL_INTERVIEW' && (
                  <button
                    onClick={() => handleMoveStage(selectedCandidate.id, 'TECHNICAL_INTERVIEW')}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-semibold"
                  >
                    Move to Tech Round
                  </button>
                )}
                {selectedCandidate.stage !== 'OFFER_MADE' && (
                  <button
                    onClick={() => handleMoveStage(selectedCandidate.id, 'OFFER_MADE')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold"
                  >
                    Make Offer
                  </button>
                )}
                {selectedCandidate.stage === 'OFFER_MADE' && (
                  <button
                    onClick={() => handleConvertToEmployee(selectedCandidate.id)}
                    className="btn-keka-primary px-3.5 py-1.5 font-bold"
                  >
                    1-Click Convert to Employee
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 1-CLICK EMPLOYEE CONVERSION SUCCESS MODAL */}
      {/* ============================================================= */}
      {conversionModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <UserCheck className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 font-sans">
                Employee Conversion Complete! 🎉
              </h3>
              <p className="text-xs text-slate-500">
                Candidate <strong>{conversionModalData.employeeName}</strong> has been converted into an official employee record.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Employee ID:</span>
                <span className="font-mono font-bold text-slate-900">{conversionModalData.employeeId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Official Work Email:</span>
                <span className="font-mono text-slate-800">{conversionModalData.officialEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Designation & Team:</span>
                <span className="text-slate-900 font-semibold">{conversionModalData.designation} ({conversionModalData.department})</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-800">Generated Day-1 Onboarding Checklist:</span>
              {conversionModalData.onboardingChecklist.map((task, i) => (
                <div key={i} className="p-2 rounded-xl bg-purple-50/50 border border-purple-100 text-[11px] flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${task.completed ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{task.item}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setConversionModalData(null)}
              className="w-full btn-keka-primary py-2.5 text-xs font-bold"
            >
              Done & Return to ATS
            </button>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* NEW REQUISITION MODAL */}
      {/* ============================================================= */}
      {isNewRequisitionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 font-sans">
                Create Headcount Requisition
              </h3>
              <button onClick={() => setIsNewRequisitionOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequisition} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Job Role Title *</label>
                <input
                  type="text"
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Department</label>
                  <input
                    type="text"
                    value={reqDept}
                    onChange={(e) => setReqDept(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Hiring Manager</label>
                  <input
                    type="text"
                    value={reqManager}
                    onChange={(e) => setReqManager(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Salary Range (₹ LPA)</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={reqMinSalary}
                      onChange={(e) => setReqMinSalary(parseFloat(e.target.value))}
                      className="w-full p-2 rounded-xl border border-slate-200"
                    />
                    <span>-</span>
                    <input
                      type="number"
                      value={reqMaxSalary}
                      onChange={(e) => setReqMaxSalary(parseFloat(e.target.value))}
                      className="w-full p-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Headcount Requested</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={reqHeadcount}
                    onChange={(e) => setReqHeadcount(parseInt(e.target.value, 10))}
                    className="w-full p-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewRequisitionOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-keka-primary px-4 py-2 font-bold">
                  Submit for Headcount Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* PUBLIC APPLY SIMULATION MODAL */}
      {/* ============================================================= */}
      {isPublicApplyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 font-sans">
                Careers Portal - Apply Now
              </h3>
              <button onClick={() => setIsPublicApplyOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyCandidate} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  value={applyName}
                  onChange={(e) => setApplyName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email *</label>
                  <input
                    type="email"
                    value={applyEmail}
                    onChange={(e) => setApplyEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={applyPhone}
                    onChange={(e) => setApplyPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Resume Raw Text (Simulated OCR / PDF upload) *</label>
                <textarea
                  rows={4}
                  value={applyResumeText}
                  onChange={(e) => setApplyResumeText(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-[11px]"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  checked={applyConsent}
                  onChange={(e) => setApplyConsent(e.target.checked)}
                  className="w-4 h-4 accent-[#5c3ba2] rounded"
                  required
                />
                <span className="text-[11px] text-slate-600">
                  I consent to DPDP Act 2023 compliant talent processing and background verification.
                </span>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPublicApplyOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-keka-primary px-4 py-2 font-bold">
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
