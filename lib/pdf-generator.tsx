// lib/pdf-generator.tsx — Board-ready PDF report using @react-pdf/renderer
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { TheOSSIndexResult, TheOSSIndexInput } from './theossindex-engine';
import { RISK_ZONE_META } from './theossindex-engine';

const S = StyleSheet.create({
  page:    { fontFamily: 'Helvetica', backgroundColor: '#FFFFFF', padding: 48 },
  header:  { backgroundColor: '#0A6640', padding: 32, marginBottom: 24, borderRadius: 4 },
  hLabel:  { color: '#FFFFFF', fontSize: 9, fontFamily: 'Helvetica-Bold', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, opacity: 0.7 },
  hTitle:  { color: '#FFFFFF', fontSize: 22, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  hSub:    { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
  sLabel:  { fontSize: 8, fontFamily: 'Helvetica-Bold', letterSpacing: 1.2, color: '#0A6640', textTransform: 'uppercase', marginBottom: 6, marginTop: 16 },
  scoreCard: { flexDirection: 'row', backgroundColor: '#F0FDF4', border: '1px solid #E2E8F0', borderRadius: 8, padding: 20, marginBottom: 16, alignItems: 'center' },
  scoreBig:  { fontSize: 72, fontFamily: 'Helvetica-Bold', marginRight: 24 },
  scoreDetail: { flex: 1 },
  scoreZone: { fontSize: 16, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  scoreNote: { fontSize: 9, color: '#4B5563', lineHeight: 1.5 },
  dimRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  dimLbl:  { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#0F1A14', width: 190 },
  dimBg:   { flex: 1, backgroundColor: '#E2E8F0', height: 8, borderRadius: 4 },
  dimScore: { fontSize: 10, fontFamily: 'Helvetica-Bold', width: 32, textAlign: 'right' },
  recCard: { backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 6, padding: 12, marginBottom: 8 },
  recCardHigh: { backgroundColor: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 6, padding: 12, marginBottom: 8 },
  recTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#0F1A14', marginBottom: 4 },
  recText:  { fontSize: 9, color: '#4B5563', lineHeight: 1.5 },
  trapBox:  { backgroundColor: '#FEF2F2', border: '2px solid #DC2626', borderRadius: 6, padding: 16, marginBottom: 16 },
  trapTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#DC2626', marginBottom: 4 },
  formulaBox: { backgroundColor: '#0A6640', padding: 16, borderRadius: 6, marginBottom: 16 },
  formulaText: { color: '#FFFFFF', fontSize: 11, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  watermark: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-45deg)', fontSize: 96, fontFamily: 'Helvetica-Bold', color: 'rgba(10,102,64,0.04)', textAlign: 'center' },
  footer:  { position: 'absolute', bottom: 32, left: 48, right: 48, flexDirection: 'row', justifyContent: 'space-between' },
  footerTxt: { fontSize: 8, color: '#9CA3AF' },
  footerMeta: { fontSize: 7, color: '#9CA3AF', marginTop: 2 },
});

interface PDFProps {
  orgName:        string;
  userEmail:      string;
  assessmentDate: string;
  input:          TheOSSIndexInput;
  result:         TheOSSIndexResult;
  conversationSummary?: string;
  reportId?:      string;
  generatedAt?:   string;
}

export function OSSReportDocument({ orgName, userEmail, assessmentDate, input, result, reportId, generatedAt }: PDFProps) {
  const meta = RISK_ZONE_META[result.riskZone];
  const dims = [
    { k: 'ER', n: 'Execution Rhythm', v: input.er },
    { k: 'PR', n: 'Pressure Regulation', v: input.pr },
    { k: 'RI', n: 'Recovery Integrity', v: input.ri },
    { k: 'A',  n: 'Acceleration Intensity', v: input.a },
  ];

  return (
    <Document title={`OSS™ Diagnostic — ${orgName}`}>
      <Page size="A4" style={S.page}>
        {/* Watermark — rendered first = bottom layer */}
        <Text style={S.watermark}>{orgName || 'CONFIDENTIAL'}</Text>

        {/* Header */}
        <View style={S.header}>
          <Text style={S.hLabel}>Dual-Rhythm Architecture™ · Powered by The OSS Index™</Text>
          <Text style={S.hTitle}>Organizational Stability Diagnostic</Text>
          <Text style={S.hSub}>{orgName} · {userEmail} · {assessmentDate}</Text>
        </View>

        {/* Score */}
        <Text style={S.sLabel}>OSS™ Score</Text>
        <View style={S.scoreCard}>
          <Text style={[S.scoreBig, { color: meta.color }]}>{result.oss}</Text>
          <View style={S.scoreDetail}>
            <Text style={[S.scoreZone, { color: meta.color }]}>{result.riskZoneName}</Text>
            <Text style={S.scoreNote}>Range: {meta.range} · SSC: {result.ssc} · Max at A={input.a}: {result.maxReachableOSS}</Text>
          </View>
        </View>

        {/* Formula */}
        <View style={S.formulaBox}>
          <Text style={S.formulaText}>OSS™ = (ER × PR × RI)^(1/3) / (1 + A/100) = {result.oss}</Text>
        </View>

        {/* HP/LR Trap */}
        {result.hpLrTrapDetected && (
          <View style={S.trapBox}>
            <Text style={S.trapTitle}>⚠ HP/LR Trap Detected</Text>
            <Text style={{ fontSize: 9, color: '#4B5563', lineHeight: 1.5 }}>
              ER={input.er}, PR={input.pr}, RI={input.ri}, A={input.a}. Execution strength is masking critically low recovery capacity — the most common structural precursor to organizational crisis.
            </Text>
          </View>
        )}

        {/* Dimensions */}
        <Text style={S.sLabel}>4-Dimensional Breakdown</Text>
        {dims.map(d => {
          const c = d.k === 'A'
            ? (d.v < 30 ? '#0A6640' : d.v < 60 ? '#F59E0B' : '#DC2626')
            : (d.v >= 70 ? '#0A6640' : d.v >= 50 ? '#F59E0B' : '#DC2626');
          return (
            <View key={d.k} style={S.dimRow}>
              <Text style={S.dimLbl}>{d.k} — {d.n}</Text>
              <View style={S.dimBg}>
                <View style={{ width: `${d.v}%`, backgroundColor: c, height: 8, borderRadius: 4 }} />
              </View>
              <Text style={[S.dimScore, { color: c }]}>{d.v}</Text>
            </View>
          );
        })}

        {/* Recommendations */}
        <Text style={[S.sLabel, { marginTop: 12 }]}>Priority Recommendations</Text>
        {result.recommendations.slice(0, 3).map((r, i) => (
          <View key={i} style={r.priority === 'critical' ? S.recCard : S.recCardHigh}>
            <Text style={S.recTitle}>{r.priority === 'critical' ? '🚨 CRITICAL' : '⚠ HIGH'} · {r.dimensionName}</Text>
            <Text style={S.recText}>{r.message}</Text>
          </View>
        ))}

        {/* Footer */}
        <View style={S.footer} fixed>
          <View>
            <Text style={S.footerTxt}>Dual-Rhythm Architecture™ · Methodology: Dual-Rhythm Architecture™ / The OSS Index™ · DOI: 10.5281/zenodo.19941449</Text>
            {reportId && <Text style={S.footerMeta}>Report ID: {reportId} · Generated: {generatedAt ?? assessmentDate}</Text>}
          </View>
          <Text style={S.footerTxt}>Confidential · {assessmentDate}</Text>
        </View>
      </Page>
    </Document>
  );
}
