// lib/pdf-service.ts — Shared PDF generation + upload logic (used by webhook + admin)
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { OSSReportDocument } from './pdf-generator';
import { calculateTheOSSIndex } from './theossindex-engine';
import { formatDate } from './utils';
import type { SupabaseClient } from '@supabase/supabase-js';

interface AssessmentRow {
  id: string;
  user_id: string;
  user_email: string;
  org_name: string | null;
  er: number;
  pr: number;
  ri: number;
  a: number;
  created_at: string;
}

/**
 * Generate PDF report for an assessment and upload to Supabase Storage.
 * Returns the storage path on success.
 * Throws on failure (caller should handle retry/logging).
 */
export async function generatePdfAndUpload(
  assessment: AssessmentRow,
  db: SupabaseClient,
): Promise<string> {
  const result = calculateTheOSSIndex({
    er: assessment.er,
    pr: assessment.pr,
    ri: assessment.ri,
    a: assessment.a,
  });

  const doc = React.createElement(OSSReportDocument, {
    orgName: assessment.org_name ?? 'Your Organization',
    userEmail: assessment.user_email,
    assessmentDate: formatDate(assessment.created_at),
    input: { er: assessment.er, pr: assessment.pr, ri: assessment.ri, a: assessment.a },
    result,
    reportId: assessment.id,
    generatedAt: new Date().toISOString(),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- @react-pdf/renderer v4 + React 19 type incompatibility
  const pdfBuffer = await renderToBuffer(doc as any);
  const storagePath = `reports/${assessment.id}.pdf`;

  const { error: uploadErr } = await db.storage
    .from('theossindex-reports')
    .upload(storagePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadErr) throw uploadErr;
  return storagePath;
}
