// components/dashboard/OssTrendChart.tsx — OSS + RI trend with risk zone bands
'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, Legend } from 'recharts';

interface DataPoint {
  date: string;
  oss: number;
  ri: number;
}

export function OssTrendChart({ data }: { data: DataPoint[] }) {
  const formatted = data.map(d => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <div className="bg-white border border-border rounded-large p-5">
      <h3 className="text-sm font-bold text-ink mb-4">OSS™ & RI Trend</h3>
      {data.length < 2 ? (
        <div className="h-48 flex items-center justify-center text-center">
          <p className="text-sm text-ink-muted">
            Complete another quarterly diagnostic to see your stability trend.
            <br />Current data points: {data.length}
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={formatted} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            {/* Risk zone background bands */}
            <ReferenceArea y1={80} y2={100} fill="#0A6640" fillOpacity={0.06} />
            <ReferenceArea y1={65} y2={80}  fill="#059669" fillOpacity={0.06} />
            <ReferenceArea y1={50} y2={65}  fill="#F59E0B" fillOpacity={0.06} />
            <ReferenceArea y1={35} y2={50}  fill="#DC2626" fillOpacity={0.06} />
            <ReferenceArea y1={0}  y2={35}  fill="#991B1B" fillOpacity={0.08} />

            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 12 }}
              labelStyle={{ color: '#0F1A14', fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="oss" stroke="#0A6640" strokeWidth={2.5} dot={{ r: 4, fill: '#0A6640' }} name="OSS™" />
            <Line type="monotone" dataKey="ri"  stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: '#F59E0B' }} name="RI (leading)" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
