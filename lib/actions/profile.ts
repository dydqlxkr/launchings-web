'use server';

/**
 * 프로필 업데이트 Server Action.
 * RLS: 본인(id = auth.uid()) 행만 UPDATE 가능.
 * handle 유니크 위반(23505)은 친절한 에러로 변환.
 */

import { createClient } from '@/lib/supabase/server';
import { validateHandle, isSafeHttpUrl } from '@/lib/validations';

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
  const handleError = validateHandle(trimmedHandle ?? '');
  if (handleError) {
    return { error: handleError };
  }

  const trimmedBio = bio?.trim() ?? null;
  if (trimmedBio && trimmedBio.length > 500) {
    return { error: '소개는 500자 이내로 입력해 주세요.' };
  }

  const trimmedWebsite = website_url?.trim() ?? null;
  if (trimmedWebsite && trimmedWebsite.length > 200) {
    return { error: '웹사이트 URL은 200자 이내로 입력해 주세요.' };
  }
  // C-1: URL 스킴 검증 — javascript:, data: 등 위험 스킴 차단
  if (trimmedWebsite && !isSafeHttpUrl(trimmedWebsite)) {
    return { error: '웹사이트 URL은 https:// 또는 http://로 시작하는 올바른 URL이어야 합니다.' };
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
 * handle 사용 가능 여부 즉시 확인 (실시간 검증용).
 * - 형식 오류: validateHandle 결과 반환
 * - DB 조회: 동일 handle 존재 여부 (본인 제외)
 */
export async function checkHandleAvailable(
  handle: string
): Promise<{ available: boolean; reason?: string }> {
  const trimmed = handle?.trim().toLowerCase();

  // 1단계: 형식 검증
  const formatError = validateHandle(trimmed ?? '');
  if (formatError) {
    return { available: false, reason: formatError };
  }

  // 2단계: DB 중복 확인
  const supabase = await createClient();

  // 현재 로그인 사용자 조회 (본인 제외용)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from('profiles')
    .select('id')
    .eq('handle', trimmed)
    .limit(1);

  // 로그인된 경우 본인 제외
  if (user) {
    query = query.neq('id', user.id);
  }

  const { data, error } = await query;

  if (error) {
    // DB 오류 시 사용 불가로 처리 (안전한 방향)
    return { available: false, reason: '확인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' };
  }

  if (data && data.length > 0) {
    return { available: false, reason: '이미 사용 중인 아이디예요. 다른 아이디를 입력해 주세요.' };
  }

  return { available: true };
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
