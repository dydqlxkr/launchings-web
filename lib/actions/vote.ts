'use server';

/**
 * 업보트 토글 Server Action.
 * RPC toggle_vote(p_app_id)를 호출해 원자적으로 INSERT/DELETE + vote_count 갱신.
 * ADR-0005: 로그인 필수, DB unique 제약으로 1표 강제.
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { rateLimitVote, RATE_LIMIT_ERROR } from '@/lib/rateLimit';

export type VoteResult =
  | { voted: boolean; vote_count: number; error?: undefined }
  | { error: string; voted?: undefined; vote_count?: undefined };

export async function toggleVote(appId: string): Promise<VoteResult> {
  const rl = await rateLimitVote('toggleVote');
  if (!rl.ok) return { error: RATE_LIMIT_ERROR };

  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'unauthenticated' };
  }

  // RPC 호출 — 0001_init.sql의 toggle_vote 함수
  const { data, error } = await supabase.rpc('toggle_vote', {
    p_app_id: appId,
  });

  if (error) {
    console.error('[Vote] toggleVote RPC error:', error.message);
    return { error: error.message };
  }

  // RPC는 { voted: boolean, vote_count: number } 반환
  const result = data as { voted: boolean; vote_count: number };

  // ISR 캐시 무효화 (앱 상세, 홈 목록)
  revalidatePath('/ko');
  revalidatePath('/ko/apps/[slug]', 'page');

  return { voted: result.voted, vote_count: result.vote_count };
}

/**
 * 현재 로그인 사용자가 특정 앱에 업보트했는지 조회.
 * userId를 넘기면 추가 getUser() 호출 없이 처리 (dedupe).
 */
export async function getVoteStatus(
  appId: string,
  userId?: string
): Promise<{ voted: boolean }> {
  const supabase = await createClient();

  let uid = userId;
  if (!uid) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    uid = user?.id;
  }

  if (!uid) return { voted: false };

  const { data, error } = await supabase
    .from('votes')
    .select('app_id')
    .eq('app_id', appId)
    .eq('user_id', uid)
    .maybeSingle();

  if (error) return { voted: false };
  return { voted: !!data };
}
