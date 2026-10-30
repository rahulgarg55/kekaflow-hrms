export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  avatar: string;
  role: string;
  department: 'Engineering' | 'Product Design' | 'People & HR' | 'Marketing' | 'Finance';
  email: string;
  phone: string;
  location: string;
  joiningDate: string;
  managerId: string;
  managerName: string;
  status: 'Active' | 'On Leave' | 'Probation';
  ctc: number;
  pan: string;
  uan: string;
  bankAccount: string;
  bankName: string;
  skills: string[];
  directReportsCount: number;
}

export type AttendanceStatus =
  | 'Present'
  | 'Late'
  | 'WFH'
  | 'On Leave'
  | 'Half Day'
  | 'Holiday'
  | 'Weekend';

export interface AttendanceRecord {
  date: string;
  day: string;
  checkIn: string;
  checkOut: string;
  totalHours: string;
  breakMinutes: number;
  effectiveHours: string;
  status: AttendanceStatus;
  regularizationStatus?: 'None' | 'Pending' | 'Approved' | 'Rejected';
  regularizationReason?: string;
  punchLogs?: Array<{ time: string; type: 'IN' | 'OUT' | 'BREAK'; method: string }>;
}

export interface LeaveBalance {
  type: string;
  code: 'PL' | 'CL' | 'SL' | 'OH';
  total: number;
  used: number;
  remaining: number;
  accruedPerMonth: number;
  color: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  department: string;
  leaveType: string;
  leaveCode: 'PL' | 'CL' | 'SL' | 'OH';
  startDate: string;
  endDate: string;
  daysCount: number;
  isHalfDay: boolean;
  halfDayType?: 'First Half' | 'Second Half';
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedOn: string;
  approvedBy?: string;
  managerComments?: string;
}

export interface SalarySlip {
  id: string;
  month: string;
  year: number;
  employeeId: string;
  employeeName: string;
  designation: string;
  department: string;
  doj: string;
  pan: string;
  uan: string;
  bankAccount: string;
  bankName: string;
  daysInMonth: number;
  payableDays: number;
  lossOfPayDays: number;
  basicSalary: number;
  hra: number;
  specialAllowance: number;
  conveyance: number;
  grossEarnings: number;
  epfEmployee: number;
  esiEmployee: number;
  professionalTax: number;
  incomeTaxTDS: number;
  totalDeductions: number;
  netTakeHome: number;
  status: 'Paid' | 'Processed';
  disbursedDate: string;
}

export interface Holiday {
  date: string;
  name: string;
  dayOfWeek: string;
  type: 'National Holiday' | 'Mandatory' | 'Optional / Restricted';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  authorRole: string;
  date: string;
  priority: 'Normal' | 'Important' | 'Celebration';
  tag: string;
}
