import { NextRequest, NextResponse } from 'next/server';
import { atsStore } from '@/lib/ats/atsStore';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get('candidateId') || undefined;
    const scorecards = atsStore.getScorecards(candidateId);
    return NextResponse.json({ success: true, count: scorecards.length, data: scorecards });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      candidateId,
      candidateName,
      jobTitle,
      interviewerName,
      interviewRound,
      competencyRatings = [],
      overallRecommendation,
      summaryNotes = '',
    } = body;

    if (!candidateId || !interviewerName || !overallRecommendation) {
      return NextResponse.json(
        { success: false, error: 'candidateId, interviewerName, and overallRecommendation are required' },
        { status: 400 }
      );
    }

    const created = atsStore.addScorecard({
      candidateId,
      candidateName: candidateName || 'Candidate',
      jobTitle: jobTitle || 'Engineering Role',
      interviewerName,
      interviewRound: interviewRound || 'Technical Round 1',
      scheduledAt: new Date().toISOString(),
      status: 'COMPLETED',
      competencyRatings,
      overallRecommendation,
      summaryNotes,
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
