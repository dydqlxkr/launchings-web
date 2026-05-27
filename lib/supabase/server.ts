/**
 * 서버용 Supabase 클라이언트 (RSC / Server Action / Route Handler).
 * @supabase/ssr의 createServerClient를 사용해 Next.js 쿠키와 통합.
 *
 * 시크릿: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (.env.local)
 * service_role 키는 여기서 사용하지 않는다 — 클라이언트는 항상 anon key + 사용자 JWT.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component에서 호출 시 쿠키 쓰기 불가 — 미들웨어가 세션 갱신 담당
          }
        },
      },
    }
  );
}
