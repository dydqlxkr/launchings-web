import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

// H-1: 보안 헤더 — 모든 경로에 적용
// ⚠️ 전체 CSP(script-src/style-src)는 포함하지 않음.
//    이 사이트는 인라인 style={{}} 과 iframe srcDoc 를 광범위하게 사용하므로
//    strict CSP를 지금 적용하면 화면을 깨뜨림.
//    TODO: Content-Security-Policy-Report-Only 로 점진적으로 도입 후 enforce로 전환할 것.
//    현재는 frame-ancestors 'self' 만 적용 (우리 사이트가 외부에 임베드되는 것 방지).
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  // 클릭재킹 방어 (이중 적용: X-Frame-Options + CSP frame-ancestors)
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'self'",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // 모든 경로에 보안 헤더 적용
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      // Supabase Storage (Phase 2)
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
