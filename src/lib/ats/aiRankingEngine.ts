/**
 * NovaHR - Explainable Candidate AI Ranking & Indian CTC Payroll Engine
 * Generates transparent scores with skill breakdown, experience fit, and gaps.
 * Human recruiters always retain final decision power (NEVER auto-reject on AI score alone).
 */

import { JobRequisition, CandidateProfile, SalaryBreakup } from './types';

export class AiRankingEngine {
  /**
   * Scores a candidate profile against a job requisition with explainable breakdown.
   */
  static evaluateCandidate(
    candidate: Partial<CandidateProfile> & {
      parsedSkills: string[];
      totalExperienceYears: number;
      expectedCtcLpa?: number;
      noticePeriodDays?: number;
    },
    job: JobRequisition
  ): CandidateProfile['aiScore'] {
    const candidateSkillsLower = new Set(candidate.parsedSkills.map((s) => s.toLowerCase()));

    // 1. Must-Have Skills Matching
    const matchedMustHaves: string[] = [];
    const missingMustHaves: string[] = [];

    for (const skill of job.mustHaveSkills) {
      if (candidateSkillsLower.has(skill.toLowerCase())) {
        matchedMustHaves.push(skill);
      } else {
        missingMustHaves.push(skill);
      }
    }

    const skillsFitPercent = job.mustHaveSkills.length > 0
      ? Math.round((matchedMustHaves.length / job.mustHaveSkills.length) * 100)
      : 80;

    // 2. Experience Fit Matching
    let experienceFitPercent = 100;
    const exp = candidate.totalExperienceYears || 0;
    if (exp < job.experienceRangeYears.min) {
      const deficit = job.experienceRangeYears.min - exp;
      experienceFitPercent = Math.max(30, Math.round(100 - deficit * 20));
    } else if (exp > job.experienceRangeYears.max + 4) {
      experienceFitPercent = 85; // slightly overqualified
    }

    // 3. Salary & Budget Fit Matching
    let salaryFitPercent = 90;
    if (candidate.expectedCtcLpa && candidate.expectedCtcLpa > job.salaryRangeLpa.max) {
      const overBudgetDelta = candidate.expectedCtcLpa - job.salaryRangeLpa.max;
      salaryFitPercent = Math.max(40, Math.round(100 - (overBudgetDelta / job.salaryRangeLpa.max) * 100));
    }

    // 4. Overall Weighted Score (Skills 50%, Experience 35%, Budget 15%)
    const overallMatchPercent = Math.round(
      skillsFitPercent * 0.50 +
      experienceFitPercent * 0.35 +
      salaryFitPercent * 0.15
    );

    // 5. Build human-readable explanations (strengths & potential gaps)
    const strengths: string[] = [];
    const potentialGaps: string[] = [];

    if (matchedMustHaves.length > 0) {
      strengths.push(`Matches ${matchedMustHaves.length} core required skills: ${matchedMustHaves.join(', ')}`);
    }
    if (exp >= job.experienceRangeYears.min && exp <= job.experienceRangeYears.max) {
      strengths.push(`Experience level (${exp} yrs) falls directly inside ideal range (${job.experienceRangeYears.min}-${job.experienceRangeYears.max} yrs)`);
    }
    if (candidate.noticePeriodDays !== undefined && candidate.noticePeriodDays <= 30) {
      strengths.push(`Immediate/Short notice period (${candidate.noticePeriodDays} days) enables rapid onboarding`);
    }

    if (missingMustHaves.length > 0) {
      potentialGaps.push(`Missing mandatory requirements: ${missingMustHaves.join(', ')}`);
    }
    if (exp < job.experienceRangeYears.min) {
      potentialGaps.push(`Experience (${exp} yrs) is below minimum role requirement (${job.experienceRangeYears.min} yrs)`);
    }
    if (candidate.expectedCtcLpa && candidate.expectedCtcLpa > job.salaryRangeLpa.max) {
      potentialGaps.push(`Expected compensation (₹${candidate.expectedCtcLpa} LPA) exceeds approved budget ceiling (₹${job.salaryRangeLpa.max} LPA)`);
    }

    return {
      overallMatchPercent,
      skillsFitPercent,
      experienceFitPercent,
      salaryFitPercent,
      mustHaveSkillsMatched: matchedMustHaves,
      missingSkills: missingMustHaves,
      strengths,
      potentialGaps,
      adversarialFlags: [],
    };
  }

  /**
   * Computes standard Indian Salary Structure CTC breakup for an offer letter.
   * Basic = 50% of Monthly Gross
   * HRA = 20% of Monthly Gross (or 40% of Basic)
   * Employer PF = 12% of Basic (capped/uncapped based on config)
   * Employee PF = 12% of Basic
   * Gratuity = 4.81% of Basic
   * Special Allowance = Remainder
   */
  static calculateIndianCtcBreakup(annualCtcLpa: number): SalaryBreakup {
    const annualTotal = annualCtcLpa * 100000;
    const monthlyGross = Math.round(annualTotal / 12);

    const basicSalary = Math.round(monthlyGross * 0.50);
    const hra = Math.round(monthlyGross * 0.20);
    const employerPf = Math.round(basicSalary * 0.12);
    const employeePf = Math.round(basicSalary * 0.12);
    const gratuity = Math.round(basicSalary * 0.0481);

    const specialAllowance = Math.max(0, monthlyGross - (basicSalary + hra + employerPf + gratuity));
    const monthlyTakeHomeApprox = Math.round(monthlyGross - employeePf - employerPf - (monthlyGross * 0.05)); // 5% approx tax deduction

    return {
      annualCtc: annualCtcLpa,
      monthlyGross,
      basicSalary,
      hra,
      specialAllowance,
      employerPf,
      employeePf,
      gratuity,
      monthlyTakeHomeApprox,
    };
  }
}
