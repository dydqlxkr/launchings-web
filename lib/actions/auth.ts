'use server';

/**
 * 인증 관련 Server Action.
 * - 이메일/비밀번호 회원가입/로그인 (signUp / signInWithPassword)
 * - 구글 OAuth (signInWithOAuth) — Supabase 대시보드 Google Provider 활성화 필요
 * - 로그아웃
 *
 * 매직링크(OTP)는 제거됨.
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

/**
 * 이메일/비밀번호 로그인.
 */
export async function signInWithPassword(formData: FormData) {
  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;

  if (!email || !email.includes('@')) {
    return { error: '올바른 이메일 주소를 입력해 주세요.' };
  }
  if (!password || password.length < 6) {
    return { error: '비밀번호는 6자 이상이어야 합니다.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error('[Auth] signInWithPassword error:', error.message);
    if (error.message.toLowerCase().includes('invalid login')) {
      return { error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
    }
    return { error: '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.' };
  }

  return { success: true };
}

/**
 * 이메일/비밀번호 회원가입.
 * 가입 즉시 로그인됨 (Supabase 기본 동작 — 이메일 확인 비활성화 시).
 * 이메일 확인이 활성화된 경우 confirmSent: true 반환.
 */
export async function signUpWithPassword(formData: FormData) {
  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;
  const passwordConfirm = formData.get('passwordConfirm') as string;

  if (!email || !email.includes('@')) {
    return { error: '올바른 이메일 주소를 입력해 주세요.' };
  }
  if (!password || password.length < 6) {
    return { error: '비밀번호는 6자 이상이어야 합니다.' };
  }
  if (password !== passwordConfirm) {
    return { error: '비밀번호가 일치하지 않습니다.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    console.error('[Auth] signUp error:', error.message);
    if (error.message.toLowerCase().includes('already registered')) {
      return { error: '이미 가입된 이메일입니다. 로그인 탭을 이용해 주세요.' };
    }
    return { error: '회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.' };
  }

  // 이메일 확인이 활성화된 경우 session이 null
  if (!data.session) {
    return { success: true, confirmSent: true, email };
  }

  return { success: true, confirmSent: false };
}

/**
 * 구글 OAuth 로그인.
 * 클라이언트에서 signInWithOAuth를 직접 호출하므로 이 action은 redirectUrl만 반환.
 * 실제 OAuth 시작은 LoginModal 클라이언트 컴포넌트에서 처리.
 */
export async function getOAuthRedirectUrl() {
  const headersList = await headers();
  const origin = headersList.get('origin') ?? '';
  return { redirectTo: `${origin}/auth/callback` };
}

/**
 * 로그아웃.
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/ko');
}
