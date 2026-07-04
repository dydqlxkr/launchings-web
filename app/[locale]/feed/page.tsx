import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { getRepo } from '@/lib/repo';
import { storagePublicUrl } from '@/lib/thumbnailUrl';
import NavbarClient from '@/components/NavbarClient';
import FeedClient from '@/components/FeedClient';

// 홈/앱 목록과 동일한 정적(SSG) 패턴 — cookies() 접근 금지, 개인화는 클라이언트(useSession)에서.
export const revalidate = 300;

export const metadata: Metadata = {
  title: '데모 피드',
  description: '한국 빌더들이 만든 작동 제품을 세로 피드로 빠르게 둘러보세요.',
  alternates: { canonical: '/ko/feed' },
};

export default async function FeedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const repo = getRepo();
  const apps = await repo.listApps({ sort: 'votes' });

  // 리뷰 수 + 첫 스크린샷 URL — 비개인화 데이터이며 repo 구현체(Supabase)에서
  // unstable_cache로 캐시되므로, 앱 수만큼 병렬 조회해도 빌드/ISR 시점 비용은 낮다.
  const [reviewStatsList, screenshotsList] = await Promise.all([
    Promise.all(apps.map((app) => repo.getReviewStats(app.id))),
    Promise.all(apps.map((app) => repo.listScreenshots(app.id))),
  ]);

  const reviewCounts: Record<string, number> = {};
  const firstScreenshotUrls: Record<string, string | null> = {};
  apps.forEach((app, i) => {
    reviewCounts[app.id] = reviewStatsList[i].review_count;
    const shots = screenshotsList[i];
    firstScreenshotUrls[app.id] = shots.length > 0 ? storagePublicUrl(shots[0].storage_path) : null;
  });

  return (
    <>
      <NavbarClient />
      <FeedClient
        apps={apps}
        reviewCounts={reviewCounts}
        firstScreenshotUrls={firstScreenshotUrls}
      />
    </>
  );
}
