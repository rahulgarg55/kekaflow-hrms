import { NextRequest, NextResponse } from 'next/server';
import { atsStore } from '@/lib/ats/atsStore';
import { CandidateStage } from '@/lib/ats/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId') || undefined;

    const candidates = atsStore.getCandidates(jobId);
    return NextResponse.json({ success: true, count: candidates.length, data: candidates });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { candidateId, stage, recruiterScoreOverride, recruiterNotes } = body;

    if (!candidateId) {
      return NextResponse.json({ success: false, error: 'candidateId is required' }, { status: 400 });
    }

    const candidate = atsStore.getCandidate(candidateId);
    if (!candidate) {
      return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 });
    }

    if (stage) {
      atsStore.updateCandidateStage(candidateId, stage as CandidateStage);
    }

    if (recruiterScoreOverride !== undefined) {
      candidate.aiScore.recruiterScoreOverride = recruiterScoreOverride;
    }
    if (recruiterNotes) {
      candidate.aiScore.recruiterNotes = recruiterNotes;
    }

    return NextResponse.json({ success: true, data: candidate });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
