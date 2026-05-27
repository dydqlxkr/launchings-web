'use client';

/**
 * CompareBar — 비교 바스켓 플로팅 바.
 * 1개 이상 선택 시 하단에 나타남.
 * "비교하기" 클릭 → /ko/compare?ids=id1,id2[,id3] 이동.
 * 1개만 담겼을 때 "1개 더 담으면 비교할 수 있어요" 안내 표시.
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
  const { ids, clear, remove } = useCompare();

  if (ids.length < 1) return null;

  const selectedApps = ids
    .map((id) => apps.find((a) => a.id === id))
    .filter(Boolean) as AppWithRelations[];

  const canCompare = ids.length >= 2;

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

      {/* 선택된 앱 칩 목록 — 각 칩에 제거 버튼 */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {selectedApps.map((app) => (
          <span
            key={app.id}
            style={{
              background: 'var(--chip)',
              border: '1px solid var(--brand)',
              borderRadius: 8,
              padding: '4px 6px 4px 10px',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--ink)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {app.thumbnail_emoji} {app.title}
            <button
              onClick={() => remove(app.id)}
              aria-label={`${app.title} 비교에서 제거`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 18,
                height: 18,
                background: 'rgba(255,255,255,.08)',
                border: 'none',
                borderRadius: 4,
                color: 'var(--muted)',
                fontSize: 10,
                cursor: 'pointer',
                fontFamily: 'inherit',
                padding: 0,
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </span>
        ))}
      </div>

      {/* 힌트: 1개만 담겼을 때 "1개 더 담으면 비교할 수 있어요" */}
      {ids.length === 1 && (
        <span style={{ fontSize: 11, color: 'var(--accent)', whiteSpace: 'nowrap', fontWeight: 600 }}>
          {t('barHintOne')}
        </span>
      )}
      {/* 힌트: 2개 이상이고 3개 미만일 때 일반 힌트 */}
      {ids.length >= 2 && ids.length < 3 && (
        <span style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
          {t('barHint')}
        </span>
      )}

      {/* 버튼들 */}
      <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexShrink: 0, flexDirection: 'column', alignItems: 'flex-end' }}>
        {/* 비교 불가 사유 안내 */}
        {!canCompare && (
          <span style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'right', lineHeight: 1.3 }}>
            {t('compareBtnDisabledHint')}
          </span>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
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
            disabled={!canCompare}
            title={!canCompare ? t('compareBtnDisabledHint') : undefined}
            style={{
              background: canCompare
                ? 'linear-gradient(135deg,var(--brand),var(--brand2))'
                : 'var(--chip)',
              border: 0,
              color: canCompare ? '#fff' : 'var(--muted)',
              borderRadius: 9,
              padding: '7px 16px',
              fontSize: 13,
              fontWeight: 700,
              cursor: canCompare ? 'pointer' : 'not-allowed',
              whiteSpace: 'nowrap',
            }}
          >
            {t('compareBtn')} ({ids.length})
          </button>
        </div>
      </div>
    </div>
  );
}
