import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

// H-1: 보안 헤더 — 모든 경로에 적용
// ⚠️ 전체 CSP(script-src/style-src)는 포함하지 않음.
//    이 사이트는 인라인 style={{}} 과 iframe srcDoc 를 광범위하게 사용하므로
//    strict CSP를 지금 enforce하면 화면을 깨뜨림.
//    Content-Security-Policy-Report-Only 로 점진적으로 관찰 후 enforce로 전환 예정.
//    현재 enforce는 frame-ancestors 'self' 만 적용 (우리 사이트가 외부에 임베드되는 것 방지).

/**
 * H-2: Content-Security-Policy-Report-Only
 *
 * 목적: 차단 없이 위반만 관찰하는 단계. 실제 사이트 동작에 영향 없음.
 *
 * 소스 근거:
 *   - default-src 'self': 기본 동일출처 허용
 *   - script-src 'self' 'unsafe-inline':
 *       Next.js 16 App Router는 hydration용 인라인 <script> 를 emit함.
 *       nonce/hash 기반 strict CSP는 next.config 별도 설정 필요 — 현재 단계엔 unsafe-inline 허용.
 *       Vercel Analytics/Speed Insights 스크립트도 인라인·동적 로딩 사용.
 *   - style-src 'self' 'unsafe-inline':
 *       인라인 style={{}} 을 전 페이지에서 사용하므로 unsafe-inline 필요.
 *   - img-src 'self' data: blob: https:
 *       Supabase Storage(*.supabase.co), Next Image, 외부 OG 이미지 대응.
 *   - connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vitals.vercel-insights.com:
 *       Supabase REST/Realtime API, Vercel Speed Insights 리포팅 엔드포인트.
 *   - frame-src https: blob::
 *       외부 앱 데모 iframe(임의 https) + YouTube/Vimeo embed + srcdoc blob.
 *       frame-src * 로 열어두면 안 되므로 https: 로 제한 (외부 데모 정책상 필요).
 *   - media-src 'self' https::
 *       데모 영상 재생 대응.
 *   - font-src 'self':
 *       로컬 폰트만 사용 (외부 CDN 폰트 없음).
 *   - object-src 'none':
 *       Flash 등 플러그인 차단 (보안 기본값).
 *   - base-uri 'self':
 *       <base> 태그 악용 방어.
 */
const cspReportOnly = [
  "default-src 'self'",
  // Next.js 16 App Router는 hydration 인라인 <script> emit — unsafe-inline 필요
  "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://vitals.vercel-insights.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  // Supabase REST/Realtime + Vercel Speed Insights
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vitals.vercel-insights.com",
  // 외부 데모 iframe(임의 https), YouTube/Vimeo embed, srcdoc blob
  // NOTE: frame-src https: — 임의 외부 데모 임베드 정책상 https 전체 허용 필요
  "frame-src https: blob:",
  "media-src 'self' https:",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
].join('; ');

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
  // H-2: 차단 없이 위반 관찰 (Report-Only). enforce 전환 전 단계.
  {
    key: 'Content-Security-Policy-Report-Only',
    value: cspReportOnly,
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
