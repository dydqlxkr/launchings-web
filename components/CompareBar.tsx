'use client';

/**
 * CompareBar — 비교 바스켓 플로팅 바.
 * 2개 이상 선택 시 하단에 나타남.
 * "비교하기" 클릭 → /ko/compare?ids=id1,id2[,id3] 이동.
 */

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCompare } from './CompareContext';
import type { AppWithRelations } from '@/lib/types';

interface Props {
  apps: AppWithRelations[];
}

export default function CompareBar({ apps }: Props) {
  const t = useTranslations('compare');
  const router = useRouter();
  const { ids, clear } = useCompare();

  if (ids.length < 1) return null;

  const selectedApps = ids
    .map((id) => apps.find((a) => a.id === id))
    .filter(Boolean) as AppWithRelations[];

  function handleCompare() {
    router.push(`/ko/compare?ids=${ids.join(',')}`);
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 60,
        background: 'var(--card2)',
        border: '1px solid var(--line)',
        borderRadius: 16,
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        boxShadow: '0 8px 32px rgba(0,0,0,.5)',
        backdropFilter: 'blur(8px)',
        flexWrap: 'wrap',
        maxWidth: 'calc(100vw - 48px)',
      }}
    >
      {/* 타이틀 */}
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
        {t('barTitle')} ({ids.length}/3)
      </span>

      {/* 선택된 앱 칩 목록 */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {selectedApps.map((app) => (
          <span
            key={app.id}
            style={{
              background: 'var(--chip)',
              border: '1px solid var(--brand)',
              borderRadius: 8,
              padding: '4px 10px',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--ink)',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            {app.thumbnail_emoji} {app.title}
          </span>
        ))}
      </div>

      {/* 힌트 (3개 미만일 때) */}
      {ids.length < 3 && (
        <span style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
          {t('barHint')}
        </span>
      )}

      {/* 버튼들 */}
      <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>
        <button
          onClick={clear}
          style={{
            background: 'transparent',
            border: '1px solid var(--line)',
            color: 'var(--muted)',
            borderRadius: 9,
            padding: '7px 12px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {t('clearBtn')}
        </button>
        <button
          onClick={handleCompare}
          disabled={ids.length < 2}
          style={{
            background:
              ids.length >= 2
                ? 'linear-gradient(135deg,var(--brand),var(--brand2))'
                : 'var(--chip)',
            border: 0,
            color: ids.length >= 2 ? '#fff' : 'var(--muted)',
            borderRadius: 9,
            padding: '7px 16px',
            fontSize: 13,
            fontWeight: 700,
            cursor: ids.length >= 2 ? 'pointer' : 'not-allowed',
            whiteSpace: 'nowrap',
          }}
        >
          {t('compareBtn')} ({ids.length})
        </button>
      </div>
    </div>
  );
}
