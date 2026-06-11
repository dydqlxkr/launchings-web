'use client';

/**
 * 북마크 버튼 — 낙관적 토글.
 * - 비로그인 시 LoginModal 유도.
 * - AppCard / 앱 상세 양쪽 사용 가능.
 * - 토글 성공 시 토스트 피드백 표시.
 */

import { useState, useTransition } from 'react';
import { toggleBookmark } from '@/lib/actions/bookmark';
import LoginModal from './LoginModal';
import { useToast } from './Toast';

interface Props {
  appId: string;
  initialBookmarked?: boolean;
  isLoggedIn?: boolean;
  /** 상세 페이지에서 LoginModal 대신 부모 핸들러를 사용할 때 */
  onLoginRequest?: () => void;
  /** 버튼 크기 변형 */
  size?: 'sm' | 'md';
}

export default function BookmarkButton({
  appId,
  initialBookmarked = false,
  isLoggedIn = false,
  onLoginRequest,
  size = 'md',
}: Props) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [showLogin, setShowLogin] = useState(false);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  function handleBookmark() {
    if (!isLoggedIn) {
      if (onLoginRequest) {
        onLoginRequest();
      } else {
        setShowLogin(true);
      }
      return;
    }

    // 낙관적 UI
    const nextBookmarked = !bookmarked;
    setBookmarked(nextBookmarked);

    startTransition(async () => {
      const result = await toggleBookmark(appId);
      if (result.error) {
        // 롤백
        setBookmarked((prev) => !prev);
        toast.show('잠시 후 다시 시도해 주세요', 'error');
      } else {
        const finalBookmarked = result.bookmarked !== undefined ? result.bookmarked : nextBookmarked;
        setBookmarked(finalBookmarked);
        if (finalBookmarked) {
          toast.show('북마크에 저장했어요', 'success');
        } else {
          toast.show('북마크에서 제거했어요', 'info');
        }
      }
    });
  }

  const iconSize = size === 'sm' ? 14 : 16;
  const padding = size === 'sm' ? '5px 9px' : '6px 11px';
  const fontSize = size === 'sm' ? 12 : 13;

  return (
    <>
      <button
        onClick={handleBookmark}
        disabled={isPending}
        aria-label={bookmarked ? '북마크 해제' : '북마크 저장'}
        title={bookmarked ? '북마크 해제' : '북마크 저장'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: bookmarked ? 'rgba(108,140,255,.14)' : 'var(--chip)',
          border: `1px solid ${bookmarked ? 'var(--brand)' : 'var(--line)'}`,
          borderRadius: 9,
          padding,
          fontSize,
          fontWeight: 600,
          cursor: isPending ? 'not-allowed' : 'pointer',
          transition: 'all .12s',
          color: bookmarked ? 'var(--brand)' : 'var(--muted)',
          fontFamily: 'inherit',
          opacity: isPending ? 0.7 : 1,
          flexShrink: 0,
        }}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill={bookmarked ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {!onLoginRequest && (
        <LoginModal
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
          reason="bookmark"
        />
      )}
    </>
  );
}
