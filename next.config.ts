import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Next.js 15: use serverExternalPackages (not experimental.serverComponentsExternalPackages)
  serverExternalPackages: ['@react-pdf/renderer'],
  experimental: {},
};

export default nextConfig;
