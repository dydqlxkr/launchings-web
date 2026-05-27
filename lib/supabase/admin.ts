/**
 * 서버 전용 Supabase 어드민 클라이언트.
 * service_role 키를 사용해 auth.admin.* API(사용자 삭제 등)에 접근한다.
 *
 * ⚠️ 절대 클라이언트 컴포넌트 / NEXT_PUBLIC 변수에 노출 금지.
 * ⚠️ 이 파일은 server-only 빌드 경계 안에서만 import 가능.
 *
 * 환경변수:
 *   SUPABASE_SERVICE_ROLE_KEY — Supabase Dashboard > Settings > API >
 *                               service_role (secret) 의 값.
 *   NEXT_PUBLIC_SUPABASE_URL  — 동일 프로젝트 URL.
 */

import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * 어드민 클라이언트를 반환한다.
 * SERVICE_ROLE_KEY 가 설정되지 않으면 null 을 반환해 graceful 처리를 가능하게 한다.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
