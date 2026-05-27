'use server';

/**
 * 앱 신고 Server Action.
 * 로그인 필수 (RLS: reports_insert_auth — auth.uid() IS NOT NULL).
 * 중복 신고 방지: DB unique index (reporter_id, app_id) WHERE reporter_id IS NOT NULL.
 * 0002_reports_unique.sql 마이그레이션 적용 필요.
 */

import { createClient } from '@/lib/supabase/server';
import { rateLimitInteraction, RATE_LIMIT_ERROR } from '@/lib/rateLimit';

export type ReportReason =
  | 'spam'
  | 'malware'
  | 'stolen'
  | 'inappropriate'
  | 'broken'
  | 'other';

export type ReportResult =
  | { success: true; error?: undefined }
  | { error: string; success?: undefined };

export async function reportApp(
  appId: string,
  reason: ReportReason,
  detail?: string
): Promise<ReportResult> {
  const rl = await rateLimitInteraction('reportApp');
  if (!rl.ok) return { error: RATE_LIMIT_ERROR };

  if (!appId || !reason) {
    return { error: '신고 정보가 올바르지 않습니다.' };
  }

  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'unauthenticated' };
  }

  // INSERT — 중복 시 unique 제약에 의해 에러 발생 (23505)
  const { error } = await supabase.from('reports').insert({
    app_id: appId,
    reporter_id: user.id,
    reason,
    detail: detail?.trim() || null,
    status: 'open',
  });

  if (error) {
    // unique 위반 = 중복 신고
    if (error.code === '23505') {
      return { error: '이미 이 앱을 신고하셨습니다.' };
    }
    console.error('[Report] insert error:', error.message);
    return { error: '신고 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' };
  }

  return { success: true };
}
