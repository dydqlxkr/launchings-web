'use client';

/**
 * AppsPageClient — /ko/apps 페이지의 클라이언트 파트.
 * 검색 입력(디바운스 250ms + 클리어 X), 카테고리 칩 필터,
 * 정렬 토글(추천순/최신순), 비교 플로팅 바를 포함.
 * CompareProvider로 감싸여 있어 업보트/비교 동작이 유지된다.
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { AppWithRelations, Category, SortOption } from '@/lib/types';
import AppCard from './AppCard';
import { CompareProvider } from './CompareContext';
import CompareBar from './CompareBar';

interface Props {
  apps: AppWithRelations[];
  categories: Category[];
  isLoggedIn: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Inner — CompareProvider 안에서 렌더링되는 실제 UI
// ─────────────────────────────────────────────────────────────────────────────
function AppsPageInner({ apps, categories, isLoggedIn }: Props) {
  const t = useTranslations('appsPage');

  // 검색어 상태 (입력값은 즉시, 필터 적용은 디바운스)
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');

  // 카테고리 필터 ('all' = 전체)
  const [selectedCat, setSelectedCat] = useState<string>('all');

  // 정렬 옵션
  const [sort, setSort] = useState<SortOption>('votes');

  // 디바운스 타이머 ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 검색어 입력 디바운스 250ms
  function handleInput(value: string) {
    setInputValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setQuery(value);
    }, 250);
  }

  function handleClear() {
    setInputValue('');
    setQuery('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }

  // 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // 카테고리 칩 목록 (sort_order 순)
  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sort_order - b.sort_order),
    [categories]
  );

  // 필터 + 정렬 적용
  const filteredApps = useMemo(() => {
    let result = apps;

    // 검색어 필터
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter((a) => {
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

    // 카테고리 필터
    if (selectedCat !== 'all') {
      result = result.filter((a) => a.categories.includes(selectedCat));
    }

    // 정렬
    result = [...result].sort((a, b) => {
      if (sort === 'votes') return b.vote_count - a.vote_count;
      // newest: created_at 내림차순
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [apps, query, selectedCat, sort]);

  const isFiltering = query.trim().length > 0 || selectedCat !== 'all';

  // 칩 스타일 헬퍼
  function chipStyle(active: boolean): React.CSSProperties {
    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '6px 14px',
      borderRadius: 999,
      fontSize: 13,
      fontWeight: active ? 700 : 500,
      background: active ? 'var(--brand)' : 'var(--chip)',
      color: active ? '#fff' : 'var(--muted)',
      border: `1px solid ${active ? 'var(--brand)' : 'var(--line)'}`,
      cursor: 'pointer',
      whiteSpace: 'nowrap' as const,
      transition: 'all .12s',
      fontFamily: 'inherit',
    };
  }

  function sortBtnStyle(active: boolean): React.CSSProperties {
    return {
      padding: '6px 14px',
      borderRadius: 999,
      fontSize: 13,
      fontWeight: active ? 700 : 500,
      background: active ? 'var(--card2)' : 'transparent',
      color: active ? 'var(--ink)' : 'var(--muted)',
      border: `1px solid ${active ? 'var(--brand)' : 'transparent'}`,
      cursor: 'pointer',
      whiteSpace: 'nowrap' as const,
      transition: 'all .12s',
      fontFamily: 'inherit',
    };
  }

  return (
    <>
      {/* ── 검색 입력 + 클리어 버튼 ─────────────────────────────── */}
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
          <span style={{ paddingLeft: 8, display: 'flex', alignItems: 'center' }}>
            <svg
              width={18}
              height={18}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{ color: 'var(--muted)' }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            value={inputValue}
            onChange={(e) => handleInput(e.target.value)}
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
          {/* 클리어(X) 버튼 — 검색어 있을 때만 표시 */}
          {inputValue && (
            <button
              onClick={handleClear}
              aria-label="검색어 지우기"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                background: 'var(--chip)',
                border: '1px solid var(--line)',
                color: 'var(--muted)',
                borderRadius: 8,
                fontSize: 13,
                cursor: 'pointer',
                flexShrink: 0,
                fontFamily: 'inherit',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── 카테고리 칩 + 정렬 토글 ────────────────────────────── */}
      <div className="lp-container" style={{ paddingTop: 16, paddingBottom: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          {/* 카테고리 칩 행 — 모바일에서 가로 스크롤 */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              flexWrap: 'nowrap',
              flex: 1,
              paddingBottom: 4, // 스크롤바 여백
              // 스크롤바 숨기기 (WebKit)
              msOverflowStyle: 'none',
            }}
            className="hide-scrollbar"
          >
            {/* 전체 칩 */}
            <button
              onClick={() => setSelectedCat('all')}
              style={chipStyle(selectedCat === 'all')}
            >
              {t('filterAll')}
            </button>
            {/* 카테고리 칩들 */}
            {sortedCategories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setSelectedCat(cat.slug)}
                style={chipStyle(selectedCat === cat.slug)}
              >
                {cat.emoji} {cat.label_ko}
              </button>
            ))}
          </div>

          {/* 정렬 토글 */}
          <div
            style={{
              display: 'flex',
              gap: 2,
              background: 'var(--chip)',
              border: '1px solid var(--line)',
              borderRadius: 999,
              padding: '3px',
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => setSort('votes')}
              style={sortBtnStyle(sort === 'votes')}
            >
              {t('sortVotes')}
            </button>
            <button
              onClick={() => setSort('newest')}
              style={sortBtnStyle(sort === 'newest')}
            >
              {t('sortNewest')}
            </button>
          </div>
        </div>
      </div>

      {/* ── 필터 결과 그리드 ────────────────────────────────────── */}
      {filteredApps.length > 0 && (
        <section style={{ paddingTop: 28 }}>
          <div className="lp-container" style={{ paddingBottom: 40 }}>
            <div className="lp-grid">
              {filteredApps.map((app) => (
                <AppCard key={app.id} app={app} isLoggedIn={isLoggedIn} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 필터 결과 없을 때 */}
      {filteredApps.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            color: 'var(--muted)',
            padding: '60px 24px',
            fontSize: 15,
          }}
        >
          {isFiltering && query.trim() ? (
            <>
              <p style={{ marginBottom: 16 }}>
                {t('searchEmpty', { query: query.trim() })}
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
            </>
          ) : (
            <p>{t('filteredEmpty')}</p>
          )}
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
    <CompareProvider totalApps={props.apps.length}>
      <AppsPageInner {...props} />
    </CompareProvider>
  );
}
