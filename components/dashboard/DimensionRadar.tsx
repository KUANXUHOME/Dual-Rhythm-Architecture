// components/dashboard/DimensionRadar.tsx — 4-dimension radar chart
'use client';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  er: number;
  pr: number;
  ri: number;
  a: number;
}

export function DimensionRadar({ er, pr, ri, a }: Props) {
  const data = [
    { dim: 'ER', value: er, fullMark: 100 },
    { dim: 'PR', value: pr, fullMark: 100 },
    { dim: 'RI', value: ri, fullMark: 100 },
    { dim: 'A',  value: a,  fullMark: 100 },
  ];

  return (
    <div className="bg-white border border-border rounded-large p-5">
      <h3 className="text-sm font-bold text-ink mb-4">4-Dimension Profile</h3>
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="#E2E8F0" />
          <PolarAngleAxis dataKey="dim" tick={{ fontSize: 12, fill: '#4B5563', fontWeight: 600 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} />
          <Radar
            dataKey="value"
            stroke="#0A6640"
            fill="#0A6640"
            fillOpacity={0.15}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 12 }}
            formatter={(v) => [String(v), 'Score']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
