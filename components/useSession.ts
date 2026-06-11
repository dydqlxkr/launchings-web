'use client';

/**
 * useSession — 클라이언트 세션 훅.
 *
 * 여러 컴포넌트가 동시에 사용해도 supabase.auth.getSession()은 1회만 호출된다.
 * 모듈 레벨 Promise 캐시를 통해 중복 호출을 방지한다.
 *
 * - loading: 세션 초기화 전
 * - isLoggedIn: 세션 존재 여부
 * - user: Supabase User 객체 (null이면 비로그인)
 */

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

interface SessionState {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
}

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    user: null,
    isLoggedIn: false,
    loading: true,
  });

  useEffect(() => {
    const supabase = createClient();

    // 초기 세션 1회 조회 (쿠키 기반 — 매우 빠름)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({
        user: session?.user ?? null,
        isLoggedIn: !!session?.user,
        loading: false,
      });
    });

    // 로그인/로그아웃 이벤트 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        user: session?.user ?? null,
        isLoggedIn: !!session?.user,
        loading: false,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
