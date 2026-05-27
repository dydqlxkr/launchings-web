/**
 * Supabase Auth 콜백 라우트.
 * 이메일 매직링크(OTP) 및 향후 OAuth(Google 등) 콜백 처리.
 *
 * 흐름:
 * 1. Supabase가 이 URL로 리다이렉트 (code 또는 token_hash 파라미터 포함)
 * 2. code를 세션으로 교환
 * 3. 앱 내부 페이지로 리다이렉트
 *
 * 향후 Google OAuth 추가 시: Supabase 대시보드에서
 * Authentication > Providers > Google을 활성화하고
 * Client ID/Secret을 등록하면 이 콜백 라우트가 그대로 동작함.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  // 로그인 후 돌아갈 페이지 (기본값: 홈)
  const next = searchParams.get('next') ?? '/ko';

  const redirectTo = `${origin}${next}`;

  if (code) {
    // OAuth 흐름 (Google 등) — Authorization Code Exchange
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(redirectTo);
    }
  }

  if (token_hash && type) {
    // 이메일 매직링크(OTP) 흐름
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'email' | 'signup' | 'recovery' | 'invite' | 'email_change',
    });
    if (!error) {
      return NextResponse.redirect(redirectTo);
    }
  }

  // 오류 발생 시 홈으로
  return NextResponse.redirect(`${origin}/ko?auth_error=true`);
}
