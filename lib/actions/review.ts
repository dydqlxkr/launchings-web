'use server';

/**
 * 리뷰 관련 Server Action.
 * - getAppReviews: 리뷰 목록 + 통계 + (로그인 시) 내 리뷰 조회 — 클라이언트에서 호출(피드 리뷰 패널)
 * - submitReview: 리뷰 작성/수정 (upsert)
 * - deleteReview: 리뷰 삭제
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/repo/supabase';
import { getRepo } from '@/lib/repo';
import { rateLimitInteraction, RATE_LIMIT_ERROR } from '@/lib/rateLimit';
import type { ReviewWithAuthor, ReviewStats } from '@/lib/types';

export interface ReviewActionResult {
  error?: string;
  success?: boolean;
}

export interface AppReviewsResult {
  reviews: ReviewWithAuthor[];
  stats: ReviewStats;
  myReview: ReviewWithAuthor | null;
  error?: string;
}

/**
 * 리뷰 목록 + 통계 + 내 리뷰 조회.
 * repo.listReviews/getReviewStats는 unstable_cache로 캐시되므로 비개인화 부분은 저비용.
 * 개인화(myReview)는 getUser() 성공 시에만 조회 — 실패해도 목록은 정상 반환.
 */
export async function getAppReviews(appId: string): Promise<AppReviewsResult> {
  const repo = getRepo();

  let userId: string | undefined;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  } catch (error) {
    console.error('[Review] getAppReviews getUser error:', error);
  }

  try {
    const [reviews, stats, myReview] = await Promise.all([
      repo.listReviews(appId),
      repo.getReviewStats(appId),
      userId ? repo.getMyReview(appId, userId) : Promise.resolve(null),
    ]);
    return { reviews, stats, myReview };
  } catch (error) {
    console.error('[Review] getAppReviews error:', error);
    return {
      reviews: [],
      stats: { avg_rating: 0, review_count: 0 },
      myReview: null,
      error: '리뷰를 불러오지 못했습니다.',
    };
  }
}

/**
 * 리뷰 작성 또는 수정 (upsert).
 * 유저당 앱당 1개 — DB unique 제약으로 보장.
 */
export async function submitReview(formData: FormData): Promise<ReviewActionResult> {
  const rl = await rateLimitInteraction('submitReview');
  if (!rl.ok) return { error: RATE_LIMIT_ERROR };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: '로그인이 필요합니다.' };
  }

  const app_id = formData.get('app_id') as string;
  const app_slug = formData.get('app_slug') as string;
  const ratingStr = formData.get('rating') as string;
  const body = (formData.get('body') as string)?.trim();

  if (!app_id) return { error: '앱 정보가 올바르지 않습니다.' };

  const rating = parseInt(ratingStr, 10);
  if (isNaN(rating) || rating < 1 || rating > 5) {
    return { error: '별점은 1~5 사이여야 합니다.' };
  }
  if (!body || body.length < 1) {
    return { error: '리뷰 내용을 입력해 주세요.' };
  }
  if (body.length > 1000) {
    return { error: '리뷰는 1000자 이내로 작성해 주세요.' };
  }

  const { error } = await supabase
    .from('reviews')
    .upsert(
      {
        app_id,
        author_id: user.id,
        rating,
        body,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'app_id,author_id' }
    );

  if (error) {
    console.error('[Review] submitReview error:', error.message);
    return { error: '리뷰 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.' };
  }

  // 캐시 무효화 — 리뷰 목록 + 앱 상세(평점 표시)
  revalidateTag(CACHE_TAGS.apps, { expire: 0 });
  if (app_slug) {
    revalidatePath(`/ko/apps/${app_slug}`);
  }
  return { success: true };
}

/**
 * 리뷰 삭제.
 */
export async function deleteReview(
  reviewId: string,
  appSlug: string
): Promise<ReviewActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: '로그인이 필요합니다.' };
  }

  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId)
    .eq('author_id', user.id);

  if (error) {
    console.error('[Review] deleteReview error:', error.message);
    return { error: '리뷰 삭제에 실패했습니다.' };
  }

  // 캐시 무효화 — 리뷰 목록 + 앱 상세
  revalidateTag(CACHE_TAGS.apps, { expire: 0 });
  revalidatePath(`/ko/apps/${appSlug}`);
  return { success: true };
}
