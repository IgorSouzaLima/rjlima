import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  // Approved production release. Exact-host checks still exclude previews and localhost.
  env: { SEO_INDEXING_ENABLED: process.env.SEO_INDEXING_ENABLED ?? 'true' },
  async rewrites() {
    return [
      { source: '/rastreio', destination: '/legacy/rastreio/index.html' },
      { source: '/admin', destination: '/legacy/admin/index.html' },
      { source: '/admin/login', destination: '/legacy/admin/login/index.html' },
    ];
  },
  async headers() {
    return ['/rastreio', '/admin/:path*', '/legacy/:path*'].map(source => ({
      source, headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
    }));
  },
};
export default nextConfig;
