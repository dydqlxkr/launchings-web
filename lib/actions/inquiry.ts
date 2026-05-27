'use server';

/**
 * 문의하기 Server Action.
 * - submitInquiry: 문의 폼 제출 (익명/로그인 모두 허용)
 */

import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, RATE_LIMIT_ERROR } from '@/lib/rateLimit';

export interface InquiryActionResult {
  error?: string;
  success?: boolean;
}

/** IP당 시간당 5회 */
function rateLimitInquiry() {
  return checkRateLimit('submitInquiry', { limit: 5, windowSec: 3600 });
}

/**
 * 문의 제출.
 * 로그인 시 user_id / email 자동 채움. 익명도 허용.
 */
export async function submitInquiry(formData: FormData): Promise<InquiryActionResult> {
  const rl = await rateLimitInquiry();
  if (!rl.ok) return { error: RATE_LIMIT_ERROR };

  const name    = (formData.get('name')    as string | null)?.trim() ?? '';
  const email   = (formData.get('email')   as string | null)?.trim() ?? '';
  const message = (formData.get('message') as string | null)?.trim() ?? '';

  // 입력 검증
  if (!message) {
    return { error: '문의 내용을 입력해 주세요.' };
  }
  if (message.length > 2000) {
    return { error: '문의 내용은 2000자 이내로 작성해 주세요.' };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: '이메일 형식이 올바르지 않습니다.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 로그인 사용자라면 user_id 및 이메일 자동 채움 (폼 값 우선)
  const resolvedEmail  = email  || (user?.email ?? '');
  const resolvedUserId = user?.id ?? null;

  const { error } = await supabase.from('inquiries').insert({
    name:    name    || null,
    email:   resolvedEmail || null,
    message,
    user_id: resolvedUserId,
  });

  if (error) {
    console.error('[Inquiry] submitInquiry error:', error.message);
    return { error: '문의 접수에 실패했습니다. 잠시 후 다시 시도해 주세요.' };
  }

  return { success: true };
}
