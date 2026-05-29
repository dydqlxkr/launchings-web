'use client';

/**
 * 업보트 버튼 — Phase 2: Server Action(toggleVote RPC)으로 영속화.
 * - 낙관적 UI: 클릭 즉시 반영, 실패 시 롤백.
 * - 비로그인 클릭: 즉시 추천 피드백(낙관적, 세션 한정)을 주고 로그인 유도(첫 인터랙션 비차단, P2-7).
 *   로그인 없이 모달을 닫으면 저장되지 않았으므로 피드백을 되돌린다(가짜 카운트 방지).
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
}

export default function UpvoteButton({
  appId,
  initialCount,
  initialVoted = false,
  isLoggedIn = false,
}: Props) {
  const t = useTranslations('appCard');
  const [voted, setVoted] = useState(initialVoted);
  const [count, setCount] = useState(initialCount);
  const [showLogin, setShowLogin] = useState(false);
  const [isPending, startTransition] = useTransition();
  // 게스트가 낙관적으로 +1 했는지 추적 — 로그인 없이 모달을 닫으면 되돌린다.
  const [guestBumped, setGuestBumped] = useState(false);

  function handleVote() {
    if (!isLoggedIn) {
      // 첫 인터랙션 비차단: 즉시 추천 피드백을 보여준 뒤 로그인을 유도한다.
      if (!guestBumped) {
        setVoted(true);
        setCount((prev) => prev + 1);
        setGuestBumped(true);
      }
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
        onClose={() => {
          setShowLogin(false);
          // 로그인하지 않고 닫으면 저장되지 않았으므로 게스트 피드백을 되돌린다.
          if (!isLoggedIn && guestBumped) {
            setVoted(false);
            setCount((prev) => prev - 1);
            setGuestBumped(false);
          }
        }}
      />
    </>
  );
}
