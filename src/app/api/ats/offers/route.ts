import { NextRequest, NextResponse } from 'next/server';
import { atsStore } from '@/lib/ats/atsStore';

export async function GET() {
  try {
    const offers = atsStore.getOffers();
    return NextResponse.json({ success: true, count: offers.length, data: offers });
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
      department = 'Engineering',
      offeredCtcLpa,
      joiningDate,
      expiryDate,
      notes,
    } = body;

    if (!candidateId || !candidateName || !offeredCtcLpa) {
      return NextResponse.json(
        { success: false, error: 'candidateId, candidateName, and offeredCtcLpa are required' },
        { status: 400 }
      );
    }

    const offer = atsStore.createOffer({
      tenantId: 'tenant_nova_default',
      candidateId,
      candidateName,
      jobTitle: jobTitle || 'Senior Software Engineer',
      department,
      offeredCtcLpa: parseFloat(offeredCtcLpa),
      joiningDate: joiningDate || '2026-11-16',
      expiryDate: expiryDate || '2026-11-05',
      status: 'SENT_TO_CANDIDATE',
      eSignStatus: 'PENDING',
      notes,
    });

    atsStore.updateCandidateStage(candidateId, 'OFFER_MADE');

    return NextResponse.json({ success: true, data: offer }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
