'use client';

/**
 * 링크 복사 공유 버튼.
 * 클릭 시 현재 앱 URL을 클립보드에 복사하고 토스트 표시.
 */

import { useToast } from './Toast';

interface Props {
  slug: string;
}

export default function ShareButton({ slug }: Props) {
  const toast = useToast();

  async function handleCopy() {
    const url = `https://www.launchings.io/ko/apps/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.show('링크가 복사됐어요', 'success');
    } catch {
      // clipboard API가 차단된 경우 fallback
      try {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        toast.show('링크가 복사됐어요', 'success');
      } catch {
        toast.show('링크 복사에 실패했어요', 'error');
      }
    }
  }

  return (
    <button
      onClick={handleCopy}
      aria-label="링크 복사"
      title="링크 복사"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'var(--chip)',
        border: '1px solid var(--line)',
        borderRadius: 9,
        padding: '6px 12px',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        color: 'var(--muted)',
        fontFamily: 'inherit',
        transition: 'all .12s',
        flexShrink: 0,
      }}
    >
      <svg
        width={15}
        height={15}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
      링크 복사
    </button>
  );
}
