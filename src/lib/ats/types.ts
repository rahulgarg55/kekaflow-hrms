/**
 * NovaHR - AI-Powered Hiring / ATS Module Types
 * Human-centric HRMS data models for Indian SMEs & Mid-Market.
 */

export type CandidateStage =
  | 'APPLIED'
  | 'SCREENING'
  | 'TECHNICAL_INTERVIEW'
  | 'CULTURE_FIT'
  | 'OFFER_MADE'
  | 'HIRED'
  | 'REJECTED';

export type JobStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'OPEN' | 'ON_HOLD' | 'CLOSED';

export interface JobRequisition {
  id: string;
  tenantId: string;
  title: string;
  department: string;
  location: string;
  employmentType: 'FULL_TIME' | 'CONTRACT' | 'INTERNSHIP';
  experienceRangeYears: { min: number; max: number };
  salaryRangeLpa: { min: number; max: number }; // in ₹ LPA
  headcountBudget: { totalBudgeted: number; currentFilled: number; requestedCount: number };
  status: JobStatus;
  workflowInstanceId?: string;
  hiringManager: string;
  targetStartDate: string;
  mustHaveSkills: string[];
  goodToHaveSkills: string[];
  description: string;
  screeningQuestions: Array<{ id: string; question: string; isRequired: boolean }>;
  createdDate: string;
}

export interface CandidateProfile {
  id: string;
  tenantId: string;
  jobId: string;
  jobTitle: string;
  fullName: string;
  email: string;
  phone: string;
  currentCompany: string;
  currentDesignation: string;
  totalExperienceYears: number;
  currentCtcLpa: number; // ₹ LPA
  expectedCtcLpa: number; // ₹ LPA
  noticePeriodDays: number;
  location: string;
  highestEducation: string;
  collegeName: string;
  gender?: string;
  source: 'Naukri.com' | 'LinkedIn' | 'Employee Referral' | 'Direct Careers Portal' | 'Indeed';
  referralEmployeeName?: string;
  stage: CandidateStage;
  appliedDate: string;
  resumeFileName: string;
  resumeRawText: string;
  parsedSkills: string[];
  
  // AI Explainable Match
  aiScore: {
    overallMatchPercent: number; // 0 - 100
    skillsFitPercent: number;
    experienceFitPercent: number;
    salaryFitPercent: number;
    mustHaveSkillsMatched: string[];
    missingSkills: string[];
    strengths: string[];
    potentialGaps: string[];
    adversarialFlags: string[];
    recruiterScoreOverride?: number;
    recruiterNotes?: string;
  };

  // Bias Reduction Visibility Audit
  blindScreeningAudit: {
    piiMaskedUntilStage: CandidateStage;
    maskedAttributes: string[];
    unmaskedBy?: string;
    unmaskedAt?: string;
  };
}

export interface InterviewScorecard {
  id: string;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  interviewerName: string;
  interviewRound: 'Technical Round 1' | 'System Architecture' | 'HR & Cultural Alignment';
  scheduledAt: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  competencyRatings: Array<{
    competency: string; // e.g. "Problem Solving", "System Architecture", "React & Node.js"
    rating: number; // 1 to 5
    comments: string;
  }>;
  overallRecommendation: 'STRONG_HIRE' | 'HIRE' | 'HOLD' | 'REJECT';
  summaryNotes: string;
  disagreementFlag?: boolean;
}

export interface SalaryBreakup {
  annualCtc: number; // ₹ Lakhs
  monthlyGross: number;
  basicSalary: number; // 50% of monthly gross
  hra: number; // 20% of monthly gross
  specialAllowance: number;
  employerPf: number; // 12% of basic
  employeePf: number; // 12% of basic
  gratuity: number; // 4.81% of basic
  monthlyTakeHomeApprox: number;
}

export interface CandidateOffer {
  id: string;
  tenantId: string;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  department: string;
  offeredCtcLpa: number; // in ₹ LPA
  breakup: SalaryBreakup;
  joiningDate: string;
  expiryDate: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'SENT_TO_CANDIDATE' | 'ACCEPTED' | 'DECLINED';
  eSignStatus: 'PENDING' | 'SIGNED';
  eSignedAt?: string;
  notes?: string;
}

export interface EmployeeConversionResult {
  success: boolean;
  employeeId: string;
  employeeName: string;
  officialEmail: string;
  department: string;
  designation: string;
  joiningDate: string;
  annualCtcLpa: number;
  onboardingChecklist: Array<{ item: string; completed: boolean }>;
}
