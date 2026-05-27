'use client';

/**
 * CompareRemoveButton — 비교 페이지 컬럼 헤더의 ✕(제거) 버튼.
 * 해당 앱 id를 URL의 ids 파라미터에서 제거하고 라우팅한다.
 */

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface Props {
  appId: string;
  currentIds: string[];
}

export default function CompareRemoveButton({ appId, currentIds }: Props) {
  const t = useTranslations('compare');
  const router = useRouter();

  function handleRemove() {
    const remaining = currentIds.filter((id) => id !== appId);
    if (remaining.length === 0) {
      router.push('/ko/compare');
    } else {
      router.push(`/ko/compare?ids=${remaining.join(',')}`);
    }
  }

  return (
    <button
      onClick={handleRemove}
      aria-label={t('removeApp')}
      title={t('removeApp')}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 24,
        height: 24,
        background: 'rgba(255,255,255,.06)',
        border: '1px solid var(--line)',
        borderRadius: 6,
        color: 'var(--muted)',
        fontSize: 11,
        cursor: 'pointer',
        fontFamily: 'inherit',
        padding: 0,
        flexShrink: 0,
        marginLeft: 6,
        transition: 'background .12s, color .12s',
      }}
      className="hover:bg-[rgba(255,107,107,.15)] hover:text-[var(--red)] hover:border-[var(--red)] transition-colors"
    >
      ✕
    </button>
  );
}
