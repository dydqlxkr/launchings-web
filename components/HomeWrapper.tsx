'use client';

/**
 * HomeWrapper — 홈 발견 영역 리팩터(P0-4).
 *
 * 섹션 순서:
 *   1. 큐레이션 맛보기 — 트렌딩 상위 6~9개 그리드 + "전체 둘러보기 →" 링크
 *      (검색바·정렬은 홈에서 제거, 정식 카탈로그는 /ko/apps)
 *   2. 주목받는 메이커 — 4열 그리드 (#makers)
 *   3. 채용 CTA 밴드 (#recruit)
 */

import { useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { AppWithRelations, Profile, Category } from '@/lib/types';
import AppCard from './AppCard';
import AvatarCircle from './AvatarCircle';
import { CompareProvider } from './CompareContext';
import CompareBar from './CompareBar';
import { useToast } from '@/components/Toast';

interface Props {
  apps: AppWithRelations[];
  profiles: Profile[];
  categories: Category[];
  makerApps: Record<string, AppWithRelations[]>;
  isLoggedIn: boolean;
}

/** 홈 맛보기 최대 표시 수 */
const HOME_PREVIEW_COUNT = 9;

// 빌더/앱이 일정 수 쌓이기 전에는 채용 BM을 과하게 노출하지 않는다 (P2-9).
// 임계치 미만이면 채용 섹션을 슬림(헤드라인 + '관심 등록' CTA만)하게 보여준다.
const RECRUIT_MATURE_MIN_APPS = 10;
const RECRUIT_MATURE_MIN_BUILDERS = 3;

// ─────────────────────────────────────────────────────────────────────────────
// MakerMiniCard — 시안의 .mcard (텍스트 중앙정렬, 통계 2개)
// ─────────────────────────────────────────────────────────────────────────────
function MakerMiniCard({
  profile,
  apps,
}: {
  profile: Profile;
  apps: AppWithRelations[];
}) {
  const t = useTranslations('makersSection');
  const totalVotes = apps.reduce((s, a) => s + a.vote_count, 0);

  const voteDisplay =
    totalVotes >= 1000
      ? `${(totalVotes / 1000).toFixed(1)}k`
      : String(totalVotes);

  return (
    <Link
      href={`/ko/makers/${profile.handle}`}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: 16,
        padding: 20,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transition: 'transform .18s, border-color .18s',
        cursor: 'pointer',
        textDecoration: 'none',
      }}
      className="hover:-translate-y-1 hover:border-[var(--brand2)]"
    >
      {/* 아바타 */}
      <div style={{ marginBottom: 12 }}>
        <AvatarCircle profile={profile} size={60} fontSize={24} />
      </div>

      {/* 이름 */}
      <div style={{ fontWeight: 700, fontSize: 15.5, color: 'var(--ink)' }}>
        {profile.display_name}
      </div>

      {/* 역할/bio */}
      {profile.bio && (
        <div
          style={{
            color: 'var(--muted-strong)',
            fontSize: 12.5,
            marginBottom: 4,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {profile.bio}
        </div>
      )}

      {/* 검증 배지 — 호버/포커스 시 검증 기준 설명 (P1-6) */}
      <div
        title={t('verifiedTooltip')}
        aria-label={`${t('verified')}: ${t('verifiedTooltip')}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--accent)',
          background: 'rgba(46,230,166,.1)',
          padding: '3px 8px',
          borderRadius: 6,
          marginTop: 6,
          marginBottom: 12,
          cursor: 'help',
        }}
      >
        ✓ {t('verified')}
      </div>

      {/* 통계 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          paddingTop: 12,
          borderTop: '1px solid var(--line)',
          width: '100%',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>
            {apps.length}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted-strong)' }}>{t('appCount')}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>
            {voteDisplay}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted-strong)' }}>{t('voteCount')}</div>
        </div>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RecruitCTA — 시안의 #recruit 밴드 (v1: 버튼은 토스트만)
// ─────────────────────────────────────────────────────────────────────────────
function RecruitCTA({ mature }: { mature: boolean }) {
  const t = useTranslations('recruitSection');
  const toast = useToast();

  function handleInterest() {
    toast.show(t('ctaToast'), 'success');
  }

  return (
    <section id="recruit" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="lp-container" style={{ paddingBottom: 64 }}>
        <div
          style={{
            background:
              'linear-gradient(135deg,rgba(108,140,255,.16),rgba(155,108,255,.12))',
            border: '1px solid rgba(108,140,255,.35)',
            borderRadius: 24,
            padding: '48px',
            display: 'flex',
            gap: 40,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {/* 텍스트 */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <h2
              style={{
                fontSize: 30,
                letterSpacing: '-.8px',
                marginBottom: 14,
                lineHeight: 1.2,
                fontWeight: 800,
              }}
            >
              {t('title')}
            </h2>
            <p
              style={{
                color: 'var(--muted)',
                fontSize: 15.5,
                marginBottom: 22,
                maxWidth: 440,
              }}
            >
              {t('desc')}
            </p>

            {/* 태그 — 빌더가 쌓인 뒤에만 BM 약속을 노출 (P2-9) */}
            {mature && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
                {[t('tag1'), t('tag2'), t('tag3')].map((tag) => (
                  <span
                    key={tag}
                    style={{
                      background: 'var(--card2)',
                      border: '1px solid var(--line)',
                      borderRadius: 999,
                      padding: '7px 14px',
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--ink)',
                    }}
                  >
                    ✓ {tag}
                  </span>
                ))}
              </div>
            )}

            <button
              onClick={handleInterest}
              style={{
                background: 'linear-gradient(135deg,var(--brand),var(--brand2))',
                color: '#fff',
                border: 0,
                borderRadius: 12,
                padding: '13px 24px',
                fontSize: 15.5,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {t('ctaButton')}
            </button>
          </div>

          {/* 비주얼 카드 — 채용 매칭은 준비 중이므로 블러 미리보기로 노출 (P2-9).
              실제 데이터가 아니며 블러+오버레이로 '준비 중'임을 명확히 한다. */}
          <div
            style={{
              flex: '0 0 300px',
              background: 'var(--card)',
              border: '1px solid var(--line)',
              borderRadius: 16,
              padding: 18,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* 미리보기 콘텐츠 — 블러 + 비상호작용 (스크린리더/탭 제외) */}
            <div
              aria-hidden="true"
              style={{
                filter: 'blur(4px)',
                pointerEvents: 'none',
                userSelect: 'none',
                opacity: 0.9,
              }}
            >
              {/* 프로필 행 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg,#6c8cff,#9b6cff)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    color: '#fff',
                    flexShrink: 0,
                  }}
                >
                  B
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>
                    {t('visualName')}{' '}
                    <span style={{ color: 'var(--accent)', fontSize: 12 }}>✓</span>
                  </div>
                  <div style={{ color: 'var(--muted-strong)', fontSize: 12.5 }}>
                    {t('visualRole')}
                  </div>
                </div>
              </div>

              {/* 스탯 바 목록 */}
              {[
                { label: t('visualStat1Label'), val: t('visualStat1Val'), pct: '85%' },
                { label: t('visualStat2Label'), val: t('visualStat2Val'), pct: '72%' },
                { label: t('visualStat3Label'), val: t('visualStat3Val'), pct: '90%' },
              ].map(({ label, val, pct }) => (
                <div key={label}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      color: 'var(--muted-strong)',
                      marginTop: 10,
                    }}
                  >
                    <span>{label}</span>
                    <span style={{ color: 'var(--ink)' }}>{val}</span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      background: 'var(--chip)',
                      borderRadius: 4,
                      overflow: 'hidden',
                      margin: '8px 0',
                    }}
                  >
                    <div
                      style={{
                        display: 'block',
                        height: '100%',
                        width: pct,
                        background: 'linear-gradient(90deg,var(--brand),var(--accent))',
                      }}
                    />
                  </div>
                </div>
              ))}

              <button
                tabIndex={-1}
                style={{
                  width: '100%',
                  marginTop: 16,
                  background: 'transparent',
                  border: '1px solid var(--line)',
                  color: 'var(--ink)',
                  borderRadius: 10,
                  padding: '9px 16px',
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: 'inherit',
                }}
              >
                {t('visualBtn')}
              </button>
            </div>

            {/* 크리스프 오버레이 — '준비 중' 배지 (블러 위) */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'var(--card)',
                  border: '1px solid var(--line)',
                  borderRadius: 999,
                  padding: '8px 14px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--ink)',
                  boxShadow: 'var(--shadow-pop)',
                }}
              >
                🔒 {t('previewOverlay')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HomeInner — 핵심 클라이언트 레이아웃 (CompareContext 안에서 렌더)
// ─────────────────────────────────────────────────────────────────────────────
function HomeInner({
  apps,
  profiles,
  makerApps,
  isLoggedIn,
}: Omit<Props, 'categories'>) {
  const t = useTranslations();
  const td = useTranslations('discover');
  const tn = useTranslations('newSection');
  const tm = useTranslations('makersSection');

  // 트렌딩 상위 앱 (추천순, 최대 HOME_PREVIEW_COUNT개)
  const trendingApps = useMemo(
    () =>
      [...apps]
        .sort((a, b) => b.vote_count - a.vote_count)
        .slice(0, HOME_PREVIEW_COUNT),
    [apps]
  );

  // 신규 앱 (등록일 최신순, 최대 HOME_PREVIEW_COUNT개)
  const newApps = useMemo(
    () =>
      [...apps]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, HOME_PREVIEW_COUNT),
    [apps]
  );

  // 표시할 메이커 (최대 8명, 추천 합계 기준 정렬)
  const featuredMakers = useMemo(() => {
    return [...profiles]
      .sort(
        (a, b) =>
          (makerApps[b.id] ?? []).reduce((s, x) => s + x.vote_count, 0) -
          (makerApps[a.id] ?? []).reduce((s, x) => s + x.vote_count, 0)
      )
      .slice(0, 8);
  }, [profiles, makerApps]);

  return (
    <>
      {/* ── 1. 큐레이션 맛보기 그리드 ─────────────────────────── */}
      <section id="discover" style={{ paddingTop: 14 }}>
        <div className="lp-container" style={{ paddingBottom: 46 }}>
          {/* 섹션 헤더 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginBottom: 24,
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 26,
                  letterSpacing: '-.6px',
                  fontWeight: 800,
                }}
              >
                🔥 {td('title')}
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: 14.5, marginTop: 4 }}>
                {td('subtitle')}
              </p>
            </div>
          </div>

          {/* 앱 그리드 */}
          {trendingApps.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                color: 'var(--muted)',
                padding: '60px 0',
                fontSize: 15,
              }}
            >
              <p style={{ marginBottom: 16 }}>{t('empty.message')}</p>
              <Link
                href="/ko/submit"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'linear-gradient(135deg,var(--brand),var(--brand2))',
                  color: '#fff',
                  padding: '10px 20px',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: 'none',
                }}
              >
                {t('empty.searchCta')}
              </Link>
            </div>
          ) : (
            <>
              <div className="lp-grid">
                {trendingApps.map((app) => (
                  <AppCard key={app.id} app={app} isLoggedIn={isLoggedIn} />
                ))}
              </div>

              {/* 전체 둘러보기 링크 */}
              <div style={{ textAlign: 'center', marginTop: 32 }}>
                <Link
                  href="/ko/apps"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'transparent',
                    border: '1px solid var(--line)',
                    color: 'var(--ink)',
                    padding: '11px 24px',
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: 15,
                    textDecoration: 'none',
                    transition: 'border-color .15s, color .15s',
                  }}
                  className="hover:border-[var(--brand)] hover:text-[var(--brand)]"
                >
                  {td('viewAll')}
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── 1.5 신규 앱 (등록 최신순) ─────────────────────────────── */}
      {newApps.length > 0 && (
        <section id="new">
          <div className="lp-container" style={{ paddingBottom: 46 }}>
            {/* 섹션 헤더 */}
            <div style={{ marginBottom: 24 }}>
              <h2
                style={{
                  fontSize: 26,
                  letterSpacing: '-.6px',
                  fontWeight: 800,
                }}
              >
                ✨ {tn('title')}
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: 14.5, marginTop: 4 }}>
                {tn('subtitle')}
              </p>
            </div>

            <div className="lp-grid">
              {newApps.map((app) => (
                <AppCard key={app.id} app={app} isLoggedIn={isLoggedIn} />
              ))}
            </div>

            {/* 전체 둘러보기 링크 */}
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <Link
                href="/ko/apps"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'transparent',
                  border: '1px solid var(--line)',
                  color: 'var(--ink)',
                  padding: '11px 24px',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: 'none',
                  transition: 'border-color .15s, color .15s',
                }}
                className="hover:border-[var(--brand)] hover:text-[var(--brand)]"
              >
                {td('viewAll')}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── 2. 주목받는 메이커 ───────────────────────────────────── */}
      <section id="makers" style={{ padding: '46px 0' }}>
        <div className="lp-container">
          {/* 헤더 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginBottom: 24,
              gap: 16,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 26,
                  letterSpacing: '-.6px',
                  fontWeight: 800,
                }}
              >
                🪪 {tm('title')}
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: 14.5, marginTop: 4 }}>
                {tm('subtitle')}
              </p>
            </div>
            {/* 메이커 전용 목록 페이지 없음 → 링크 숨김 */}
          </div>

          {/* 메이커 4열 그리드 */}
          {featuredMakers.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                color: 'var(--muted)',
                padding: '40px 0',
                fontSize: 15,
              }}
            >
              {t('empty.message')}
            </div>
          ) : (
            <div className="lp-makers-grid">
              {featuredMakers.map((profile) => (
                <MakerMiniCard
                  key={profile.id}
                  profile={profile}
                  apps={makerApps[profile.id] ?? []}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── 3. 채용 CTA 밴드 ─────────────────────────────────────── */}
      <RecruitCTA
        mature={
          apps.length >= RECRUIT_MATURE_MIN_APPS &&
          profiles.length >= RECRUIT_MATURE_MIN_BUILDERS
        }
      />

      {/* ── 비교 플로팅 바 ───────────────────────────────────────── */}
      <CompareBar apps={apps} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HomeWrapper — CompareProvider 래퍼
// ─────────────────────────────────────────────────────────────────────────────
export default function HomeWrapper(props: Props) {
  return (
    <CompareProvider>
      <HomeInner {...props} />
    </CompareProvider>
  );
}
