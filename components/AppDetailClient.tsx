'use client';

/**
 * 앱 상세 페이지 클라이언트 영역.
 * ReviewSection의 "로그인하고 리뷰 쓰기" 버튼에서 LoginModal을 열기 위해
 * 클라이언트 상태(showLogin)를 관리.
 */

import { useState } from 'react';
import LoginModal from './LoginModal';
import ReviewSection from './ReviewSection';
import type { ReviewWithAuthor, ReviewStats } from '@/lib/types';

interface Props {
  appId: string;
  appSlug: string;
  reviews: ReviewWithAuthor[];
  stats: ReviewStats;
  myReview: ReviewWithAuthor | null;
  isLoggedIn: boolean;
}

export default function AppDetailClient({
  appId,
  appSlug,
  reviews,
  stats,
  myReview,
  isLoggedIn,
}: Props) {
  const [showLogin, setShowLogin] = useState(false);

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
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}
