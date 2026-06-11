'use client';

/**
 * NavbarClient — 클라이언트 세션 기반 Navbar 래퍼.
 *
 * 정적 프리렌더 페이지(홈, /apps)에서 NavbarServer(cookies) 대신 사용.
 * 다른 페이지(상세·설정 등)는 NavbarServer 그대로 유지.
 *
 * 깜빡임 방지: 로딩 중에는 user=null(비로그인 상태)로 렌더하여
 * HTML 구조가 일정하게 유지된다. 세션이 로드되면 아바타/알림 뱃지만 나타남.
 */

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSession } from './useSession';
import Navbar from './Navbar';

interface NavUser {
  id: string;
  email?: string | null;
  handle?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
}

interface NavState {
  navUser: NavUser | null;
  unreadCount: number;
}

export default function NavbarClient() {
  const { user, loading } = useSession();
  const [navState, setNavState] = useState<NavState>({
    navUser: null,
    unreadCount: 0,
  });
  // 중복 요청 방지용 ref
  const fetchedForId = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // 비로그인 확정 시에는 null로 업데이트 (이전에 로그인 상태였다면 초기화)
      if (fetchedForId.current !== null) {
        fetchedForId.current = null;
        setNavState({ navUser: null, unreadCount: 0 });
      }
      return;
    }

    // 동일 유저 ID에 대해 중복 조회 방지
    if (fetchedForId.current === user.id) return;
    fetchedForId.current = user.id;

    // 세션이 확인된 후 프로필 + 미읽은 알림 수 조회
    const supabase = createClient();
    const userId = user.id;
    const userEmail = user.email ?? null;

    Promise.all([
      supabase
        .from('profiles')
        .select('handle, display_name, avatar_url')
        .eq('id', userId)
        .single(),
      supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false),
    ]).then(([profileResult, notifResult]) => {
      const profile = profileResult.data;
      setNavState({
        navUser: {
          id: userId,
          email: userEmail,
          handle: profile?.handle ?? null,
          displayName: profile?.display_name ?? null,
          avatarUrl: profile?.avatar_url ?? null,
        },
        unreadCount: notifResult.count ?? 0,
      });
    });
  }, [user, loading]);

  return (
    <Navbar user={navState.navUser} unreadNotifications={navState.unreadCount} />
  );
}
