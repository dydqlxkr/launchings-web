'use client';

/**
 * AppsPageClient — /ko/apps 페이지의 클라이언트 파트.
 * 검색 입력, 인기 앱 섹션, 카테고리별 섹션, 비교 플로팅 바를 포함.
 * CompareProvider로 감싸여 있어 업보트/비교 동작이 유지된다.
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { AppWithRelations, Category } from '@/lib/types';
import AppCard from './AppCard';
import { CompareProvider } from './CompareContext';
import CompareBar from './CompareBar';

interface Props {
  apps: AppWithRelations[];
  categories: Category[];
  isLoggedIn: boolean;
}

const POPULAR_COUNT = 8;

// ─────────────────────────────────────────────────────────────────────────────
// Inner — CompareProvider 안에서 렌더링되는 실제 UI
// ─────────────────────────────────────────────────────────────────────────────
function AppsPageInner({ apps, categories, isLoggedIn }: Props) {
  const t = useTranslations('appsPage');
  const [query, setQuery] = useState('');

  // 검색 필터 적용
  const filteredApps = useMemo(() => {
    if (!query.trim()) return apps;
    const q = query.trim().toLowerCase();
    return apps.filter((a) => {
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
  }, [apps, query]);

  // 인기 앱: vote_count 내림차순 상위 N개
  const popularApps = useMemo(
    () =>
      [...filteredApps]
        .sort((a, b) => b.vote_count - a.vote_count)
        .slice(0, POPULAR_COUNT),
    [filteredApps]
  );

  // 카테고리별 앱 그룹핑 (sort_order 순)
  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sort_order - b.sort_order),
    [categories]
  );

  const appsByCategory = useMemo(() => {
    const map: Record<string, AppWithRelations[]> = {};
    for (const cat of sortedCategories) {
      map[cat.slug] = filteredApps.filter((a) =>
        a.categories.includes(cat.slug)
      );
    }
    return map;
  }, [filteredApps, sortedCategories]);

  const isSearching = query.trim().length > 0;

  return (
    <>
      {/* ── 검색 입력 ───────────────────────────────────────────── */}
      <div className="lp-container" style={{ paddingTop: 28, paddingBottom: 0 }}>
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
            placeholder={t('searchPlaceholder')}
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
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                background: 'var(--chip)',
                border: '1px solid var(--line)',
                color: 'var(--muted)',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── 🔥 인기 앱 섹션 ─────────────────────────────────────── */}
      {popularApps.length > 0 && (
        <section style={{ paddingTop: 36 }}>
          <div className="lp-container" style={{ paddingBottom: 40 }}>
            <div style={{ marginBottom: 22 }}>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: '-.5px',
                  marginBottom: 4,
                }}
              >
                🔥 {t('popularTitle')}
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>
                {t('popularSubtitle')}
              </p>
            </div>

            <div className="lp-grid">
              {popularApps.map((app) => (
                <AppCard key={app.id} app={app} isLoggedIn={isLoggedIn} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 카테고리별 섹션 ─────────────────────────────────────── */}
      {!isSearching &&
        sortedCategories.map((cat) => {
          const catApps = appsByCategory[cat.slug] ?? [];
          return (
            <section
              key={cat.slug}
              style={{
                borderTop: '1px solid var(--line)',
                paddingTop: 36,
              }}
            >
              <div className="lp-container" style={{ paddingBottom: 40 }}>
                <div style={{ marginBottom: 22 }}>
                  <h2
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      letterSpacing: '-.4px',
                      marginBottom: 4,
                    }}
                  >
                    {cat.emoji} {cat.label_ko}
                  </h2>
                </div>

                {catApps.length === 0 ? (
                  <p
                    style={{
                      color: 'var(--muted)',
                      fontSize: 14,
                      padding: '20px 0',
                    }}
                  >
                    {t('noApps')}
                  </p>
                ) : (
                  <div className="lp-grid">
                    {catApps.map((app) => (
                      <AppCard
                        key={app.id}
                        app={app}
                        isLoggedIn={isLoggedIn}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          );
        })}

      {/* 검색 중이고 결과 없을 때 */}
      {isSearching && filteredApps.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            color: 'var(--muted)',
            padding: '60px 24px',
            fontSize: 15,
          }}
        >
          <p style={{ marginBottom: 16 }}>
            {t('searchEmpty', { query })}
          </p>
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
            {t('searchEmptyCta')}
          </Link>
        </div>
      )}

      {/* ── 비교 플로팅 바 ───────────────────────────────────────── */}
      <CompareBar apps={apps} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 외부 export — CompareProvider 래퍼
// ─────────────────────────────────────────────────────────────────────────────
export default function AppsPageClient(props: Props) {
  return (
    <CompareProvider>
      <AppsPageInner {...props} />
    </CompareProvider>
  );
}
