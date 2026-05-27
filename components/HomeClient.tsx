'use client';

/**
 * 홈 페이지 클라이언트 — 탭 전환, 검색, 카테고리 필터, 정렬을
 * URL searchParams 없이 클라이언트 상태로 처리.
 * (Phase 2에서 URL 파라미터 기반으로 전환 가능)
 *
 * CompareProvider + CompareBar를 여기서 감싸고
 * AppCard가 CompareToggle을 통해 Context에 접근.
 */

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { AppWithRelations, Profile, Category } from '@/lib/types';
import AppCard from './AppCard';
import MakerCard from './MakerCard';
import { CompareProvider } from './CompareContext';
import CompareBar from './CompareBar';

type Tab = 'apps' | 'builders';
type AppSort = 'votes' | 'newest';

interface Props {
  apps: AppWithRelations[];
  profiles: Profile[];
  categories: Category[];
  // 각 빌더의 앱 목록 — 서버에서 계산해서 내려줌
  makerApps: Record<string, AppWithRelations[]>;
  isLoggedIn?: boolean;
  /** 카테고리 섹션에서 제어하는 현재 카테고리 슬러그 */
  appCat?: string;
  /** 카테고리 변경 콜백 (외부에서 제어할 때 사용) */
  onAppCatChange?: (cat: string) => void;
}

const APP_CATS_EXTRA = [
  { k: 'all', label_ko: '전체', emoji: '' },
  { k: 'webrun', label_ko: '▶ 바로 실행 가능', emoji: '' },
];

function HomeInner({
  apps,
  profiles,
  categories,
  makerApps,
  isLoggedIn = false,
  appCat: externalAppCat,
  onAppCatChange,
}: Props) {
  const t = useTranslations();

  const [tab, setTab] = useState<Tab>('apps');
  // 외부에서 제어하면 external, 아니면 내부 state
  const [internalAppCat, setInternalAppCat] = useState('all');
  const appCat = externalAppCat !== undefined ? externalAppCat : internalAppCat;
  function setAppCat(cat: string) {
    if (onAppCatChange) {
      onAppCatChange(cat);
    } else {
      setInternalAppCat(cat);
    }
  }

  const [appSort, setAppSort] = useState<AppSort>('votes');
  const [query, setQuery] = useState('');

  // ── 앱 목록 필터/정렬 ────────────────────────────────────
  const filteredApps = useMemo(() => {
    let list = [...apps];

    if (appCat === 'webrun') {
      list = list.filter((a) => a.app_type === 'webapp');
    } else if (appCat !== 'all') {
      list = list.filter((a) => a.categories.includes(appCat));
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

    if (appSort === 'votes') {
      list.sort((a, b) => b.vote_count - a.vote_count);
    } else {
      list.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return list;
  }, [apps, appCat, appSort, query]);

  // ── 빌더 목록 필터 ─────────────────────────────────────
  const filteredProfiles = useMemo(() => {
    if (!query.trim()) return profiles;
    const q = query.trim().toLowerCase();
    return profiles.filter((p) => {
      const pApps = makerApps[p.id] ?? [];
      const hay = [
        p.display_name,
        p.bio ?? '',
        ...pApps.map((a) => a.title),
        ...pApps.flatMap((a) => a.stacks ?? []),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [profiles, makerApps, query]);

  const allAppCats = [
    ...APP_CATS_EXTRA.map((c) => ({ k: c.k, label: c.label_ko })),
    ...categories.map((c) => ({ k: c.slug, label: `${c.emoji} ${c.label_ko}` })),
  ];

  return (
    <div>
      {/* ── 탭 ───────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: 14,
          padding: 6,
          margin: '30px auto 0',
          width: 'fit-content',
        }}
      >
        {(
          [
            { key: 'apps', label: `📦 ${t('tabs.apps')}` },
            { key: 'builders', label: `🛠️ ${t('tabs.builders')}` },
          ] as { key: Tab; label: string }[]
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              background:
                tab === key
                  ? 'linear-gradient(135deg,rgba(108,140,255,.28),rgba(155,108,255,.28))'
                  : 'transparent',
              border: 0,
              color: tab === key ? '#fff' : 'var(--muted)',
              fontSize: 14.5,
              fontWeight: 700,
              padding: '10px 22px',
              borderRadius: 10,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── 검색창 ───────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: 14,
          padding: 8,
          alignItems: 'center',
          marginTop: 22,
        }}
      >
        <span style={{ paddingLeft: 8, fontSize: 18 }}>🔍</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            tab === 'apps'
              ? t('search.placeholder_apps')
              : t('search.placeholder_builders')
          }
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
          onClick={() => {}}
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
          {t('search.button')}
        </button>
      </div>

      {/* ── 카테고리 칩 (앱 탭만) ─────────────────── */}
      {tab === 'apps' && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '18px 0 4px' }}>
          {allAppCats.map((c) => (
            <button
              key={c.k}
              onClick={() => setAppCat(c.k)}
              style={{
                background:
                  appCat === c.k
                    ? 'linear-gradient(135deg,rgba(108,140,255,.28),rgba(155,108,255,.28))'
                    : 'var(--chip)',
                border: `1px solid ${appCat === c.k ? 'transparent' : 'var(--line)'}`,
                color: appCat === c.k ? '#fff' : 'var(--muted)',
                fontSize: 13,
                fontWeight: 600,
                padding: '7px 14px',
                borderRadius: 999,
                cursor: 'pointer',
                transition: '.15s',
                userSelect: 'none',
                fontFamily: 'inherit',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* ── 섹션 헤더 + 정렬 ─────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '20px 0 18px',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <h2
          style={{
            fontSize: 22,
            letterSpacing: '-.5px',
            fontWeight: 800,
          }}
        >
          {tab === 'apps'
            ? query
              ? `🔍 "${query}" 제품 · ${filteredApps.length}`
              : `📦 ${t('tabs.apps')} · ${filteredApps.length}`
            : query
            ? `🔍 "${query}" 빌더 · ${filteredProfiles.length}`
            : `🛠️ ${t('tabs.builders')} · ${filteredProfiles.length}`}
        </h2>

        {/* 정렬 (앱 탭만) */}
        {tab === 'apps' && (
          <div
            style={{
              display: 'flex',
              gap: 6,
              background: 'var(--card)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              padding: 4,
            }}
          >
            {(
              [
                { k: 'votes', label: t('sort.votes') },
                { k: 'newest', label: t('sort.newest') },
              ] as { k: AppSort; label: string }[]
            ).map(({ k, label }) => (
              <button
                key={k}
                onClick={() => setAppSort(k)}
                style={{
                  background: appSort === k ? 'var(--chip)' : 'transparent',
                  border: 0,
                  color: appSort === k ? '#fff' : 'var(--muted)',
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
        )}
      </div>

      {/* ── 그리드 ───────────────────────────────── */}
      {tab === 'apps' ? (
        filteredApps.length === 0 ? (
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
        )
      ) : filteredProfiles.length === 0 ? (
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
          {filteredProfiles.map((profile) => (
            <MakerCard
              key={profile.id}
              profile={profile}
              apps={makerApps[profile.id] ?? []}
            />
          ))}
        </div>
      )}

      {/* ── 비교 플로팅 바 ────────────────────────── */}
      <CompareBar apps={apps} />
    </div>
  );
}

export default function HomeClient(props: Props) {
  return (
    <CompareProvider>
      <HomeInner {...props} />
    </CompareProvider>
  );
}
