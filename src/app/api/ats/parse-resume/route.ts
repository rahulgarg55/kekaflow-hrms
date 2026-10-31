import { NextRequest, NextResponse } from 'next/server';
import { atsStore } from '@/lib/ats/atsStore';
import { ResumeParser } from '@/lib/ats/resumeParser';
import { AiRankingEngine } from '@/lib/ats/aiRankingEngine';
import { CandidateProfile } from '@/lib/ats/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      jobId,
      fullName,
      email,
      phone,
      resumeRawText,
      source = 'Direct Careers Portal',
      resumeFileName = 'Uploaded_Resume.pdf',
    } = body;

    if (!jobId || !resumeRawText) {
      return NextResponse.json(
        { success: false, error: 'jobId and resumeRawText are required' },
        { status: 400 }
      );
    }

    const job = atsStore.getJob(jobId);
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    // 1. Parse resume and run adversarial injection defense
    const parsed = ResumeParser.parse(resumeRawText);

    // 2. Score candidate against the job description with explainable breakdown
    const candidateDataForScoring = {
      parsedSkills: parsed.extractedSkills,
      totalExperienceYears: parsed.totalExperienceYears,
      expectedCtcLpa: parsed.expectedCtcLpa,
      noticePeriodDays: parsed.noticePeriodDays,
    };

    const aiScore = AiRankingEngine.evaluateCandidate(candidateDataForScoring, job);
    if (parsed.sanitizationAudit.isCompromised) {
      aiScore.adversarialFlags.push(...parsed.sanitizationAudit.threatFlags);
    }

    // 3. Create Candidate Profile in store
    const candidateId = `cand_${Date.now()}`;
    const newCandidate: CandidateProfile = {
      id: candidateId,
      tenantId: 'tenant_nova_default',
      jobId: job.id,
      jobTitle: job.title,
      fullName: fullName || parsed.extractedName || 'Applicant',
      email: email || parsed.extractedEmail || 'applicant@talent.local',
      phone: phone || parsed.extractedPhone || '+91 99000 00000',
      currentCompany: parsed.currentCompany || 'Previous Technology Firm',
      currentDesignation: 'Software Professional',
      totalExperienceYears: parsed.totalExperienceYears || 4,
      currentCtcLpa: parsed.currentCtcLpa || 18,
      expectedCtcLpa: parsed.expectedCtcLpa || 24,
      noticePeriodDays: parsed.noticePeriodDays || 30,
      location: 'India',
      highestEducation: parsed.education || 'B.Tech / Bachelor Degree',
      collegeName: 'Accredited University',
      source,
      stage: 'APPLIED',
      appliedDate: new Date().toISOString().split('T')[0],
      resumeFileName,
      resumeRawText,
      parsedSkills: parsed.extractedSkills,
      aiScore,
      blindScreeningAudit: {
        piiMaskedUntilStage: 'TECHNICAL_INTERVIEW',
        maskedAttributes: ['fullName', 'email', 'phone', 'collegeName', 'gender'],
      },
    };

    atsStore.addCandidate(newCandidate);

    return NextResponse.json({
      success: true,
      data: {
        candidate: newCandidate,
        parsedProfile: parsed,
        threatLevel: parsed.sanitizationAudit.threatLevel,
      },
    }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
