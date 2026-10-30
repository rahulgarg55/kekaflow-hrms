'use client';

import React, { useState } from 'react';
import {
  Users,
  Search,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  ChevronRight,
  ShieldCheck,
  Award,
  Sparkles,
  X,
  ExternalLink,
} from 'lucide-react';
import { EMPLOYEES } from '../data/mockData';
import { Employee } from '../types/hrms';

interface DirectoryViewProps {
  initialSearch?: string;
}

export const DirectoryView: React.FC<DirectoryViewProps> = ({ initialSearch = '' }) => {
  const [search, setSearch] = useState(initialSearch);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [activeEmployeeModal, setActiveEmployeeModal] = useState<Employee | null>(null);

  const departments = ['ALL', 'Engineering', 'Product Design', 'People & HR', 'Marketing', 'Finance'];

  const filteredEmployees = EMPLOYEES.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.role.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      emp.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));

    const matchesDept = selectedDept === 'ALL' || emp.department === selectedDept;

    return matchesSearch && matchesDept;
  });

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ------------------------------------------------------------- */}
      {/* Top Search & Filter Bar */}
      {/* ------------------------------------------------------------- */}
      <div className="keka-card p-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, designation, employee ID, or technical skill..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5c3ba2]/20 focus:border-[#5c3ba2] text-slate-800 placeholder:text-slate-400"
            />
          </div>

          {/* Department Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold overflow-x-auto">
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  selectedDept === dept
                    ? 'bg-white text-[#5c3ba2] shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {dept === 'ALL' ? 'All Departments' : dept}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
          <span>
            Showing <strong>{filteredEmployees.length}</strong> colleagues in the directory
          </span>
          <span className="text-[11px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
            Mohali Technology Park & Remote
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Employee Cards Grid */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEmployees.map((emp) => (
          <div
            key={emp.id}
            onClick={() => setActiveEmployeeModal(emp)}
            className="keka-card p-5 cursor-pointer hover:border-[#5c3ba2]/40 relative group overflow-hidden flex flex-col justify-between"
          >
            <div>
              {/* Header row */}
              <div className="flex items-start gap-3.5 mb-3">
                <img
                  src={emp.avatar}
                  alt={emp.name}
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-100 group-hover:ring-purple-200 transition-all"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-[#5c3ba2] transition-colors">
                      {emp.name}
                    </h4>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-50 text-[#5c3ba2] border border-purple-200">
                      {emp.employeeId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {emp.role}
                  </p>
                  <span className="inline-block text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full mt-1.5">
                    {emp.department}
                  </span>
                </div>
              </div>

              {/* Contact and location info */}
              <div className="space-y-1.5 text-xs text-slate-600 py-2 border-t border-slate-100">
                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{emp.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{emp.location.split(',')[0]}</span>
                </div>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1 mt-2.5">
                {emp.skills.slice(0, 3).map((skill) => (
                  <span
                    key={skill}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-purple-50/70 text-purple-800 border border-purple-100"
                  >
                    {skill}
                  </span>
                ))}
                {emp.skills.length > 3 && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">
                    +{emp.skills.length - 3}
                  </span>
                )}
              </div>
            </div>

            {/* Card footer */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="text-[11px] truncate">
                Reports to: {emp.managerName.split('(')[0]}
              </span>
              <span className="text-[#5c3ba2] font-semibold group-hover:translate-x-0.5 transition-transform flex items-center">
                Profile →
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Detailed Employee Profile Modal */}
      {/* ------------------------------------------------------------- */}
      {activeEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <img
                  src={activeEmployeeModal.avatar}
                  alt={activeEmployeeModal.name}
                  className="w-16 h-16 rounded-2xl object-cover ring-4 ring-purple-100"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 font-sans">
                      {activeEmployeeModal.name}
                    </h3>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-[#5c3ba2]">
                      {activeEmployeeModal.employeeId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {activeEmployeeModal.role} • {activeEmployeeModal.department}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {activeEmployeeModal.location}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveEmployeeModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Work & Reporting Info */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-slate-400 block text-[11px]">Reporting Manager</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {activeEmployeeModal.managerName}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-slate-400 block text-[11px]">Joining Date</span>
                <span className="font-bold text-slate-900 mt-0.5 block font-mono">
                  {activeEmployeeModal.joiningDate}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-slate-400 block text-[11px]">Official Email</span>
                <span className="font-bold text-slate-900 mt-0.5 block truncate">
                  {activeEmployeeModal.email}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-slate-400 block text-[11px]">Direct Reports</span>
                <span className="font-bold text-slate-900 mt-0.5 block font-mono">
                  {activeEmployeeModal.directReportsCount} Team Members
                </span>
              </div>
            </div>

            {/* Skills Matrix */}
            <div>
              <span className="text-xs font-bold text-slate-800 block mb-2">
                Core Competencies & Technical Skills
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeEmployeeModal.skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-purple-50 text-[#5c3ba2] border border-purple-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Close action */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                KekaFlow Directory Record Verified
              </span>
              <button
                onClick={() => setActiveEmployeeModal(null)}
                className="btn-keka-primary px-4 py-2 text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
