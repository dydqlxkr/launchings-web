'use server';

/**
 * 프로필 업데이트 Server Action.
 * RLS: 본인(id = auth.uid()) 행만 UPDATE 가능.
 * handle 유니크 위반(23505)은 친절한 에러로 변환.
 */

import { createClient } from '@/lib/supabase/server';

/** handle 허용 규칙: 소문자 영문·숫자·하이픈·언더스코어, 3~20자 */
const HANDLE_RE = /^[a-z0-9_-]{3,20}$/;

/** 예약어 목록 (라우트 충돌 방지) */
const RESERVED_HANDLES = new Set([
  'admin',
  'api',
  'auth',
  'settings',
  'submit',
  'compare',
  'apps',
  'makers',
  'privacy',
  'terms',
  'ko',
  'en',
  'support',
  'help',
  'about',
]);

export interface UpdateProfileInput {
  display_name: string;
  handle: string;
  bio?: string;
  website_url?: string;
}

export interface UpdateProfileResult {
  success?: true;
  error?: string;
}

export async function updateProfile(
  input: UpdateProfileInput
): Promise<UpdateProfileResult> {
  const { display_name, handle, bio, website_url } = input;

  // ── 입력 검증 ──────────────────────────────────────────────
  const trimmedName = display_name?.trim();
  if (!trimmedName) {
    return { error: '이름을 입력해 주세요.' };
  }
  if (trimmedName.length > 60) {
    return { error: '이름은 60자 이내로 입력해 주세요.' };
  }

  const trimmedHandle = handle?.trim().toLowerCase();
  if (!trimmedHandle) {
    return { error: '사용자 ID를 입력해 주세요.' };
  }
  if (!HANDLE_RE.test(trimmedHandle)) {
    return {
      error:
        '사용자 ID는 소문자 영문, 숫자, 하이픈(-), 언더스코어(_)만 사용 가능하며 3~20자여야 합니다.',
    };
  }
  if (RESERVED_HANDLES.has(trimmedHandle)) {
    return { error: '사용할 수 없는 ID입니다. 다른 ID를 입력해 주세요.' };
  }

  const trimmedBio = bio?.trim() ?? null;
  if (trimmedBio && trimmedBio.length > 500) {
    return { error: '소개는 500자 이내로 입력해 주세요.' };
  }

  const trimmedWebsite = website_url?.trim() ?? null;
  if (trimmedWebsite && trimmedWebsite.length > 200) {
    return { error: '웹사이트 URL은 200자 이내로 입력해 주세요.' };
  }

  // ── 인증 확인 ──────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: '로그인이 필요합니다.' };
  }

  // ── DB 업데이트 ────────────────────────────────────────────
  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: trimmedName,
      handle: trimmedHandle,
      bio: trimmedBio,
      website_url: trimmedWebsite,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    console.error('[Profile] updateProfile error:', error.message, error.code);

    // 유니크 위반 (handle 중복)
    if (error.code === '23505') {
      return { error: '이미 사용 중인 사용자 ID예요. 다른 ID를 입력해 주세요.' };
    }

    return { error: '저장에 실패했습니다. 잠시 후 다시 시도해 주세요.' };
  }

  return { success: true };
}

/**
 * 현재 로그인 사용자의 프로필 조회.
 */
export async function getMyProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !data) return null;
  return data as {
    id: string;
    handle: string;
    display_name: string;
    bio: string | null;
    website_url: string | null;
    avatar_url: string | null;
  };
}
