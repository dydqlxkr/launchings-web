'use server';

/**
 * 기능 요청 Server Actions.
 * - addFeatureRequest: 로그인 필수, body 길이 검증(4~200자).
 * - toggleFeatureVote: RPC toggle_feature_vote 호출.
 * - deleteFeatureRequest: 본인만 삭제.
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { rateLimitInteraction, rateLimitVote, RATE_LIMIT_ERROR } from '@/lib/rateLimit';

// ─── addFeatureRequest ─────────────────────────────────────────────────────

export type AddFeatureRequestResult =
  | { id: string; error?: undefined }
  | { error: string; id?: undefined };

export async function addFeatureRequest(
  appId: string,
  body: string
): Promise<AddFeatureRequestResult> {
  const rl = await rateLimitInteraction('addFeatureRequest');
  if (!rl.ok) return { error: RATE_LIMIT_ERROR };

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: '로그인이 필요합니다.' };
  }

  const trimmed = body.trim();
  if (trimmed.length < 4) {
    return { error: '기능 요청은 4자 이상 입력해 주세요.' };
  }
  if (trimmed.length > 200) {
    return { error: '기능 요청은 200자 이하로 입력해 주세요.' };
  }

  const { data, error } = await supabase
    .from('feature_requests')
    .insert({
      app_id: appId,
      author_id: user.id,
      body: trimmed,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('[featureRequest] addFeatureRequest error:', error?.message);
    return { error: '기능 요청 등록에 실패했습니다. 다시 시도해 주세요.' };
  }

  revalidatePath('/ko/apps/[slug]', 'page');

  return { id: data.id };
}

// ─── toggleFeatureVote ─────────────────────────────────────────────────────

export type FeatureVoteResult =
  | { voted: boolean; vote_count: number; error?: undefined }
  | { error: string; voted?: undefined; vote_count?: undefined };

export async function toggleFeatureVote(
  requestId: string
): Promise<FeatureVoteResult> {
  const rl = await rateLimitVote('toggleFeatureVote');
  if (!rl.ok) return { error: RATE_LIMIT_ERROR };

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'unauthenticated' };
  }

  const { data, error } = await supabase.rpc('toggle_feature_vote', {
    p_request_id: requestId,
  });

  if (error) {
    console.error('[featureRequest] toggleFeatureVote RPC error:', error.message);
    return { error: error.message };
  }

  const result = data as { voted: boolean; vote_count: number };

  revalidatePath('/ko/apps/[slug]', 'page');

  return { voted: result.voted, vote_count: result.vote_count };
}

// ─── deleteFeatureRequest ──────────────────────────────────────────────────

export type DeleteFeatureRequestResult = { ok: true } | { error: string };

export async function deleteFeatureRequest(
  requestId: string
): Promise<DeleteFeatureRequestResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: '로그인이 필요합니다.' };
  }

  const { error } = await supabase
    .from('feature_requests')
    .delete()
    .eq('id', requestId)
    .eq('author_id', user.id); // RLS 이중 방어

  if (error) {
    console.error('[featureRequest] deleteFeatureRequest error:', error.message);
    return { error: '삭제에 실패했습니다. 다시 시도해 주세요.' };
  }

  revalidatePath('/ko/apps/[slug]', 'page');

  return { ok: true };
}
