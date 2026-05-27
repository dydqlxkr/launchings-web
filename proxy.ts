/**
 * Next.js 16 Proxy (= 구 Middleware) — 세션 갱신(Supabase) + locale 라우팅(next-intl).
 *
 * Next.js 16에서 middleware.ts가 proxy.ts로 이름 변경됨.
 * 기능은 동일: 요청마다 실행, 쿠키/헤더 수정, 리다이렉트.
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  // 0. OAuth/recovery code가 콜백이 아닌 경로(예: Supabase Site URL 폴백으로
  //    /ko?code=...)로 도착하면 /auth/callback으로 넘겨 세션 교환을 처리한다.
  //    (Supabase Redirect URLs 허용목록 미설정 대비 안전장치)
  const reqUrl = request.nextUrl;
  const oauthCode = reqUrl.searchParams.get('code');
  if (oauthCode && !reqUrl.pathname.startsWith('/auth/callback')) {
    const cb = new URL('/auth/callback', reqUrl.origin);
    cb.searchParams.set('code', oauthCode);
    const safeNext =
      reqUrl.pathname.startsWith('/') && !reqUrl.pathname.startsWith('//')
        ? reqUrl.pathname
        : '/ko';
    cb.searchParams.set('next', safeNext);
    return NextResponse.redirect(cb);
  }

  // 1. Supabase 세션 쿠키 갱신
  //    getUser()를 호출해야 만료된 세션 토큰이 자동 갱신됨.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 세션 갱신 (중요: 반드시 호출해야 토큰 갱신)
  await supabase.auth.getUser();

  // /auth/* (OAuth·이메일확인·비밀번호재설정 콜백)은 locale 라우팅 제외.
  // next-intl이 /auth/callback을 /ko/auth/callback으로 localize하면
  // 실제 콜백 라우트(app/auth/callback)에 도달하지 못해 로그인이 실패한다.
  if (reqUrl.pathname.startsWith('/auth')) {
    return supabaseResponse;
  }

  // 2. next-intl locale 라우팅 처리
  const intlResponse = intlMiddleware(request);

  // intl이 리다이렉트를 응답한 경우 Supabase 쿠키를 복사 후 반환
  if (intlResponse.status !== 200) {
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      intlResponse.cookies.set(cookie.name, cookie.value);
    });
    return intlResponse;
  }

  // intl이 처리한 경우 (rewrite 등) — Supabase 쿠키를 병합
  const finalResponse = intlResponse;
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    finalResponse.cookies.set(cookie.name, cookie.value);
  });

  return finalResponse;
}

export const config = {
  matcher: [
    // next-intl + Supabase: _next, 정적 파일, favicon 제외
    '/((?!_next|_vercel|.*\\..*).*)',
  ],
};
