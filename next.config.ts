import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
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
