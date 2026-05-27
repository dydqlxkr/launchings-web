'use client';

/**
 * CompareToggle — 앱 카드의 "비교 담기" 체크박스 버튼.
 * CompareContext에 연결.
 */

import { useTranslations } from 'next-intl';
import { useCompare } from './CompareContext';

interface Props {
  appId: string;
}

export default function CompareToggle({ appId }: Props) {
  const t = useTranslations('appCard');
  const { toggle, isSelected, isFull } = useCompare();

  const selected = isSelected(appId);
  const disabled = !selected && isFull;

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(appId);
      }}
      aria-label={selected ? t('removeCompare') : t('addCompare')}
      title={disabled ? '최대 3개까지 비교할 수 있어요.' : selected ? t('removeCompare') : t('addCompare')}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        background: selected ? 'rgba(108,140,255,.18)' : 'var(--chip)',
        border: `1px solid ${selected ? 'var(--brand)' : 'var(--line)'}`,
        borderRadius: 8,
        padding: '4px 9px',
        fontSize: 11,
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all .12s',
        color: selected ? 'var(--brand)' : disabled ? 'var(--muted)' : 'var(--muted)',
        opacity: disabled ? 0.5 : 1,
        fontFamily: 'inherit',
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 10 }}>{selected ? '✓' : '+'}</span>
      {selected ? t('removeCompare') : t('addCompare')}
    </button>
  );
}
