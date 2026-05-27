'use client';

/**
 * 팔로우/팔로잉 토글 버튼 (메이커 프로필 페이지용).
 * - 비로그인 시 로그인 모달 유도
 * - 본인 프로필에서는 렌더링 안 함 (부모에서 조건부 렌더)
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toggleFollow } from '@/lib/actions/follow';
import { useToast } from '@/components/Toast';
import LoginModal from '@/components/LoginModal';

interface Props {
  makerId: string;
  isLoggedIn: boolean;
  initialFollowing: boolean;
  initialFollowerCount: number;
}

export default function FollowButton({
  makerId,
  isLoggedIn,
  initialFollowing,
  initialFollowerCount,
}: Props) {
  const t = useTranslations('follow');
  const toast = useToast();

  const [following, setFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  async function handleClick() {
    if (!isLoggedIn) {
      setShowLogin(true);
      return;
    }

    setLoading(true);
    try {
      const result = await toggleFollow(makerId);
      if (result.error) {
        if (result.error !== 'unauthenticated' && result.error !== 'cannot_follow_self') {
          toast.show(t('toggleError'), 'error');
        } else if (result.error === 'unauthenticated') {
          setShowLogin(true);
        }
      } else if (result.following !== undefined && result.follower_count !== undefined) {
        setFollowing(result.following);
        setFollowerCount(result.follower_count);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={handleClick}
          disabled={loading}
          style={{
            padding: '7px 18px',
            borderRadius: 20,
            border: following ? '1px solid var(--line)' : '1px solid var(--brand)',
            background: following ? 'transparent' : 'linear-gradient(135deg,var(--brand),var(--brand2))',
            color: following ? 'var(--muted)' : '#fff',
            fontSize: 13,
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'all .15s',
            fontFamily: 'inherit',
            flexShrink: 0,
          }}
        >
          {following ? t('following') : t('follow')}
        </button>

        <span
          style={{
            fontSize: 13,
            color: 'var(--muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            whiteSpace: 'nowrap',
          }}
        >
          <strong style={{ color: 'var(--ink)', fontWeight: 700 }}>{followerCount}</strong>
          {' '}{t('followers')}
        </span>
      </div>

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}
