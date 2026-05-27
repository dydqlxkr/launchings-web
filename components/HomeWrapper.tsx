'use client';

/**
 * HomeWrapper — 시안(런칭스_홈페이지_시안.html)의 섹션 구조를 그대로 재현.
 *
 * 섹션 순서:
 *   1. 검색바 + 카테고리 칩 (#discover)
 *   2. 트렌딩/제품 그리드
 *   3. 어떻게 작동하나요 — 3-step (#how)
 *   4. 주목받는 메이커 — 4열 그리드 (#makers)
 *   5. 채용 CTA 밴드 (#recruit)
 *
 * 상태: 검색어(query) · 카테고리(selectedCat) · 정렬(sort) · 비교(CompareContext)
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { AppWithRelations, Profile, Category } from '@/lib/types';
import AppCard from './AppCard';
import { CompareProvider } from './CompareContext';
import CompareBar from './CompareBar';

interface Props {
  apps: AppWithRelations[];
  profiles: Profile[];
  categories: Category[];
  makerApps: Record<string, AppWithRelations[]>;
  isLoggedIn: boolean;
}

type AppSort = 'votes' | 'newest';

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

  // 아바타 이니셜·그라데이션
  const initial =
    profile.avatar_initial ?? profile.display_name.charAt(0).toUpperCase();
  const gradient =
    profile.avatar_gradient ?? 'linear-gradient(135deg,#6c8cff,#9b6cff)';

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
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          fontWeight: 800,
          color: '#fff',
          background: gradient,
          marginBottom: 12,
          flexShrink: 0,
        }}
      >
        {initial}
      </div>

      {/* 이름 */}
      <div style={{ fontWeight: 700, fontSize: 15.5, color: 'var(--ink)' }}>
        {profile.display_name}
      </div>

      {/* 역할/bio */}
      {profile.bio && (
        <div
          style={{
            color: 'var(--muted)',
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

      {/* 검증 배지 */}
      <div
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
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{t('appCount')}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>
            {voteDisplay}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{t('voteCount')}</div>
        </div>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RecruitCTA — 시안의 #recruit 밴드 (v1: 버튼은 토스트만)
// ─────────────────────────────────────────────────────────────────────────────
function RecruitCTA() {
  const t = useTranslations('recruitSection');
  const [toastVisible, setToastVisible] = useState(false);

  function handleInterest() {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3500);
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

            {/* 태그 */}
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

          {/* 비주얼 카드 */}
          <div
            style={{
              flex: '0 0 300px',
              background: 'var(--card)',
              border: '1px solid var(--line)',
              borderRadius: 16,
              padding: 18,
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
                지
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>
                  {t('visualName')}{' '}
                  <span style={{ color: 'var(--accent)', fontSize: 12 }}>✓</span>
                </div>
                <div style={{ color: 'var(--muted)', fontSize: 12.5 }}>
                  {t('visualRole')}
                </div>
              </div>
            </div>

            {/* 스탯 바 목록 */}
            {[
              { label: t('visualStat1Label'), val: t('visualStat1Val'), pct: '92%' },
              { label: t('visualStat2Label'), val: t('visualStat2Val'), pct: '88%' },
              { label: t('visualStat3Label'), val: t('visualStat3Val'), pct: '95%' },
            ].map(({ label, val, pct }) => (
              <div key={label}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    color: 'var(--muted)',
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
              onClick={handleInterest}
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
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {t('visualBtn')}
            </button>
          </div>
        </div>
      </div>

      {/* 토스트 */}
      {toastVisible && (
        <div
          style={{
            position: 'fixed',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--card2)',
            border: '1px solid var(--accent)',
            borderRadius: 12,
            padding: '12px 22px',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--accent)',
            zIndex: 100,
            boxShadow: '0 8px 32px rgba(0,0,0,.4)',
            whiteSpace: 'nowrap',
          }}
        >
          {t('ctaToast')}
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HomeInner — 핵심 클라이언트 레이아웃 (CompareContext 안에서 렌더)
// ─────────────────────────────────────────────────────────────────────────────
function HomeInner({
  apps,
  profiles,
  categories,
  makerApps,
  isLoggedIn,
}: Props) {
  const t = useTranslations();
  const td = useTranslations('discover');
  const th = useTranslations('howItWorks');
  const tm = useTranslations('makersSection');

  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [sort, setSort] = useState<AppSort>('votes');

  // 카테고리 칩 목록 (시안과 동일)
  const chips = [
    { k: 'all', label: '🔥 트렌딩' },
    { k: 'newest', label: '🆕 새로 나온' },
    ...categories.map((c) => ({ k: c.slug, label: `${c.emoji} ${c.label_ko}` })),
  ];

  // 앱 필터/정렬
  const filteredApps = useMemo(() => {
    let list = [...apps];

    if (selectedCat === 'newest') {
      // '새로 나온' 칩은 정렬만 변경
      list.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else {
      if (selectedCat !== 'all') {
        list = list.filter((a) => a.categories.includes(selectedCat));
      }
      if (sort === 'votes') {
        list.sort((a, b) => b.vote_count - a.vote_count);
      } else {
        list.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((a) => {
        const hay = [
          a.title,
          a.tagline ?? '',
          a.description,
          ...(a.stacks ?? []),
          a.author?.display_name ?? '',
        ]
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }

    return list;
  }, [apps, selectedCat, sort, query]);

  // 표시할 메이커 (최대 8명, 앱 수 기준 정렬)
  const featuredMakers = useMemo(() => {
    return [...profiles]
      .sort(
        (a, b) =>
          (makerApps[b.id] ?? []).reduce((s, x) => s + x.vote_count, 0) -
          (makerApps[a.id] ?? []).reduce((s, x) => s + x.vote_count, 0)
      )
      .slice(0, 8);
  }, [profiles, makerApps]);

  function handleChipClick(k: string) {
    if (k === 'newest') {
      setSelectedCat('newest');
      setSort('newest');
    } else {
      setSelectedCat(k);
      setSort('votes');
    }
    // 그리드 영역으로 부드럽게 스크롤
    const el = document.getElementById('trending-grid');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <>
      {/* ── 1. 검색바 + 카테고리 칩 ───────────────────────────── */}
      <section id="discover" style={{ paddingTop: 10 }}>
        <div className="lp-container" style={{ paddingBottom: 0 }}>
          {/* 검색바 */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              background: 'var(--card)',
              border: '1px solid var(--line)',
              borderRadius: 14,
              padding: 8,
              alignItems: 'center',
            }}
          >
            <span style={{ paddingLeft: 8, fontSize: 18 }}>🔍</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={td('searchPlaceholder')}
              style={{
                flex: 1,
                background: 'transparent',
                border: 0,
                outline: 0,
                color: 'var(--ink)',
                fontSize: 15,
                padding: '8px 10px',
                fontFamily: 'inherit',
              }}
            />
            <button
              style={{
                background: 'linear-gradient(135deg,var(--brand),var(--brand2))',
                color: '#fff',
                border: 0,
                borderRadius: 10,
                padding: '9px 16px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {td('searchButton')}
            </button>
          </div>

          {/* 카테고리 칩 가로 스크롤 행 */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '18px 0 8px' }}>
            {chips.map((c) => {
              const isActive = selectedCat === c.k;
              return (
                <button
                  key={c.k}
                  onClick={() => handleChipClick(c.k)}
                  style={{
                    background: isActive
                      ? 'linear-gradient(135deg,rgba(108,140,255,.25),rgba(155,108,255,.25))'
                      : 'var(--chip)',
                    border: `1px solid ${isActive ? 'transparent' : 'var(--line)'}`,
                    color: isActive ? '#fff' : 'var(--muted)',
                    fontSize: 13,
                    fontWeight: 600,
                    padding: '7px 14px',
                    borderRadius: 999,
                    cursor: 'pointer',
                    transition: '.15s',
                    fontFamily: 'inherit',
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 2. 트렌딩/제품 그리드 ────────────────────────────────── */}
      <section id="trending-grid" style={{ paddingTop: 14 }}>
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
                🔥{' '}
                {query
                  ? `"${query}" 검색 결과 · ${filteredApps.length}`
                  : td('title')}
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: 14.5, marginTop: 4 }}>
                {td('subtitle')}
              </p>
            </div>

            {/* 정렬 버튼 */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div
                style={{
                  display: 'flex',
                  gap: 0,
                  background: 'var(--card)',
                  border: '1px solid var(--line)',
                  borderRadius: 10,
                  padding: 4,
                }}
              >
                {(
                  [
                    { k: 'votes' as AppSort, label: t('sort.votes') },
                    { k: 'newest' as AppSort, label: t('sort.newest') },
                  ]
                ).map(({ k, label }) => (
                  <button
                    key={k}
                    onClick={() => setSort(k)}
                    style={{
                      background: sort === k ? 'var(--chip)' : 'transparent',
                      border: 0,
                      color: sort === k ? '#fff' : 'var(--muted)',
                      fontSize: 13,
                      fontWeight: 600,
                      padding: '6px 12px',
                      borderRadius: 7,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 앱 그리드 */}
          {filteredApps.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                color: 'var(--muted)',
                padding: '60px 0',
                fontSize: 15,
              }}
            >
              {t('empty.message')}
            </div>
          ) : (
            <div className="lp-grid">
              {filteredApps.map((app) => (
                <AppCard key={app.id} app={app} isLoggedIn={isLoggedIn} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── 3. 어떻게 작동하나요 ─────────────────────────────────── */}
      <section
        id="how"
        style={{
          background: 'var(--bg2)',
          borderTop: '1px solid var(--line)',
          borderBottom: '1px solid var(--line)',
          padding: '46px 0',
        }}
      >
        <div className="lp-container">
          {/* 헤더 — 중앙 정렬 */}
          <div
            style={{
              textAlign: 'center',
              marginBottom: 32,
            }}
          >
            <h2
              style={{
                fontSize: 26,
                letterSpacing: '-.6px',
                fontWeight: 800,
                marginBottom: 8,
              }}
            >
              {th('sectionTitle')}
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: 14.5 }}>
              {th('sectionSubtitle')}
            </p>
          </div>

          {/* 3-step 그리드 */}
          <div className="lp-steps-grid">
            {[
              {
                num: th('step1Num'),
                ic: '🔍',
                title: th('step1Title'),
                desc: th('step1Desc'),
                arrow: true,
              },
              {
                num: th('step2Num'),
                ic: '🪪',
                title: th('step2Title'),
                desc: th('step2Desc'),
                arrow: true,
              },
              {
                num: th('step3Num'),
                ic: '💼',
                title: th('step3Title'),
                desc: th('step3Desc'),
                arrow: false,
              },
            ].map((step) => (
              <div
                key={step.num}
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--line)',
                  borderRadius: 16,
                  padding: '26px 22px',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: 'var(--brand)',
                    marginBottom: 12,
                  }}
                >
                  {step.num}
                </div>
                <div style={{ fontSize: 30, marginBottom: 14 }}>{step.ic}</div>
                <h3
                  style={{
                    fontSize: 18,
                    marginBottom: 8,
                    letterSpacing: '-.3px',
                    fontWeight: 700,
                  }}
                >
                  {step.title}
                </h3>
                <p style={{ color: 'var(--muted)', fontSize: 14 }}>
                  {step.desc}
                </p>
                {step.arrow && (
                  <div
                    className="lp-step-arrow"
                    style={{
                      position: 'absolute',
                      right: -22,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--line)',
                      fontSize: 22,
                      zIndex: 2,
                    }}
                  >
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. 주목받는 메이커 ───────────────────────────────────── */}
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
            <Link
              href="/ko"
              style={{
                color: 'var(--brand)',
                fontSize: 14,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                textDecoration: 'none',
              }}
            >
              {tm('viewAll')}
            </Link>
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

      {/* ── 5. 채용 CTA 밴드 ─────────────────────────────────────── */}
      <RecruitCTA />

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
