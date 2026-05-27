/**
 * 브라우저용 Supabase 클라이언트 (Client Component 전용).
 * anon key만 사용 — RLS가 행 단위로 보호.
 * service_role 키는 절대 이 파일에 포함하지 않는다.
 */

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
