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
import { validateHandle } from '@/lib/validations';

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
 *
 * handle 처리:
 * - Confirm email OFF (세션 즉시): signUp 후 profiles 테이블에 handle 업데이트.
 *   중복이면 handleConflict: true 반환 → 클라이언트가 다른 handle 재입력 유도.
 * - Confirm email ON (세션 없음): handle을 user_metadata에만 저장.
 *   이메일 인증 완료 후 DB 트리거나 /ko/settings에서 설정하도록 안내.
 */
export async function signUpWithPassword(formData: FormData) {
  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;
  const passwordConfirm = formData.get('passwordConfirm') as string;
  const handle = (formData.get('handle') as string)?.trim().toLowerCase();

  if (!email || !email.includes('@')) {
    return { error: '올바른 이메일 주소를 입력해 주세요.' };
  }
  if (!password || password.length < 6) {
    return { error: '비밀번호는 6자 이상이어야 합니다.' };
  }
  if (password !== passwordConfirm) {
    return { error: '비밀번호가 일치하지 않습니다.' };
  }

  // handle 유효성 검사 (입력된 경우)
  if (handle) {
    const handleError = validateHandle(handle);
    if (handleError) {
      return { error: handleError };
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: handle ? { handle } : undefined,
    },
  });

  if (error) {
    console.error('[Auth] signUp error:', error.message);
    if (error.message.toLowerCase().includes('already registered')) {
      return { error: '이미 가입된 이메일입니다. 로그인 탭을 이용해 주세요.' };
    }
    return { error: '회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.' };
  }

  // 이메일 확인이 활성화된 경우 session이 null
  if (!data.session) {
    // handle을 metadata에만 저장했으므로, 인증 완료 후 /ko/settings에서 설정 안내
    return { success: true, confirmSent: true, email };
  }

  // 세션 있음 — profiles 테이블에 handle 적용 (트리거가 row를 생성했을 것)
  if (handle && data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ handle })
      .eq('id', data.user.id);

    if (profileError) {
      console.error('[Auth] profile handle update error:', profileError.message, profileError.code);
      // 23505 = unique violation (handle 중복)
      if (profileError.code === '23505') {
        // 가입은 완료됐지만 handle 중복 — 클라이언트에서 재입력 유도
        return { success: true, confirmSent: false, handleConflict: true };
      }
      // 기타 오류는 무시하고 가입 성공 처리 (handle은 settings에서 나중에 설정 가능)
    }
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
 * 비밀번호 재설정 이메일 요청.
 * redirectTo: /auth/callback?next=/ko/reset → recovery 세션 교환 후 /ko/reset으로 이동.
 */
export async function requestPasswordReset(formData: FormData) {
  const email = (formData.get('email') as string)?.trim();

  if (!email || !email.includes('@')) {
    return { error: '올바른 이메일 주소를 입력해 주세요.' };
  }

  const headersList = await headers();
  const origin = headersList.get('origin') ?? '';

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/ko/reset`,
  });

  if (error) {
    console.error('[Auth] resetPasswordForEmail error:', error.message);
    return { error: '메일 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.' };
  }

  return { success: true };
}

/**
 * 로그인 세션이 있는 상태에서 새 비밀번호로 업데이트 (recovery 흐름).
 */
export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string;
  const passwordConfirm = formData.get('passwordConfirm') as string;

  if (!password || password.length < 6) {
    return { error: '비밀번호는 6자 이상이어야 합니다.' };
  }
  if (password !== passwordConfirm) {
    return { error: '비밀번호가 일치하지 않습니다.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error('[Auth] updateUser error:', error.message);
    if (error.message.toLowerCase().includes('session')) {
      return { error: '세션이 만료됐습니다. 비밀번호 찾기를 다시 시도해 주세요.' };
    }
    return { error: '비밀번호 변경에 실패했습니다. 잠시 후 다시 시도해 주세요.' };
  }

  return { success: true };
}

/**
 * 로그아웃.
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/ko');
}
