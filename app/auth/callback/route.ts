/**
 * Supabase Auth 콜백 라우트.
 * 비밀번호 재설정, 이메일 확인(OTP) 및 OAuth(Google 등) 콜백을 처리한다.
 *
 * 흐름:
 * 1. Supabase가 이 URL로 리다이렉트 (code 또는 token_hash + type 파라미터 포함)
 * 2. code → OAuth Authorization Code Exchange, token_hash → OTP verifyOtp
 * 3. `next` 파라미터(내부 경로만 허용)로 리다이렉트. 위반 시 기본값 /ko.
 *
 * Google OAuth 추가 시: Supabase 대시보드 Authentication > Providers > Google에서
 * Client ID/Secret을 등록하면 이 콜백 라우트가 그대로 동작한다.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');

  // M-4: `next`는 단일 슬래시로 시작하는 내부 경로만 허용.
  // `//`, `/\` 로 시작하거나 외부 URL은 open-redirect 공격 경로이므로 기본값으로 대체.
  const rawNext = searchParams.get('next') ?? '';
  const SAFE_NEXT_RE = /^\/[^/\\]/;
  const next = SAFE_NEXT_RE.test(rawNext) ? rawNext : '/ko';

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
