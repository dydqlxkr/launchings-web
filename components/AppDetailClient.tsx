'use client';

/**
 * 앱 상세 페이지 클라이언트 영역.
 * - ReviewSection / FeatureRequestSection의 로그인 유도 버튼에서
 *   LoginModal을 열기 위해 클라이언트 상태(showLogin)를 관리.
 * - mount 시 조회수 1회 증가(incrementView).
 */

import { useState, useEffect } from 'react';
import LoginModal from './LoginModal';
import ReviewSection from './ReviewSection';
import FeatureRequestSection from './FeatureRequestSection';
import { incrementView } from '@/lib/actions/view';
import type { ReviewWithAuthor, ReviewStats, FeatureRequestWithAuthor } from '@/lib/types';

interface Props {
  appId: string;
  appSlug: string;
  reviews: ReviewWithAuthor[];
  stats: ReviewStats;
  myReview: ReviewWithAuthor | null;
  featureRequests: FeatureRequestWithAuthor[];
  myVotedIds: string[];
  isLoggedIn: boolean;
  userId?: string;
}

export default function AppDetailClient({
  appId,
  appSlug,
  reviews,
  stats,
  myReview,
  featureRequests,
  myVotedIds,
  isLoggedIn,
  userId,
}: Props) {
  const [showLogin, setShowLogin] = useState(false);

  // 상세 진입 시 조회수 1회 증가 (mount 시 단 1회)
  useEffect(() => {
    incrementView(appId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <ReviewSection
        appId={appId}
        appSlug={appSlug}
        reviews={reviews}
        stats={stats}
        myReview={myReview}
        isLoggedIn={isLoggedIn}
        onLoginRequest={() => setShowLogin(true)}
      />
      <FeatureRequestSection
        appId={appId}
        appSlug={appSlug}
        requests={featureRequests}
        myVotedIds={myVotedIds}
        isLoggedIn={isLoggedIn}
        userId={userId}
        onLoginRequest={() => setShowLogin(true)}
      />
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}
