'use server';

/**
 * 북마크 토글 Server Action.
 * bookmarks 테이블에 INSERT/DELETE 원자적으로 처리.
 * ADR: 로그인 필수, PK(user_id, app_id)로 1회 강제.
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { rateLimitVote, RATE_LIMIT_ERROR } from '@/lib/rateLimit';

export type BookmarkResult =
  | { bookmarked: boolean; error?: undefined }
  | { error: string; bookmarked?: undefined };

export async function toggleBookmark(appId: string): Promise<BookmarkResult> {
  const rl = await rateLimitVote('toggleBookmark');
  if (!rl.ok) return { error: RATE_LIMIT_ERROR };

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'unauthenticated' };
  }

  // 현재 북마크 여부 확인
  const { data: existing } = await supabase
    .from('bookmarks')
    .select('app_id')
    .eq('user_id', user.id)
    .eq('app_id', appId)
    .maybeSingle();

  if (existing) {
    // 북마크 해제
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('app_id', appId);

    if (error) {
      console.error('[Bookmark] delete error:', error.message);
      return { error: error.message };
    }

    revalidatePath('/ko/bookmarks');
    return { bookmarked: false };
  } else {
    // 북마크 추가
    const { error } = await supabase
      .from('bookmarks')
      .insert({ user_id: user.id, app_id: appId });

    if (error) {
      console.error('[Bookmark] insert error:', error.message);
      return { error: error.message };
    }

    revalidatePath('/ko/bookmarks');
    return { bookmarked: true };
  }
}

/**
 * 현재 로그인 사용자가 특정 앱을 북마크했는지 조회.
 * userId를 넘기면 추가 getUser() 호출 없이 처리 (dedupe).
 */
export async function getBookmarkStatus(
  appId: string,
  userId?: string
): Promise<{ bookmarked: boolean }> {
  const supabase = await createClient();

  let uid = userId;
  if (!uid) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    uid = user?.id;
  }

  if (!uid) return { bookmarked: false };

  const { data, error } = await supabase
    .from('bookmarks')
    .select('app_id')
    .eq('user_id', uid)
    .eq('app_id', appId)
    .maybeSingle();

  if (error) return { bookmarked: false };
  return { bookmarked: !!data };
}

/**
 * 현재 사용자가 북마크한 앱 id 집합 조회.
 */
export async function getMyBookmarkIds(): Promise<Set<string>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new Set();

  const { data, error } = await supabase
    .from('bookmarks')
    .select('app_id')
    .eq('user_id', user.id);

  if (error || !data) return new Set();
  return new Set((data as { app_id: string }[]).map((r) => r.app_id));
}
