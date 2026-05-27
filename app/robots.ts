/**
 * app/robots.ts — Next.js 16 robots.txt 생성
 *
 * 전체 허용 + sitemap 링크.
 * /auth/ 와 /ko/submit 은 크롤링 제외 (인증·폼 페이지).
 */

import type { MetadataRoute } from 'next';

const BASE_URL = 'https://launchings.io';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/auth/', '/ko/submit'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
