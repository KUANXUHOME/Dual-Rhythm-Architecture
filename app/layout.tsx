import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProviders } from '@/components/providers/AppProviders';
import { RegisterSW } from '@/components/pwa/RegisterSW';

export const metadata: Metadata = {
  title: { default: 'Dual-Rhythm Architecture™', template: '%s | Dual-Rhythm Architecture™' },
  description: 'Your board-ready organizational stability agent. Powered by The OSS Index™ — a peer-reviewed, physics-based framework for measuring structural stability under acceleration.',
  keywords: ['organizational stability', 'The OSS Index', 'CEO diagnostic', 'Dual-Rhythm Architecture', 'structural stability', 'board governance'],
  authors: [{ name: 'Li Kuanxu', url: 'https://orcid.org/0009-0006-7346-3999' }],
  manifest: '/manifest.json',
  openGraph: {
    title: 'Dual-Rhythm Architecture™',
    description: 'Quantify your organizational stability with The OSS Index™.',
    url: 'https://dualrhythmsystems.com',
    siteName: 'Dual-Rhythm Architecture™',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0A6640',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <RegisterSW />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
