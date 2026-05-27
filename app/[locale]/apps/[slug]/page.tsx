import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getRepo } from '@/lib/repo';
import { getDemoSrcdoc } from '@/lib/appDemos';
import { createClient } from '@/lib/supabase/server';
import { getVoteStatus } from '@/lib/actions/vote';
import NavbarServer from '@/components/NavbarServer';
import Footer from '@/components/Footer';
import AvatarCircle from '@/components/AvatarCircle';
import UpvoteButton from '@/components/UpvoteButton';
import AppRunner from '@/components/AppRunner';
import ReportButton from '@/components/ReportButton';
import AppDetailClient from '@/components/AppDetailClient';
import { CATEGORIES } from '@/data/seed';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  // generateStaticParams는 빌드 타임 실행이므로 cookies() 컨텍스트 없음.
  // Supabase 환경이라도 로컬 시드에서 정적 경로를 가져온다.
  // 런타임 ISR에서 실제 DB 데이터가 반영된다.
  const { default: localRepo } = await import('@/lib/repo/local');
  const slugs = await localRepo.listAppSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const repo = getRepo();
  const app = await repo.getAppBySlug(slug);

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
      url: `https://launchings.io${canonicalUrl}`,
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
  const app = await repo.getAppBySlug(slug);

  if (!app) notFound();

  const isNative = app.app_type === 'native';

  // srcdoc 데모 조회 (서버에서 결정 — 클라이언트 번들에 전체 데모 포함 불필요)
  const srcDoc = isNative ? null : getDemoSrcdoc(app.slug);

  // 현재 사용자 세션 및 업보트 상태 조회
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { voted: initialVoted } = user
    ? await getVoteStatus(app.id)
    : { voted: false };

  // 리뷰 데이터 조회
  const [reviews, reviewStats, myReview] = await Promise.all([
    repo.listReviews(app.id),
    repo.getReviewStats(app.id),
    user ? repo.getMyReview(app.id, user.id) : Promise.resolve(null),
  ]);

  const catLabels = (app.categories ?? [])
    .map((cSlug) => {
      const c = CATEGORIES.find((x) => x.slug === cSlug);
      return c ? `${c.emoji} ${c.label_ko}` : cSlug;
    })
    .join(', ');

  return (
    <>
      <NavbarServer />
      <main style={{ flex: 1, width: '100%' }}>
        <div
          style={{
            maxWidth: 900,
            width: '100%',
            marginLeft: 'auto',
            marginRight: 'auto',
            paddingLeft: 24,
            paddingRight: 24,
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
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 20,
              marginBottom: 28,
              flexWrap: 'wrap',
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
              }}
            >
              {app.thumbnail_emoji}
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

            <UpvoteButton
              appId={app.id}
              initialCount={app.vote_count}
              initialVoted={initialVoted}
              isLoggedIn={!!user}
            />
          </div>

          {/* Description */}
          <div
            style={{
              background: 'rgba(255,255,255,.03)',
              border: '1px solid var(--line)',
              borderRadius: 12,
              padding: '18px 20px',
              marginBottom: 28,
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
                {app.store_url_ios && (
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
                {app.store_url_android && (
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
              </>
            ) : (
              app.live_url && (
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
                  ↗ {t('visitSite')}
                </a>
              )
            )}
          </div>

          {/* App runner (Phase 3 구현) */}
          <AppRunner app={app} srcDoc={srcDoc} />

          {/* 리뷰 섹션 */}
          <AppDetailClient
            appId={app.id}
            appSlug={app.slug}
            reviews={reviews}
            stats={reviewStats}
            myReview={myReview}
            isLoggedIn={!!user}
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
