'use client';

import React, { useState } from 'react';
import {
  ReceiptText,
  Download,
  Printer,
  X,
  CreditCard,
  Building,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Percent,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { SALARY_SLIPS, CURRENT_USER } from '../data/mockData';
import { SalarySlip } from '../types/hrms';

export const PayrollView: React.FC = () => {
  const [selectedSlip, setSelectedSlip] = useState<SalarySlip | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const activeSlip = selectedSlip || SALARY_SLIPS[0];

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ------------------------------------------------------------- */}
      {/* Top CTC & Salary Cards */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Annual CTC */}
        <div className="keka-card p-5 border-l-4 border-l-[#5c3ba2]">
          <span className="text-xs font-semibold text-slate-500 block mb-1">
            Annual Cost to Company (CTC)
          </span>
          <div className="text-2xl font-extrabold font-mono text-slate-900">
            ₹{(CURRENT_USER.ctc).toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-[#5c3ba2] font-semibold mt-1 block">
            Annual Fixed Compensation
          </span>
        </div>

        {/* Monthly Gross */}
        <div className="keka-card p-5 border-l-4 border-l-indigo-500">
          <span className="text-xs font-semibold text-slate-500 block mb-1">
            Monthly Gross Earnings
          </span>
          <div className="text-2xl font-extrabold font-mono text-indigo-950">
            ₹{activeSlip.grossEarnings.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-indigo-600 font-semibold mt-1 block">
            Before Statutory Taxes
          </span>
        </div>

        {/* Deductions */}
        <div className="keka-card p-5 border-l-4 border-l-rose-500">
          <span className="text-xs font-semibold text-slate-500 block mb-1">
            Statutory Deductions (EPF + TDS + PT)
          </span>
          <div className="text-2xl font-extrabold font-mono text-rose-700">
            -₹{activeSlip.totalDeductions.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-rose-600 font-semibold mt-1 block">
            14.3% of Gross
          </span>
        </div>

        {/* Net Take-Home */}
        <div className="keka-card p-5 bg-gradient-to-br from-emerald-50/50 to-white border-l-4 border-l-emerald-500">
          <span className="text-xs font-semibold text-emerald-800 block mb-1">
            Net In-Hand Pay (Monthly Take-Home)
          </span>
          <div className="text-2xl font-extrabold font-mono text-emerald-700">
            ₹{activeSlip.netTakeHome.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Credit to HDFC •••• 8842
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Earnings vs Deductions Breakdown */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings Card */}
        <div className="keka-card p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 font-sans">
                Earnings Breakdown (October 2026)
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              ₹{activeSlip.grossEarnings.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
              <div>
                <span className="font-semibold text-slate-800 block">Basic Salary</span>
                <span className="text-[11px] text-slate-400">50% of Total Compensation</span>
              </div>
              <span className="font-mono font-bold text-slate-900">
                ₹{activeSlip.basicSalary.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
              <div>
                <span className="font-semibold text-slate-800 block">House Rent Allowance (HRA)</span>
                <span className="text-[11px] text-slate-400">40% of Basic for Non-Metro</span>
              </div>
              <span className="font-mono font-bold text-slate-900">
                ₹{activeSlip.hra.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
              <div>
                <span className="font-semibold text-slate-800 block">Special Allowance</span>
                <span className="text-[11px] text-slate-400">Flexible Monthly Allowance</span>
              </div>
              <span className="font-mono font-bold text-slate-900">
                ₹{activeSlip.specialAllowance.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5">
              <div>
                <span className="font-semibold text-slate-800 block">Conveyance Allowance</span>
                <span className="text-[11px] text-slate-400">Commuting Subsidy</span>
              </div>
              <span className="font-mono font-bold text-slate-900">
                ₹{activeSlip.conveyance.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Deductions Card */}
        <div className="keka-card p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-900 font-sans">
                Statutory Deductions & Taxes
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              -₹{activeSlip.totalDeductions.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
              <div>
                <span className="font-semibold text-slate-800 block">Employee Provident Fund (EPF)</span>
                <span className="text-[11px] text-slate-400">12% Statutory Contribution to EPFO</span>
              </div>
              <span className="font-mono font-bold text-slate-900">
                ₹{activeSlip.epfEmployee.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
              <div>
                <span className="font-semibold text-slate-800 block">Income Tax TDS (Section 192)</span>
                <span className="text-[11px] text-slate-400">New Tax Regime FY 2026-27</span>
              </div>
              <span className="font-mono font-bold text-slate-900">
                ₹{activeSlip.incomeTaxTDS.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
              <div>
                <span className="font-semibold text-slate-800 block">Professional Tax (Punjab PT)</span>
                <span className="text-[11px] text-slate-400">State Statutory Standard Levy</span>
              </div>
              <span className="font-mono font-bold text-slate-900">
                ₹{activeSlip.professionalTax.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5">
              <div>
                <span className="font-semibold text-slate-800 block">ESIC Employee Contribution</span>
                <span className="text-[11px] text-slate-400">Exempt (Monthly gross &gt; ₹21,000)</span>
              </div>
              <span className="font-mono font-bold text-slate-400">₹0</span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Salary Slips History Table */}
      {/* ------------------------------------------------------------- */}
      <div className="keka-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-sans flex items-center gap-2">
              <ReceiptText className="w-4 h-4 text-[#5c3ba2]" />
              Historical Salary Slips & Payslip Archive
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Official digitally signed payroll statements available for download & tax filing
            </p>
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-200/80">
                <th className="py-3 px-4">Pay Period</th>
                <th className="py-3 px-4">Days Paid</th>
                <th className="py-3 px-4">Gross Earnings</th>
                <th className="py-3 px-4">Deductions</th>
                <th className="py-3 px-4">Net Take-Home</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Payment Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {SALARY_SLIPS.map((slip) => (
                <tr key={slip.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {slip.month} {slip.year}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-700">
                    {slip.payableDays} / {slip.daysInMonth} Days
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                    ₹{slip.grossEarnings.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-rose-700">
                    -₹{slip.totalDeductions.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-extrabold text-emerald-700 text-sm">
                    ₹{slip.netTakeHome.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4">
                    {slip.status === 'Paid' ? (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Paid to Bank
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-[#5c3ba2] border border-purple-200">
                        Processed (Due Nov 1)
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">
                    {slip.disbursedDate}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      onClick={() => setSelectedSlip(slip)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-[#5c3ba2] hover:bg-purple-100 border border-purple-200 transition-colors"
                    >
                      View Payslip
                    </button>
                    <button
                      onClick={() => {
                        setSelectedSlip(slip);
                        setTimeout(handlePrint, 300);
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors"
                      title="Download / Print"
                    >
                      <Download className="w-3.5 h-3.5 inline mr-1" />
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* High-Resolution Printable Payslip Modal */}
      {/* ------------------------------------------------------------- */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 space-y-6">
            {/* Header controls (hidden on print) */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 no-print">
              <span className="text-xs font-bold text-purple-700 uppercase tracking-widest font-mono">
                Official Digital Payslip
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="btn-keka-primary px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  onClick={() => setSelectedSlip(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Payslip Container */}
            <div id="printable-payslip" className="bg-white p-2 sm:p-6 space-y-6 text-slate-900 font-sans">
              {/* Company Header */}
              <div className="text-center pb-4 border-b-2 border-slate-800">
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900 font-sans uppercase">
                  KEKAFLOW CLOUD TECHNOLOGIES INDIA PVT. LTD.
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Plot No. C-148, Phase 7, Industrial Area, Mohali, Punjab 160055
                </p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  CIN: U72900PB2021PTC054192 • GSTIN: 03AAECK1294F1Z5
                </p>
                <div className="mt-3 inline-block px-4 py-1 rounded bg-slate-100 border border-slate-300 font-bold text-xs uppercase font-mono">
                  Payslip for {selectedSlip.month} {selectedSlip.year}
                </div>
              </div>

              {/* Employee & Bank Info Grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs border border-slate-300 rounded-lg p-4 bg-slate-50/40">
                <div className="space-y-1">
                  <p><span className="text-slate-500 font-medium">Employee Name:</span> <strong className="text-slate-900">{selectedSlip.employeeName}</strong></p>
                  <p><span className="text-slate-500 font-medium">Employee ID:</span> <strong className="font-mono">{selectedSlip.employeeId}</strong></p>
                  <p><span className="text-slate-500 font-medium">Designation:</span> <strong>{selectedSlip.designation}</strong></p>
                  <p><span className="text-slate-500 font-medium">Department:</span> <strong>{selectedSlip.department}</strong></p>
                  <p><span className="text-slate-500 font-medium">Date of Joining:</span> <span className="font-mono">{selectedSlip.doj}</span></p>
                </div>

                <div className="space-y-1">
                  <p><span className="text-slate-500 font-medium">PAN Card:</span> <strong className="font-mono">{selectedSlip.pan}</strong></p>
                  <p><span className="text-slate-500 font-medium">PF UAN:</span> <strong className="font-mono">{selectedSlip.uan}</strong></p>
                  <p><span className="text-slate-500 font-medium">Bank Name:</span> <span>{selectedSlip.bankName}</span></p>
                  <p><span className="text-slate-500 font-medium">Bank Account:</span> <strong className="font-mono">{selectedSlip.bankAccount}</strong></p>
                  <p><span className="text-slate-500 font-medium">Payable Days / Total:</span> <strong className="font-mono">{selectedSlip.payableDays} / {selectedSlip.daysInMonth}</strong></p>
                </div>
              </div>

              {/* Earnings & Deductions Table */}
              <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-200/80 font-bold border-b border-slate-300">
                      <th className="p-2.5 w-1/4">Earnings</th>
                      <th className="p-2.5 w-1/4 text-right">Amount (₹)</th>
                      <th className="p-2.5 w-1/4 border-l border-slate-300">Deductions</th>
                      <th className="p-2.5 w-1/4 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2 text-slate-700">Basic Salary</td>
                      <td className="p-2 text-right font-mono font-medium">{selectedSlip.basicSalary.toLocaleString('en-IN')}</td>
                      <td className="p-2 border-l border-slate-200 text-slate-700">Provident Fund (EPF)</td>
                      <td className="p-2 text-right font-mono font-medium">{selectedSlip.epfEmployee.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-slate-700">House Rent Allowance (HRA)</td>
                      <td className="p-2 text-right font-mono font-medium">{selectedSlip.hra.toLocaleString('en-IN')}</td>
                      <td className="p-2 border-l border-slate-200 text-slate-700">Income Tax (TDS)</td>
                      <td className="p-2 text-right font-mono font-medium">{selectedSlip.incomeTaxTDS.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-slate-700">Special Allowance</td>
                      <td className="p-2 text-right font-mono font-medium">{selectedSlip.specialAllowance.toLocaleString('en-IN')}</td>
                      <td className="p-2 border-l border-slate-200 text-slate-700">Professional Tax (PT)</td>
                      <td className="p-2 text-right font-mono font-medium">{selectedSlip.professionalTax.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-slate-700">Conveyance Allowance</td>
                      <td className="p-2 text-right font-mono font-medium">{selectedSlip.conveyance.toLocaleString('en-IN')}</td>
                      <td className="p-2 border-l border-slate-200 text-slate-700">ESIC</td>
                      <td className="p-2 text-right font-mono font-medium">0</td>
                    </tr>
                    <tr className="bg-slate-100 font-bold border-t border-slate-300">
                      <td className="p-2.5">Total Gross Earnings</td>
                      <td className="p-2.5 text-right font-mono text-emerald-800">
                        ₹{selectedSlip.grossEarnings.toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 border-l border-slate-300">Total Deductions</td>
                      <td className="p-2.5 text-right font-mono text-rose-800">
                        ₹{selectedSlip.totalDeductions.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Net Pay Callout */}
              <div className="p-4 rounded-xl bg-purple-50 border-2 border-purple-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Net Take-Home Salary
                  </span>
                  <div className="text-2xl font-black font-mono text-purple-900 mt-0.5">
                    ₹{selectedSlip.netTakeHome.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[11px] text-slate-600 italic block mt-0.5">
                    Amount in words: Indian Rupees One Lakh Seventy One Thousand Four Hundred Only
                  </span>
                </div>
                <div className="text-right text-xs text-slate-500 font-mono">
                  <p>Mode: Direct Bank Transfer (NEFT)</p>
                  <p>Date: {selectedSlip.disbursedDate}</p>
                </div>
              </div>

              {/* Digital Verification & Stamp */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>This is a system-generated payslip authenticated under IT Act 2000. No physical signature required.</span>
                </div>
                <div className="font-mono text-slate-400">
                  REF: KKF-PAY-{selectedSlip.month.slice(0, 3).toUpperCase()}-2026
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
