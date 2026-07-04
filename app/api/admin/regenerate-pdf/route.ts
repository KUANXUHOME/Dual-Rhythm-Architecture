// app/api/admin/regenerate-pdf/route.ts — Manual PDF regeneration (fixes H10)
import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { generatePdfAndUpload } from '@/lib/pdf-service';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Admin check
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? '';
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  if (!adminEmails.includes(email.toLowerCase())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const formData = await req.formData();
  const assessmentId = formData.get('assessmentId') as string;
  if (!assessmentId) return NextResponse.json({ error: 'Missing assessmentId' }, { status: 400 });

  const db = createServerClient();

  try {
    const { data: a, error } = await db
      .from('theossindex_assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();

    if (error || !a) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const storagePath = await generatePdfAndUpload(a, db);

    await db.from('theossindex_assessments')
      .update({ status: 'report_ready', report_storage_path: storagePath })
      .eq('id', assessmentId);

    // Resolve webhook_failures record
    await db.from('webhook_failures')
      .update({ resolved_at: new Date().toISOString() })
      .eq('assessment_id', assessmentId)
      .is('resolved_at', null);

    // Redirect back to admin assessments page
    return NextResponse.redirect(new URL('/admin/assessments', req.url));
  } catch (err) {
    console.error('[admin regenerate-pdf]', err);
    return NextResponse.json({ error: 'Generation failed', detail: String(err) }, { status: 500 });
  }
}
