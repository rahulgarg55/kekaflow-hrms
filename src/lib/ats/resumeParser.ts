/**
 * NovaHR - Resume Parsing & Structured Profile Extraction Engine
 * Extracts skills, experience, CTC in ₹ LPA, notice period, and education.
 */

import { PromptInjectionDefense } from './promptInjectionDefense';

export interface ParsedResumeResult {
  confidenceScore: number;
  extractedName?: string;
  extractedEmail?: string;
  extractedPhone?: string;
  extractedSkills: string[];
  totalExperienceYears: number;
  currentCompany?: string;
  currentCtcLpa?: number;
  expectedCtcLpa?: number;
  noticePeriodDays: number;
  education?: string;
  sanitizationAudit: ReturnType<typeof PromptInjectionDefense.sanitizeResumeText>;
}

const COMMON_TECH_SKILLS = [
  'React', 'React.js', 'Next.js', 'Node.js', 'TypeScript', 'JavaScript',
  'Python', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'GCP',
  'Tailwind CSS', 'GraphQL', 'REST API', 'Microservices', 'Git',
  'Jest', 'Playwright', 'Kafka', 'MongoDB', 'Couchbase', 'Elasticsearch',
  'System Design', 'CI/CD', 'Figma', 'Product Design', 'Golang',
];

export class ResumeParser {
  /**
   * Parses resume text, runs prompt injection defense, and extracts structured fields.
   */
  static parse(rawText: string): ParsedResumeResult {
    // 1. Run prompt-injection defense first
    const sanitization = PromptInjectionDefense.sanitizeResumeText(rawText);
    const text = sanitization.sanitizedText;

    // 2. Extract Email
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const extractedEmail = emailMatch ? emailMatch[0] : undefined;

    // 3. Extract Indian Phone Number
    const phoneMatch = text.match(/(?:\+91[\s-]?)?[6789]\d{9}/);
    const extractedPhone = phoneMatch ? phoneMatch[0] : undefined;

    // 4. Extract Skills
    const extractedSkills: string[] = [];
    const lowerText = text.toLowerCase();
    for (const skill of COMMON_TECH_SKILLS) {
      const regex = new RegExp(`\\b${skill.replace('.', '\\.')}\\b`, 'i');
      if (regex.test(text)) {
        extractedSkills.push(skill);
      }
    }

    // 5. Extract Years of Experience
    let totalExperienceYears = 0;
    const expMatch = text.match(/(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)/i);
    if (expMatch) {
      totalExperienceYears = parseFloat(expMatch[1]);
    }

    // 6. Extract Notice Period in days
    let noticePeriodDays = 30; // default Indian standard
    const noticeMatch = text.match(/notice\s+period\s*[:=-]?\s*(\d+)\s*(?:days?|months?)/i);
    if (noticeMatch) {
      const num = parseInt(noticeMatch[1], 10);
      if (text.includes('month')) {
        noticePeriodDays = num * 30;
      } else {
        noticePeriodDays = num;
      }
    } else if (lowerText.includes('immediate joiner') || lowerText.includes('serving notice')) {
      noticePeriodDays = 15;
    }

    // 7. Extract Current CTC & Expected CTC in ₹ LPA
    let currentCtcLpa: number | undefined;
    let expectedCtcLpa: number | undefined;

    const ctcMatch = text.match(/current\s+ctc\s*[:=-]?\s*(?:₹|inr|rs\.?)?\s*(\d+(?:\.\d+)?)\s*(?:lpa|lakhs?)/i);
    if (ctcMatch) {
      currentCtcLpa = parseFloat(ctcMatch[1]);
    }

    const ectcMatch = text.match(/expected\s+ctc\s*[:=-]?\s*(?:₹|inr|rs\.?)?\s*(\d+(?:\.\d+)?)\s*(?:lpa|lakhs?)/i);
    if (ectcMatch) {
      expectedCtcLpa = parseFloat(ectcMatch[1]);
    }

    // 8. Calculate parser confidence score
    let confidence = 0.5;
    if (extractedEmail) confidence += 0.15;
    if (extractedPhone) confidence += 0.1;
    if (extractedSkills.length >= 3) confidence += 0.15;
    if (totalExperienceYears > 0) confidence += 0.1;

    return {
      confidenceScore: Math.min(1.0, Math.round(confidence * 100) / 100),
      extractedEmail,
      extractedPhone,
      extractedSkills,
      totalExperienceYears,
      currentCtcLpa,
      expectedCtcLpa,
      noticePeriodDays,
      sanitizationAudit: sanitization,
    };
  }
}
