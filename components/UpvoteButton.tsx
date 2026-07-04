'use client';

/**
 * 업보트 버튼 — Phase 2: Server Action(toggleVote RPC)으로 영속화.
 * - 낙관적 UI: 클릭 즉시 반영, 실패 시 롤백.
 * - 비로그인 클릭: 낙관적 변경 없이 곧장 로그인 모달 표시.
 * - initialVoted: 페이지 렌더링 시 서버에서 조회한 현재 사용자의 투표 여부.
 */

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toggleVote } from '@/lib/actions/vote';
import LoginModal from './LoginModal';

interface Props {
  appId: string;
  initialCount: number;
  initialVoted?: boolean;
  isLoggedIn?: boolean;
  /** 'chip'(기본, 카드/상세) | 'rail'(세로 피드 액션 레일 — 원형 버튼 + 하단 카운트) */
  variant?: 'chip' | 'rail';
}

export default function UpvoteButton({
  appId,
  initialCount,
  initialVoted = false,
  isLoggedIn = false,
  variant = 'chip',
}: Props) {
  const t = useTranslations('appCard');
  const [voted, setVoted] = useState(initialVoted);
  const [count, setCount] = useState(initialCount);
  const [showLogin, setShowLogin] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleVote() {
    if (!isLoggedIn) {
      // 비로그인: 낙관적 변경 없이 곧장 로그인 모달
      setShowLogin(true);
      return;
    }

    // 낙관적 UI: 함수형 업데이트로 직전 상태 기반 갱신
    setVoted((prev) => !prev);
    setCount((prev) => (voted ? prev - 1 : prev + 1));

    startTransition(async () => {
      const result = await toggleVote(appId);
      if (result.error) {
        // 롤백: 함수형 업데이트로 연속 클릭 스테일 방지
        setVoted((prev) => !prev);
        setCount((prev) => (voted ? prev + 1 : prev - 1));
      } else {
        // 서버 응답으로 정확한 값 동기화
        if (result.voted !== undefined) setVoted(result.voted);
        if (result.vote_count !== undefined) setCount(result.vote_count);
      }
    });
  }

  if (variant === 'rail') {
    return (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <button
            onClick={handleVote}
            disabled={isPending}
            aria-label={voted ? t('upvoted') : t('upvote')}
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: voted ? 'rgba(46,230,166,.18)' : 'rgba(255,255,255,.08)',
              border: `1px solid ${voted ? 'var(--accent)' : 'var(--line)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              color: 'var(--accent)',
              cursor: isPending ? 'not-allowed' : 'pointer',
              transition: 'transform .12s',
              opacity: isPending ? 0.7 : 1,
              flexShrink: 0,
            }}
            className="active:scale-90"
          >
            ▲
          </button>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{count}</span>
        </div>

        <LoginModal
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
          reason="upvote"
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleVote}
        disabled={isPending}
        aria-label={voted ? t('upvoted') : t('upvote')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          background: voted ? 'rgba(46,230,166,.14)' : 'var(--chip)',
          border: `1px solid ${voted ? 'var(--accent)' : 'var(--line)'}`,
          borderRadius: 9,
          padding: '6px 11px',
          fontSize: 13,
          fontWeight: 700,
          cursor: isPending ? 'not-allowed' : 'pointer',
          transition: 'all .12s',
          color: voted ? 'var(--accent)' : 'var(--ink)',
          fontFamily: 'inherit',
          opacity: isPending ? 0.7 : 1,
        }}
      >
        <span style={{ color: 'var(--accent)' }}>▲</span>
        <span>{count}</span>
      </button>

      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        reason="upvote"
      />
    </>
  );
}
