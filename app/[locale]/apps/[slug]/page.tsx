import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { cache } from 'react';
import { getRepo } from '@/lib/repo';
import { getDemoSrcdoc } from '@/lib/appDemos';
import { getCurrentUser } from '@/lib/supabase/getCurrentUser';
import { isSafeHttpUrl } from '@/lib/validations';
import { getThumbnailUrl, storagePublicUrl } from '@/lib/thumbnailUrl';
import { getVoteStatus } from '@/lib/actions/vote';
import { getBookmarkStatus } from '@/lib/actions/bookmark';
import NavbarServer from '@/components/NavbarServer';
import Footer from '@/components/Footer';
import AvatarCircle from '@/components/AvatarCircle';
import UpvoteButton from '@/components/UpvoteButton';
import BookmarkButton from '@/components/BookmarkButton';
import ShareButton from '@/components/ShareButton';
import ViewCount from '@/components/ViewCount';
import AppRunner from '@/components/AppRunner';
import ReportButton from '@/components/ReportButton';
import AppDetailClient from '@/components/AppDetailClient';
import ScreenshotGallery from '@/components/ScreenshotGallery';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

// React cache — generateMetadata와 page 함수에서 같은 slug로 호출 시 1회만 DB 조회
const getAppBySlugCached = cache((slug: string) => getRepo().getAppBySlug(slug));
const listCategoriesCached = cache(() => getRepo().listCategories());

// 로그인 세션(cookies)으로 업보트 상태 등 개인화되므로 항상 동적 렌더.
// (generateStaticParams + cookies() 조합의 DYNAMIC_SERVER_USAGE 500 방지)
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const app = await getAppBySlugCached(slug);

  if (!app) return {};

  const description = app.tagline ?? app.description;
  const canonicalUrl = `/ko/apps/${slug}`;

  return {
    title: app.title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'website',
      locale: 'ko_KR',
      url: `https://www.launchings.io${canonicalUrl}`,
      title: app.title,
      description,
      siteName: 'Launchings',
    },
    twitter: {
      card: 'summary_large_image',
      title: app.title,
      description,
    },
  };
}

export default async function AppDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const t = await getTranslations('appDetail');
  const repo = getRepo();

  // generateMetadata와 dedupe — 같은 요청 내 1회만 DB 조회
  const app = await getAppBySlugCached(slug);

  if (!app) notFound();

  const isNative = app.app_type === 'native';

  // srcdoc 데모 조회 (서버에서 결정 — 클라이언트 번들에 전체 데모 포함 불필요)
  const srcDoc = isNative ? null : getDemoSrcdoc(app.slug);

  // 현재 사용자 세션 (요청 내 1회로 dedupe)
  const user = await getCurrentUser();

  // 업보트/북마크 상태 — user.id를 직접 전달해 추가 getUser() 호출 제거
  const [{ voted: initialVoted }, { bookmarked: initialBookmarked }] = await Promise.all([
    user ? getVoteStatus(app.id, user.id) : Promise.resolve({ voted: false }),
    user ? getBookmarkStatus(app.id, user.id) : Promise.resolve({ bookmarked: false }),
  ]);

  // 리뷰 + 기능 요청 + 카테고리 목록 + 스크린샷 병렬 조회 (listCategories도 dedupe)
  const [reviews, reviewStats, myReview, featureRequests, myVotedIdsSet, allCategories, screenshots] = await Promise.all([
    repo.listReviews(app.id),
    repo.getReviewStats(app.id),
    user ? repo.getMyReview(app.id, user.id) : Promise.resolve(null),
    repo.listFeatureRequests(app.id),
    user ? repo.getMyFeatureVotes(app.id, user.id) : Promise.resolve(new Set<string>()),
    listCategoriesCached(),
    repo.listScreenshots(app.id),
  ]);

  // storage_path → 공개 URL 변환
  const screenshotUrls = screenshots.map((s) => storagePublicUrl(s.storage_path));
  const myVotedIds = Array.from(myVotedIdsSet);

  // slug → {label_ko, emoji} 맵 (DB 기반)
  const catMap = new Map(allCategories.map((c) => [c.slug, c]));
  const catLabels = (app.categories ?? [])
    .map((cSlug) => {
      const c = catMap.get(cSlug);
      return c ? `${c.emoji} ${c.label_ko}` : cSlug;
    })
    .join(', ');

  return (
    <>
      <NavbarServer />
      <main style={{ flex: 1, width: '100%' }}>
        <div
          className="lp-container--md"
          style={{
            paddingTop: 40,
            paddingBottom: 40,
          }}
        >
          {/* Back */}
          <Link
            href="/ko"
            style={{
              color: 'var(--muted)',
              fontSize: 13,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 24,
            }}
            className="hover:text-[var(--ink)] transition-colors"
          >
            ← {t('backToApps')}
          </Link>

          {/* App header */}
          <div style={{ marginBottom: 28 }}>
            {/* 행 1: 썸네일 + 제목/태그라인/메이커 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 20,
              }}
            >
              {/* Thumbnail */}
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 40,
                  background: app.thumbnail_gradient
                    ? `linear-gradient(${app.thumbnail_gradient})`
                    : 'var(--card)',
                  flexShrink: 0,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {app.thumbnail_path ? (
                  <Image
                    src={getThumbnailUrl(app.thumbnail_path)}
                    alt={`${app.title} 썸네일`}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="80px"
                  />
                ) : (
                  app.thumbnail_emoji
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <h1
                    style={{
                      fontSize: 28,
                      fontWeight: 800,
                      letterSpacing: '-.5px',
                    }}
                  >
                    {app.title}
                  </h1>
                  {!isNative && (
                    <span
                      style={{
                        fontSize: 11,
                        color: 'var(--accent)',
                        background: 'rgba(46,230,166,.12)',
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontWeight: 700,
                      }}
                    >
                      ● LIVE
                    </span>
                  )}
                </div>

                {app.tagline && (
                  <p style={{ color: 'var(--muted)', fontSize: 15, marginTop: 6 }}>
                    {app.tagline}
                  </p>
                )}

                {/* Maker */}
                {app.author && (
                  <Link
                    href={`/ko/makers/${app.author.handle}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      marginTop: 10,
                      fontSize: 13,
                      color: 'var(--muted)',
                    }}
                    className="hover:text-[var(--brand)] transition-colors"
                  >
                    <AvatarCircle profile={app.author} size={24} fontSize={12} />
                    {t('by')} {app.author.display_name} →
                  </Link>
                )}
              </div>
            </div>

            {/* 행 2: 액션 버튼 그룹 (업보트 · 북마크 · 공유 · 조회수) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
                marginTop: 16,
              }}
            >
              <UpvoteButton
                appId={app.id}
                initialCount={app.vote_count}
                initialVoted={initialVoted}
                isLoggedIn={!!user}
              />
              <BookmarkButton
                appId={app.id}
                initialBookmarked={initialBookmarked}
                isLoggedIn={!!user}
              />
              <ShareButton slug={app.slug} />
              <ViewCount count={app.view_count} style={{ marginLeft: 4 }} />
            </div>
          </div>

          {/* App runner (Phase 3 구현) — 제목/메이커/액션버튼 바로 아래, 설명보다 위
              데모가 있는 webapp(live_url 또는 srcDoc)만 표시. native는 NativeDemoView(내부 폴백)로 처리. */}
          <AppRunner app={app} srcDoc={srcDoc} screenshotUrls={screenshotUrls} />

          {/* Description */}
          <div
            style={{
              background: 'rgba(255,255,255,.03)',
              border: '1px solid var(--line)',
              borderRadius: 12,
              padding: '18px 20px',
              marginBottom: 28,
              marginTop: 28,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--muted)',
                marginBottom: 10,
                textTransform: 'uppercase',
                letterSpacing: '.06em',
              }}
            >
              제품 설명
            </div>
            <p
              style={{
                color: '#cfd6e4',
                fontSize: 15,
                lineHeight: 1.75,
                margin: 0,
                whiteSpace: 'pre-wrap',
              }}
            >
              {app.description}
            </p>
          </div>

          {/* Meta row */}
          <div
            style={{
              display: 'flex',
              gap: 24,
              flexWrap: 'wrap',
              marginBottom: 28,
            }}
          >
            {/* Stack */}
            {(app.stacks ?? []).length > 0 && (
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontWeight: 700 }}>
                  {t('stack')}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(app.stacks ?? []).map((s) => (
                    <span
                      key={s}
                      style={{
                        background: 'var(--chip)',
                        border: '1px solid var(--line)',
                        borderRadius: 7,
                        padding: '3px 9px',
                        fontSize: 12,
                        color: 'var(--muted)',
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Category */}
            {catLabels && (
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontWeight: 700 }}>
                  {t('category')}
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink)' }}>{catLabels}</div>
              </div>
            )}
          </div>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 36 }}>
            {isNative ? (
              <>
                {app.store_url_ios && isSafeHttpUrl(app.store_url_ios) && (
                  <a
                    href={app.store_url_ios}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: 'linear-gradient(135deg,var(--brand),var(--brand2))',
                      color: '#fff',
                      padding: '11px 20px',
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: 14,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    📱 {t('appStore')}
                  </a>
                )}
                {app.store_url_android && isSafeHttpUrl(app.store_url_android) && (
                  <a
                    href={app.store_url_android}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      border: '1px solid var(--line)',
                      color: 'var(--ink)',
                      padding: '11px 20px',
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: 14,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    🤖 {t('playStore')}
                  </a>
                )}
                {/* 웹 데모 URL(live_url 재활용) — 상세 페이지 폰 프레임 위 데모 안내 링크 */}
                {app.live_url && isSafeHttpUrl(app.live_url) && (
                  <a
                    href={app.live_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      border: '1px solid var(--line)',
                      color: 'var(--ink)',
                      padding: '11px 20px',
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: 14,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <svg
                      width={14}
                      height={14}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    {t('openWebDemo')}
                  </a>
                )}
              </>
            ) : (
              app.live_url && isSafeHttpUrl(app.live_url) && (
                <a
                  href={app.live_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: 'linear-gradient(135deg,var(--brand),var(--brand2))',
                    color: '#fff',
                    padding: '11px 20px',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 14,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <svg
                    width={14}
                    height={14}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  {t('visitSite')}
                </a>
              )
            )}
          </div>

          {/* 스크린샷 갤러리 — 1장 이상일 때만 표시 (클릭 시 라이트박스).
              native 앱은 상단 데모 영역(NativeDemoView)의 스크린샷 스트립이
              라이트박스를 겸하므로 하단 갤러리는 중복이라 숨긴다. */}
          {app.app_type !== 'native' && (
            <ScreenshotGallery
              urls={screenshotUrls}
              label={t('screenshots')}
              alts={screenshotUrls.map((_, i) => t('screenshotAlt', { n: i + 1 }))}
            />
          )}

          {/* 리뷰 + 기능 요청 섹션 */}
          <AppDetailClient
            appId={app.id}
            appSlug={app.slug}
            reviews={reviews}
            stats={reviewStats}
            myReview={myReview}
            featureRequests={featureRequests}
            myVotedIds={myVotedIds}
            isLoggedIn={!!user}
            userId={user?.id}
          />

          {/* 신고 영역 */}
          <div
            style={{
              marginTop: 40,
              paddingTop: 20,
              borderTop: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              이 앱에 문제가 있나요?
            </span>
            <ReportButton appId={app.id} isLoggedIn={!!user} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
