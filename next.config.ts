import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Skip ESLint during production builds (handled separately in dev/PRs)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Skip type checking during production builds; CI runs tests separately
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
