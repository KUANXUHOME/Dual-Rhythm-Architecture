// app/api/usage/route.ts — Return current user's daily usage status

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getUsageStatus } from '@/lib/usage-limits';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const status = await getUsageStatus(userId);
  return NextResponse.json(status);
}
