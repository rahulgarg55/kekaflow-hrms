# KekaFlow // Enterprise HRMS & Payroll Cloud Platform

> A full-suite human resource management platform inspired by **Keka HR**, built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS**.

---

## 🌐 Live Application & Access

| Environment | Access Link | Description |
| :--- | :--- | :--- |
| **Public Live Demo** | [**https://formats-independence-progress-cooking.trycloudflare.com**](https://formats-independence-progress-cooking.trycloudflare.com) | Live interactive deployment via Cloudflare Tunnel |
| **GitHub Repository** | [**github.com/rahulgarg55/kekaflow-hrms**](https://github.com/rahulgarg55/kekaflow-hrms) | Public production repository |
| **Local Host** | `http://localhost:3015` | High-performance Next.js production server |

---

## 💼 Core HRMS Modules & Functionality

### 1. Employee Self-Service (ESS) & Web Clock-In Station
- **Real-Time Shift Timer:** Interactive clock-in / clock-out card with live second-by-second shift counter.
- **Progress Tracking:** Tracks elapsed work hours against the standard 8h 30m daily shift requirement.
- **Break Management:** Dedicated lunch and coffee break tracker with active pause functionality.
- **Work Location & IP Telemetry:** Displays current workplace (Mohali Technology Park vs WFH remote).
- **Celebration & Townhall Feed:** Company announcements, colleague birthday wishes, and work anniversary celebrations.

### 2. Attendance & Punch Matrix
- **Monthly Matrix Calendar:** Visual calendar grid for October 2026 with color-coded daily status badges:
  - 🟢 **Present (Office):** On time, full effective shift completed
  - 🔵 **Work From Home (WFH):** Pre-approved remote workdays
  - 🟡 **Late Arrival:** Logged with timestamp and duration
  - 🟣 **On Leave:** Approved PL/CL/SL absences
  - ⚪ **Weekend & Scheduled Holidays**
- **Detailed Punch Breakdown Table:** Date, First In, Last Out, Break Duration, and Effective Hours.
- **Attendance Regularization Workflow:** 1-Click modal allowing employees to request regularization for late arrivals, travel delays, or biometric glitches, routing directly to the manager.

### 3. Leave Management & Policy Balances
- **4 Circular Balance Meters:**
  - **Privilege Leave (PL):** 8.0 / 18.0 days remaining (+1.5d/month accrual)
  - **Casual Leave (CL):** 4.5 / 12.0 days remaining (+1.0d/month accrual)
  - **Sick Leave (SL):** 5.0 / 12.0 days remaining
  - **Optional Holiday (OH):** 1.0 / 2.0 days remaining
- **Interactive Leave Application Modal:** Multi-day date selector, half-day toggle (First Half / Second Half), real-time balance validation, and reason submission.
- **Leave History & Withdrawal:** Complete audit trail of past leave requests with status pills (Approved, Pending Review, Rejected).
- **2026 Holiday Calendar:** Official gazetted holidays list (Diwali, Gurpurab, Christmas, New Year).

### 4. Payroll, Statutory Deductions & Payslip Generator
- **Comprehensive Indian Salary Structure:**
  - **Annual Cost to Company (CTC):** ₹24,00,000 / year
  - **Monthly Gross:** ₹2,00,000 (Basic ₹1,00,000, HRA ₹40,000, Special Allowance ₹45,000, Conveyance ₹15,000)
  - **Statutory Deductions:** Employee Provident Fund (EPF 12% = ₹12,000), Professional Tax (PT = ₹200), Income Tax TDS (₹16,400)
  - **Net Take-Home Pay:** ₹1,71,400 / month
- **Interactive Full Payslip Modal:** Authentic Indian corporate payslip with company header (KekaFlow Cloud Technologies India Pvt. Ltd.), CIN, GSTIN, PAN, UAN, Bank A/C, itemized earnings vs deductions table, and amount in words.
- **1-Click Print & PDF Export:** Dedicated `@media print` layout formatting the payslip directly into an official A4 document.

### 5. Employee Directory & Organization Tree
- **Search & Filter:** Instant search across employee names, designations, employee IDs, and technical skill sets.
- **Department Segmentation:** Filter by Engineering, Product Design, People & HR, Marketing, and Finance.
- **Profile Modal:** Detailed employee card with direct reporting hierarchy, contact information, competencies, and tenure.

### 6. Role Switcher: Employee ESS vs HR Admin Portal
- Instant toggle between **Employee View** (Rahul Garg, Staff Software Engineer) and **HR Admin View** (Director of People & Operations).
- **Admin Approvals Inbox:** Review and 1-click approve/reject pending team leave requests and attendance regularizations.
- **Compliance Metrics:** Real-time headcount and campus presence ratios.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router & Turbopack)
- **Library:** React 19 & TypeScript 5
- **Styling:** Tailwind CSS (Keka-inspired purple & slate corporate design tokens)
- **Icons:** Lucide React
- **Deployment:** Node.js standalone server + Cloudflare Edge Tunnel

---

## 💻 Local Development

```bash
# Clone the repository
git clone https://github.com/rahulgarg55/kekaflow-hrms.git
cd kekaflow-hrms

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3015](http://localhost:3015) in your browser.
