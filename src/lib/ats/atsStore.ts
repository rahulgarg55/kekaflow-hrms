/**
 * NovaHR - ATS / Hiring In-Memory Store & Seed Data
 * Pre-populated with realistic Indian job requisitions, candidate pipeline,
 * interview scorecards, and salary-structure-aware offers.
 */

import {
  JobRequisition,
  CandidateProfile,
  InterviewScorecard,
  CandidateOffer,
  EmployeeConversionResult,
} from './types';
import { AiRankingEngine } from './aiRankingEngine';

export const SEED_JOBS: JobRequisition[] = [
  {
    id: 'job_fullstack_01',
    tenantId: 'tenant_nova_default',
    title: 'Senior Full-Stack Engineer (React & Node.js)',
    department: 'Engineering',
    location: 'Cyber City, Gurugram (Hybrid)',
    employmentType: 'FULL_TIME',
    experienceRangeYears: { min: 4, max: 8 },
    salaryRangeLpa: { min: 22, max: 30 },
    headcountBudget: { totalBudgeted: 3, currentFilled: 1, requestedCount: 2 },
    status: 'OPEN',
    hiringManager: 'Aarav Sharma (Director of Engineering)',
    targetStartDate: '2026-11-15',
    mustHaveSkills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'REST API'],
    goodToHaveSkills: ['Next.js', 'Redis', 'Docker', 'Microservices', 'Tailwind CSS'],
    description: 'We are looking for a Senior Full-Stack Engineer to architect mission-critical workflows, attendance engines, and high-throughput microservices for NovaHR enterprise platform.',
    screeningQuestions: [
      { id: 'sq_1', question: 'How many years of hands-on production experience do you have with TypeScript and React?', isRequired: true },
      { id: 'sq_2', question: 'What is your current notice period and is it negotiable?', isRequired: true },
    ],
    createdDate: '2026-10-15',
  },
  {
    id: 'job_product_design_02',
    tenantId: 'tenant_nova_default',
    title: 'Lead Product Designer (UI/UX)',
    department: 'Product & Design',
    location: 'Indiranagar, Bengaluru (Hybrid)',
    employmentType: 'FULL_TIME',
    experienceRangeYears: { min: 5, max: 9 },
    salaryRangeLpa: { min: 20, max: 28 },
    headcountBudget: { totalBudgeted: 2, currentFilled: 1, requestedCount: 1 },
    status: 'OPEN',
    hiringManager: 'Rohan Verma (VP Product)',
    targetStartDate: '2026-12-01',
    mustHaveSkills: ['Figma', 'Product Design', 'Design Systems', 'Mobile-First UX'],
    goodToHaveSkills: ['User Research', 'Prototyping', 'Tailwind CSS'],
    description: 'Lead design systems and mobile-first attendance experience for over 50,000 Indian SME employees.',
    screeningQuestions: [
      { id: 'sq_3', question: 'Please share your Figma portfolio link demonstrating B2B SaaS design systems.', isRequired: true },
    ],
    createdDate: '2026-10-18',
  },
];

export const SEED_CANDIDATES: CandidateProfile[] = [
  {
    id: 'cand_101',
    tenantId: 'tenant_nova_default',
    jobId: 'job_fullstack_01',
    jobTitle: 'Senior Full-Stack Engineer (React & Node.js)',
    fullName: 'Siddharth Nair',
    email: 'siddharth.nair@example.com',
    phone: '+91 98765 43210',
    currentCompany: 'Zomato Technologies',
    currentDesignation: 'Senior Software Engineer',
    totalExperienceYears: 5.5,
    currentCtcLpa: 21.0,
    expectedCtcLpa: 26.0,
    noticePeriodDays: 30,
    location: 'Gurugram',
    highestEducation: 'B.Tech Computer Science',
    collegeName: 'BITS Pilani',
    gender: 'Male',
    source: 'Naukri.com',
    stage: 'APPLIED',
    appliedDate: '2026-10-28',
    resumeFileName: 'Siddharth_Nair_FullStack_2026.pdf',
    resumeRawText: 'Senior Full Stack Engineer with 5.5 years experience at Zomato. Expert in React, Node.js, TypeScript, PostgreSQL, Redis, REST APIs, Microservices architecture.',
    parsedSkills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Redis', 'REST API', 'Microservices'],
    aiScore: {
      overallMatchPercent: 94,
      skillsFitPercent: 100,
      experienceFitPercent: 95,
      salaryFitPercent: 88,
      mustHaveSkillsMatched: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'REST API'],
      missingSkills: [],
      strengths: [
        'Matches 100% of must-have technical requirements',
        'Strong background in high-concurrency food-tech backend services',
        'Standard 30-day notice period aligns with target start date',
      ],
      potentialGaps: [],
      adversarialFlags: [],
    },
    blindScreeningAudit: {
      piiMaskedUntilStage: 'TECHNICAL_INTERVIEW',
      maskedAttributes: ['fullName', 'email', 'phone', 'collegeName', 'gender'],
    },
  },
  {
    id: 'cand_102',
    tenantId: 'tenant_nova_default',
    jobId: 'job_fullstack_01',
    jobTitle: 'Senior Full-Stack Engineer (React & Node.js)',
    fullName: 'Ananya Sen',
    email: 'ananya.sen@example.com',
    phone: '+91 98111 22334',
    currentCompany: 'Swiggy',
    currentDesignation: 'Software Development Engineer II',
    totalExperienceYears: 4.8,
    currentCtcLpa: 19.5,
    expectedCtcLpa: 24.5,
    noticePeriodDays: 15, // Serving notice
    location: 'Bengaluru (Willing to relocate to Gurugram)',
    highestEducation: 'M.Tech Information Systems',
    collegeName: 'IIT Delhi',
    gender: 'Female',
    source: 'LinkedIn',
    stage: 'SCREENING',
    appliedDate: '2026-10-25',
    resumeFileName: 'Ananya_Sen_Resume.pdf',
    resumeRawText: 'SDE-2 at Swiggy working on order routing. Technologies: React, TypeScript, Node.js, PostgreSQL, Docker, Kafka, Microservices.',
    parsedSkills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'Kafka'],
    aiScore: {
      overallMatchPercent: 91,
      skillsFitPercent: 90,
      experienceFitPercent: 92,
      salaryFitPercent: 92,
      mustHaveSkillsMatched: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
      missingSkills: [],
      strengths: [
        'Short notice period (15 days - currently serving notice)',
        'IIT Delhi alumni with strong algorithm & database design foundations',
      ],
      potentialGaps: [],
      adversarialFlags: [],
    },
    blindScreeningAudit: {
      piiMaskedUntilStage: 'TECHNICAL_INTERVIEW',
      maskedAttributes: ['fullName', 'email', 'phone', 'collegeName', 'gender'],
    },
  },
  {
    id: 'cand_103',
    tenantId: 'tenant_nova_default',
    jobId: 'job_fullstack_01',
    jobTitle: 'Senior Full-Stack Engineer (React & Node.js)',
    fullName: 'Vikram Joshi',
    email: 'vikram.joshi@example.com',
    phone: '+91 99887 66554',
    currentCompany: 'Paytm Payments Bank',
    currentDesignation: 'Lead Engineer',
    totalExperienceYears: 6.2,
    currentCtcLpa: 23.0,
    expectedCtcLpa: 28.0,
    noticePeriodDays: 45,
    location: 'Noida / Gurugram',
    highestEducation: 'B.E. Computer Science',
    collegeName: 'NIT Surathkal',
    gender: 'Male',
    source: 'Employee Referral',
    referralEmployeeName: 'Aarav Sharma',
    stage: 'TECHNICAL_INTERVIEW',
    appliedDate: '2026-10-20',
    resumeFileName: 'Vikram_Joshi_CV.pdf',
    resumeRawText: 'Lead Engineer at Paytm. Full stack microservices, React, Next.js, Node.js, PostgreSQL, Redis, Kubernetes, AWS.',
    parsedSkills: ['React', 'Next.js', 'Node.js', 'PostgreSQL', 'Redis', 'Kubernetes'],
    aiScore: {
      overallMatchPercent: 93,
      skillsFitPercent: 95,
      experienceFitPercent: 95,
      salaryFitPercent: 85,
      mustHaveSkillsMatched: ['React', 'Node.js', 'PostgreSQL'],
      missingSkills: [],
      strengths: [
        'Referred by Engineering Director Aarav Sharma',
        'Extensive fin-tech and payment gateway compliance experience',
      ],
      potentialGaps: ['Notice period is 45 days (negotiable to 30)'],
      adversarialFlags: [],
    },
    blindScreeningAudit: {
      piiMaskedUntilStage: 'TECHNICAL_INTERVIEW',
      maskedAttributes: ['fullName', 'email', 'phone', 'collegeName', 'gender'],
      unmaskedBy: 'Aarav Sharma',
      unmaskedAt: '2026-10-22T10:00:00Z',
    },
  },
  {
    id: 'cand_104',
    tenantId: 'tenant_nova_default',
    jobId: 'job_fullstack_01',
    jobTitle: 'Senior Full-Stack Engineer (React & Node.js)',
    fullName: 'Karan Malhotra',
    email: 'karan.malhotra@example.com',
    phone: '+91 97766 55443',
    currentCompany: 'Razorpay',
    currentDesignation: 'Senior Software Engineer II',
    totalExperienceYears: 6.8,
    currentCtcLpa: 24.0,
    expectedCtcLpa: 28.5,
    noticePeriodDays: 30,
    location: 'Gurugram',
    highestEducation: 'B.Tech IT',
    collegeName: 'DTU Delhi',
    gender: 'Male',
    source: 'Direct Careers Portal',
    stage: 'OFFER_MADE',
    appliedDate: '2026-10-12',
    resumeFileName: 'Karan_Malhotra_Razorpay.pdf',
    resumeRawText: 'Senior Full Stack developer at Razorpay. React, Next.js, TypeScript, Node.js, PostgreSQL, System Design.',
    parsedSkills: ['React', 'Next.js', 'TypeScript', 'Node.js', 'PostgreSQL', 'System Design'],
    aiScore: {
      overallMatchPercent: 96,
      skillsFitPercent: 100,
      experienceFitPercent: 98,
      salaryFitPercent: 88,
      mustHaveSkillsMatched: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'REST API'],
      missingSkills: [],
      strengths: [
        'Cleared both Technical Rounds with Strong Hire recommendations',
        'Deep architectural knowledge of idempotent payment state machines',
      ],
      potentialGaps: [],
      adversarialFlags: [],
    },
    blindScreeningAudit: {
      piiMaskedUntilStage: 'TECHNICAL_INTERVIEW',
      maskedAttributes: [],
      unmaskedBy: 'Priya Patel (HR)',
      unmaskedAt: '2026-10-16T14:30:00Z',
    },
  },
];

export const SEED_SCORECARDS: InterviewScorecard[] = [
  {
    id: 'sc_001',
    candidateId: 'cand_104',
    candidateName: 'Karan Malhotra',
    jobTitle: 'Senior Full-Stack Engineer (React & Node.js)',
    interviewerName: 'Aarav Sharma',
    interviewRound: 'Technical Round 1',
    scheduledAt: '2026-10-18T11:00:00Z',
    status: 'COMPLETED',
    competencyRatings: [
      { competency: 'React & Frontend Architecture', rating: 5, comments: 'Superb knowledge of React 19 hooks, SSR hydration, and state machines.' },
      { competency: 'Node.js & Backend Systems', rating: 5, comments: 'Designed a distributed rate limiter and queue-based ingest effortlessly.' },
      { competency: 'Database & SQL Optimization', rating: 4, comments: 'Understands PostgreSQL indexing, query planning, and connection pooling.' },
    ],
    overallRecommendation: 'STRONG_HIRE',
    summaryNotes: 'One of the best candidates interviewed this quarter. Highly recommended for immediate offer.',
  },
  {
    id: 'sc_002',
    candidateId: 'cand_103',
    candidateName: 'Vikram Joshi',
    jobTitle: 'Senior Full-Stack Engineer (React & Node.js)',
    interviewerName: 'Priya Patel',
    interviewRound: 'HR & Cultural Alignment',
    scheduledAt: '2026-10-24T15:30:00Z',
    status: 'COMPLETED',
    competencyRatings: [
      { competency: 'Communication & Collaboration', rating: 4, comments: 'Articulate and humble. Works well across cross-functional product pods.' },
      { competency: 'Ownership & Problem Solving', rating: 5, comments: 'Shared concrete examples of taking operational ownership during payment outages.' },
    ],
    overallRecommendation: 'HIRE',
    summaryNotes: 'Strong cultural fit for NovaHR values. Notice period can be bought out if needed.',
  },
];

export const SEED_OFFERS: CandidateOffer[] = [
  {
    id: 'offer_cand_104',
    tenantId: 'tenant_nova_default',
    candidateId: 'cand_104',
    candidateName: 'Karan Malhotra',
    jobTitle: 'Senior Full-Stack Engineer (React & Node.js)',
    department: 'Engineering',
    offeredCtcLpa: 28.5,
    breakup: AiRankingEngine.calculateIndianCtcBreakup(28.5),
    joiningDate: '2026-11-16',
    expiryDate: '2026-11-05',
    status: 'ACCEPTED',
    eSignStatus: 'SIGNED',
    eSignedAt: '2026-10-29T16:45:00Z',
    notes: 'Candidate accepted offer of ₹28.5 LPA. Ready for 1-click conversion to employee.',
  },
];

class AtsStore {
  private jobs: JobRequisition[] = [...SEED_JOBS];
  private candidates: CandidateProfile[] = [...SEED_CANDIDATES];
  private scorecards: InterviewScorecard[] = [...SEED_SCORECARDS];
  private offers: CandidateOffer[] = [...SEED_OFFERS];

  public getJobs(): JobRequisition[] {
    return this.jobs;
  }

  public getJob(id: string): JobRequisition | undefined {
    return this.jobs.find((j) => j.id === id);
  }

  public createJob(job: Omit<JobRequisition, 'id' | 'createdDate'>): JobRequisition {
    const newJob: JobRequisition = {
      ...job,
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdDate: new Date().toISOString().split('T')[0],
    };
    this.jobs.push(newJob);
    return newJob;
  }

  public getCandidates(jobId?: string): CandidateProfile[] {
    if (jobId) {
      return this.candidates.filter((c) => c.jobId === jobId);
    }
    return this.candidates;
  }

  public getCandidate(id: string): CandidateProfile | undefined {
    return this.candidates.find((c) => c.id === id);
  }

  public updateCandidateStage(id: string, stage: CandidateProfile['stage']): CandidateProfile | undefined {
    const candidate = this.candidates.find((c) => c.id === id);
    if (candidate) {
      candidate.stage = stage;
      // If moving to technical interview or offer, unmask PII if not already
      if (stage === 'TECHNICAL_INTERVIEW' || stage === 'OFFER_MADE' || stage === 'HIRED') {
        candidate.blindScreeningAudit.unmaskedBy = 'Recruiter (Stage Progression)';
        candidate.blindScreeningAudit.unmaskedAt = new Date().toISOString();
      }
    }
    return candidate;
  }

  public addCandidate(candidate: CandidateProfile): CandidateProfile {
    this.candidates.push(candidate);
    return candidate;
  }

  public getScorecards(candidateId?: string): InterviewScorecard[] {
    if (candidateId) {
      return this.scorecards.filter((s) => s.candidateId === candidateId);
    }
    return this.scorecards;
  }

  public addScorecard(scorecard: Omit<InterviewScorecard, 'id'>): InterviewScorecard {
    const newSc: InterviewScorecard = {
      ...scorecard,
      id: `sc_${Date.now()}`,
    };
    this.scorecards.push(newSc);
    return newSc;
  }

  public getOffers(): CandidateOffer[] {
    return this.offers;
  }

  public createOffer(data: Omit<CandidateOffer, 'id' | 'breakup'>): CandidateOffer {
    const breakup = AiRankingEngine.calculateIndianCtcBreakup(data.offeredCtcLpa);
    const newOffer: CandidateOffer = {
      ...data,
      id: `offer_${Date.now()}`,
      breakup,
    };
    this.offers.push(newOffer);
    return newOffer;
  }

  public convertToEmployee(candidateId: string): EmployeeConversionResult {
    const candidate = this.candidates.find((c) => c.id === candidateId);
    if (!candidate) {
      throw new Error(`Candidate ${candidateId} not found`);
    }

    const offer = this.offers.find((o) => o.candidateId === candidateId);
    candidate.stage = 'HIRED';

    const empId = `EMP_${Math.floor(100 + Math.random() * 900)}`;
    const officialEmail = `${candidate.fullName.toLowerCase().replace(/\s+/g, '.')}@novahr.internal`;

    return {
      success: true,
      employeeId: empId,
      employeeName: candidate.fullName,
      officialEmail,
      department: 'Engineering',
      designation: candidate.jobTitle.replace(/\s*\(.*\)/, ''),
      joiningDate: offer?.joiningDate || '2026-11-16',
      annualCtcLpa: offer?.offeredCtcLpa || candidate.expectedCtcLpa,
      onboardingChecklist: [
        { item: 'Generate Official Corporate Email & Slack Access', completed: true },
        { item: 'Verify PAN, Aadhaar & Form 11 for EPFO / PF Enrollment', completed: false },
        { item: 'Assign Hardware Laptop & Cyber City DLF Access Badge', completed: false },
        { item: 'Schedule Day 1 HR Induction & Manager 1:1 Intro', completed: false },
      ],
    };
  }
}

export const atsStore = new AtsStore();
