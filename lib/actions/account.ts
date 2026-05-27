'use server';

/**
 * 계정 관련 Server Action.
 *
 * deleteAccount():
 *   - service_role 어드민 클라이언트로 auth.admin.deleteUser() 호출.
 *   - profiles.id FK ON DELETE CASCADE 이므로 profiles + apps + reviews +
 *     feature_requests + votes 등 연관 행이 모두 cascade 삭제됨.
 *   - 삭제 후 세션을 소거하고 홈으로 리다이렉트.
 *   - SUPABASE_SERVICE_ROLE_KEY 미설정 시 graceful 에러 반환(앱 정상 동작).
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface DeleteAccountResult {
  error?: string;
}

export async function deleteAccount(): Promise<DeleteAccountResult> {
  // ── 1. 현재 로그인 사용자 확인 ─────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: '로그인이 필요합니다.' };
  }

  // ── 2. 어드민 클라이언트 확인 ──────────────────────────────────
  const admin = createAdminClient();
  if (!admin) {
    return {
      error:
        '회원 탈퇴 기능 준비 중입니다. (관리자 설정 필요 — SUPABASE_SERVICE_ROLE_KEY)',
    };
  }

  // ── 3. auth.users 삭제 → CASCADE로 연관 데이터 전부 삭제 ────────
  // profiles.id REFERENCES auth.users(id) ON DELETE CASCADE
  // apps.author_id REFERENCES profiles(id) ON DELETE CASCADE
  // votes, reviews, feature_requests 모두 CASCADE 체인으로 삭제됨.
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    console.error('[Account] deleteUser error:', deleteError.message);
    return { error: '탈퇴 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' };
  }

  // ── 4. 클라이언트 세션 소거 ─────────────────────────────────────
  // admin 삭제 후 anon 클라이언트의 로컬 세션도 정리
  await supabase.auth.signOut();

  // ── 5. 홈으로 리다이렉트 ──────────────────────────────────────
  redirect('/ko');
}
