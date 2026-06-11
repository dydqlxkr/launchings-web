'use client';

/**
 * CompareToggle — 앱 카드의 "비교 담기" 버튼.
 * 아이콘 중심의 소형 버튼으로 시각 비중을 낮춰 업보트/실행 동선과 경쟁을 줄인다.
 * 터치영역은 최소 36px 확보.
 */

import { useTranslations } from 'next-intl';
import { useCompare } from './CompareContext';

interface Props {
  appId: string;
}

export default function CompareToggle({ appId }: Props) {
  const t = useTranslations('appCard');
  const { toggle, isSelected, isFull, showCompare } = useCompare();

  const selected = isSelected(appId);
  const disabled = !selected && isFull;

  // 앱 수 임계치 미만 — 콜드스타트에서 비교 UI 숨김
  if (!showCompare) return null;

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(appId);
      }}
      aria-label={selected ? t('removeCompare') : t('addCompare')}
      title={
        disabled
          ? '최대 3개까지 비교할 수 있어요.'
          : selected
          ? t('removeCompare')
          : t('addCompare')
      }
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        minWidth: 36,
        background: selected ? 'rgba(108,140,255,.15)' : 'transparent',
        border: `1px solid ${selected ? 'var(--brand)' : 'var(--line)'}`,
        borderRadius: 8,
        fontSize: 14,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all .12s',
        color: selected ? 'var(--brand)' : disabled ? 'var(--muted)' : 'var(--muted)',
        opacity: disabled ? 0.4 : 1,
        fontFamily: 'inherit',
        flexShrink: 0,
      }}
    >
      {/* ⇄ 아이콘으로 비교 기능을 나타냄 */}
      {selected ? '✓' : '⇄'}
    </button>
  );
}
