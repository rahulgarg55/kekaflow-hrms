import { NextRequest, NextResponse } from 'next/server';
import { atsStore } from '@/lib/ats/atsStore';

export async function GET() {
  try {
    const jobs = atsStore.getJobs();
    return NextResponse.json({ success: true, count: jobs.length, data: jobs });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      department,
      location = 'Cyber City, Gurugram',
      employmentType = 'FULL_TIME',
      experienceRangeYears = { min: 3, max: 7 },
      salaryRangeLpa = { min: 18, max: 25 },
      headcountBudget = { totalBudgeted: 2, currentFilled: 0, requestedCount: 1 },
      hiringManager,
      mustHaveSkills = [],
      goodToHaveSkills = [],
      description,
      screeningQuestions = [],
    } = body;

    if (!title || !department || !hiringManager) {
      return NextResponse.json(
        { success: false, error: 'title, department, and hiringManager are required' },
        { status: 400 }
      );
    }

    // Budget check: Requested count cannot exceed available unallocated headcount
    const availableHeadcount = headcountBudget.totalBudgeted - headcountBudget.currentFilled;
    if (headcountBudget.requestedCount > availableHeadcount) {
      return NextResponse.json(
        {
          success: false,
          error: `Headcount budget exceeded: Department has only ${availableHeadcount} open positions budgeted, but ${headcountBudget.requestedCount} requested.`,
        },
        { status: 422 }
      );
    }

    const newJob = atsStore.createJob({
      tenantId: 'tenant_nova_default',
      title,
      department,
      location,
      employmentType,
      experienceRangeYears,
      salaryRangeLpa,
      headcountBudget,
      status: 'OPEN',
      hiringManager,
      targetStartDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      mustHaveSkills,
      goodToHaveSkills,
      description: description || `Join NovaHR as a ${title} in the ${department} team.`,
      screeningQuestions,
    });

    return NextResponse.json({ success: true, data: newJob }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
