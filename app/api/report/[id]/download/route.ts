// app/api/report/[id]/download/route.ts — Return 302 redirect to signed PDF URL

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = createServerClient();

  const { data: assessment, error } = await db
    .from('theossindex_assessments')
    .select('user_id, status, report_storage_path')
    .eq('id', id)
    .single();

  if (error || !assessment)                   return NextResponse.json({ error: 'Not found' },          { status: 404 });
  if (assessment.user_id !== userId)          return NextResponse.json({ error: 'Forbidden' },          { status: 403 });
  if (assessment.status !== 'report_ready')   return NextResponse.json({ error: 'Report not ready' },   { status: 202 });
  if (!assessment.report_storage_path)        return NextResponse.json({ error: 'Storage path missing'},{ status: 500 });

  const { data } = await db.storage
    .from('theossindex-reports')
    .createSignedUrl(assessment.report_storage_path, 3600); // 1 hour

  if (!data?.signedUrl) return NextResponse.json({ error: 'Could not generate URL' }, { status: 500 });

  // 302 redirect → browser downloads directly
  return NextResponse.redirect(data.signedUrl);
}
