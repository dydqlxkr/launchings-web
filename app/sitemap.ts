/**
 * app/sitemap.ts — Next.js 16 동적 사이트맵
 *
 * 정적 페이지 + Supabase published 앱/메이커 URL 포함.
 * generateStaticParams와 동일한 패턴: Supabase 쿠키 컨텍스트가 없는 빌드 타임에는
 * localRepo 폴백으로 시드 데이터 슬러그/핸들 사용.
 */

import type { MetadataRoute } from 'next';
import { getRepo } from '@/lib/repo';

const BASE_URL = 'https://launchings.io';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ── 정적 페이지 ─────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/ko`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/ko/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/ko/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // ── 동적 페이지 (앱 / 메이커) ────────────────────────────────
  let appSlugs: string[] = [];
  let handles: string[] = [];

  try {
    // 런타임(ISR/SSR): SupabaseRepo 사용 가능하면 실 데이터
    const repo = getRepo();
    const [slugsResult, handlesResult] = await Promise.all([
      repo.listAppSlugs(),
      repo.listHandles(),
    ]);
    appSlugs = slugsResult;
    handles = handlesResult;
  } catch {
    // 빌드 타임 쿠키 컨텍스트 없음 → localRepo 폴백
    const { default: localRepo } = await import('@/lib/repo/local');
    const [slugsResult, handlesResult] = await Promise.all([
      localRepo.listAppSlugs(),
      localRepo.listHandles(),
    ]);
    appSlugs = slugsResult;
    handles = handlesResult;
  }

  const appPages: MetadataRoute.Sitemap = appSlugs.map((slug) => ({
    url: `${BASE_URL}/ko/apps/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const makerPages: MetadataRoute.Sitemap = handles.map((handle) => ({
    url: `${BASE_URL}/ko/makers/${handle}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...appPages, ...makerPages];
}
