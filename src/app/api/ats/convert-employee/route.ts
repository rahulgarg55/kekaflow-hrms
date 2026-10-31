import { NextRequest, NextResponse } from 'next/server';
import { atsStore } from '@/lib/ats/atsStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { candidateId } = body;

    if (!candidateId) {
      return NextResponse.json({ success: false, error: 'candidateId is required' }, { status: 400 });
    }

    const conversionResult = atsStore.convertToEmployee(candidateId);
    return NextResponse.json({
      success: true,
      message: `Candidate ${conversionResult.employeeName} converted to employee ${conversionResult.employeeId} successfully!`,
      data: conversionResult,
    });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
