import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { cache } from 'react';
import { getRepo } from '@/lib/repo';
import { getCurrentUser } from '@/lib/supabase/getCurrentUser';
import { isSafeHttpUrl } from '@/lib/validations';
import NavbarServer from '@/components/NavbarServer';
import Footer from '@/components/Footer';
import AvatarCircle from '@/components/AvatarCircle';
import AppCard from '@/components/AppCard';
import { CompareProvider } from '@/components/CompareContext';
import CompareBar from '@/components/CompareBar';
import FollowButton from '@/components/FollowButton';

interface PageProps {
  params: Promise<{ locale: string; handle: string }>;
}

// React cache — generateMetadata와 page 함수 간 dedupe
const getProfileByHandleCached = cache((handle: string) => getRepo().getProfileByHandle(handle));
const listAppsByAuthorCached = cache((authorId: string) => getRepo().listAppsByAuthor(authorId));

// 로그인 세션(cookies)을 읽어 개인화되므로 항상 동적 렌더.
// (generateStaticParams + cookies() 조합의 DYNAMIC_SERVER_USAGE 500 방지)
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getProfileByHandleCached(handle);

  if (!profile) return {};

  const apps = await listAppsByAuthorCached(profile.id);
  const description = profile.bio
    ? `${profile.display_name} · ${profile.bio} · 제품 ${apps.length}개`
    : `${profile.display_name}의 빌더 프로필 · 만든 제품 ${apps.length}개`;
  const canonicalUrl = `/ko/makers/${handle}`;

  return {
    title: profile.display_name,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'profile',
      locale: 'ko_KR',
      url: `https://launchings.io${canonicalUrl}`,
      title: `${profile.display_name} | Launchings`,
      description,
      siteName: 'Launchings',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${profile.display_name} | Launchings`,
      description,
    },
  };
}

export default async function MakerProfilePage({ params }: PageProps) {
  const { handle } = await params;
  const t = await getTranslations('makerDetail');
  const repo = getRepo();

  // generateMetadata와 dedupe
  const profile = await getProfileByHandleCached(handle);
  if (!profile) notFound();

  // apps, user, followStatus 병렬 조회
  const [apps, user] = await Promise.all([
    listAppsByAuthorCached(profile.id),
    getCurrentUser(),
  ]);

  const isLoggedIn = !!user;
  const totalVotes = apps.reduce((sum, a) => sum + a.vote_count, 0);

  // 팔로우 상태 조회 (본인 프로필이 아닐 때만 의미 있음)
  const isOwn = !!user && user.id === profile.id;
  const followStatus = await repo.getFollowStatus(profile.id, user?.id ?? null);

  const joinedYear = new Date(profile.created_at).getFullYear();
  const joinedMonth = new Date(profile.created_at).getMonth() + 1;

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
            ← {t('backToMakers')}
          </Link>

          {/* Profile hero */}
          <div
            style={{
              display: 'flex',
              gap: 20,
              alignItems: 'flex-start',
              marginBottom: 28,
              flexWrap: 'wrap',
            }}
          >
            <AvatarCircle profile={profile} size={78} fontSize={32} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                  marginBottom: 4,
                }}
              >
                {profile.display_name}
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                  🇰🇷 한국
                </span>
              </h1>

              {profile.bio && (
                <p
                  style={{
                    color: '#cfd6e4',
                    fontSize: 14,
                    lineHeight: 1.5,
                    marginTop: 8,
                    maxWidth: 540,
                  }}
                >
                  {profile.bio}
                </p>
              )}

              {/* Stats */}
              <div
                style={{
                  display: 'flex',
                  gap: 20,
                  marginTop: 16,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{apps.length}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{t('products')}</div>
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>
                    {totalVotes >= 1000
                      ? `${(totalVotes / 1000).toFixed(1)}k`
                      : String(totalVotes)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>총 추천</div>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--muted)', marginTop: 4 }}>
                    {t('joinedAt')} {joinedYear}.{String(joinedMonth).padStart(2, '0')}
                  </div>
                </div>
              </div>

              {/* 팔로우 버튼 — 본인 프로필 제외 */}
              {!isOwn && (
                <div style={{ marginTop: 16 }}>
                  <FollowButton
                    makerId={profile.id}
                    isLoggedIn={isLoggedIn}
                    initialFollowing={followStatus.following}
                    initialFollowerCount={followStatus.follower_count}
                  />
                </div>
              )}

              {profile.website_url && isSafeHttpUrl(profile.website_url) && (
                <a
                  href={profile.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    marginTop: 12,
                    fontSize: 13,
                    color: 'var(--brand)',
                    fontWeight: 600,
                  }}
                >
                  🌐 {profile.website_url}
                </a>
              )}
            </div>
          </div>

          {/* Apps section */}
          <h2
            style={{
              fontSize: 16,
              color: 'var(--muted)',
              fontWeight: 700,
              letterSpacing: '.3px',
              marginBottom: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            📦 {t('products')} ({apps.length})
          </h2>

          {apps.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                color: 'var(--muted)',
                padding: '40px 0',
                fontSize: 14,
              }}
            >
              {t('noApps')}
            </div>
          ) : (
            <CompareProvider>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 18,
                }}
                className="grid-cols-1 sm:grid-cols-2"
              >
                {apps.map((app) => (
                  <AppCard key={app.id} app={app} isLoggedIn={isLoggedIn} />
                ))}
              </div>
              <CompareBar apps={apps} />
            </CompareProvider>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
