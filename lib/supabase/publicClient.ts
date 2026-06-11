/**
 * 쿠키 없는 공개 Supabase 클라이언트.
 *
 * 'use cache' 스코프 안에서는 cookies()를 읽으면 캐시가 깨지거나 에러가 발생한다.
 * 비개인화 읽기(앱 목록·상세·리뷰·카테고리 등)는 anon key + RLS 만으로도 동작하므로
 * 이 모듈 스코프 클라이언트를 캐시 함수 전용으로 사용한다.
 *
 * auth.persistSession / autoRefreshToken false → 세션 상태 불필요, 메모리 낭비 방지.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// 모듈 스코프 싱글턴 — 서버 번들이 로드될 때 한 번 생성된다.
// 환경변수는 빌드 타임에 포함되며 NEXT_PUBLIC_ prefix라 클라이언트에 노출돼도 무방.
export const publicSupabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
