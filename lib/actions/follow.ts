'use server';

/**
 * 팔로우 토글 Server Action.
 * follows 테이블에 INSERT/DELETE 원자적으로 처리.
 * 로그인 필수, follower_id = auth.uid() RLS 강제.
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { rateLimitVote, RATE_LIMIT_ERROR } from '@/lib/rateLimit';

export type FollowResult =
  | { following: boolean; follower_count: number; error?: undefined }
  | { error: string; following?: undefined; follower_count?: undefined };

export async function toggleFollow(makerId: string): Promise<FollowResult> {
  const rl = await rateLimitVote('toggleFollow');
  if (!rl.ok) return { error: RATE_LIMIT_ERROR };

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'unauthenticated' };
  }

  // 자기 자신 팔로우 방지 (DB CHECK로도 막히지만 명시적으로)
  if (user.id === makerId) {
    return { error: 'cannot_follow_self' };
  }

  // 현재 팔로우 여부 확인
  const { data: existing } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', makerId)
    .maybeSingle();

  if (existing) {
    // 팔로우 취소
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', makerId);

    if (error) {
      console.error('[Follow] delete error:', error.message);
      return { error: error.message };
    }
  } else {
    // 팔로우 추가
    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: user.id, following_id: makerId });

    if (error) {
      console.error('[Follow] insert error:', error.message);
      return { error: error.message };
    }
  }

  // 팔로워 수 재조회
  const { count } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', makerId);

  const follower_count = count ?? 0;

  // 메이커 프로필 페이지 캐시 무효화
  revalidatePath(`/ko/makers`);

  return { following: !existing, follower_count };
}
