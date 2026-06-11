'use server';

/**
 * 조회수 증가 Server Action.
 * RPC increment_app_view(p_app_id)를 호출해 view_count + 1.
 * SECURITY DEFINER로 RLS 우회.
 *
 * 어뷰징 완화: Upstash Redis가 설정된 경우 IP+appId 당 1시간 1회로 디바운스.
 * 키 미설정 시 graceful pass (동작 불변). 레이트리밋 실패 시도 렌더 차단 없음.
 */

import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';

export async function incrementView(appId: string): Promise<void> {
  try {
    // IP + appId 조합으로 1시간 1회 디바운스.
    // checkRateLimit 내부에서 identifier = `${action}:${ip}` 로 구성되므로
    // action을 "view:${appId}" 로 지정하면 최종 key = "view:<appId>:<ip>" 가 된다.
    const { ok } = await checkRateLimit(`view:${appId}`, {
      limit: 1,
      windowSec: 3600,
    });
    if (!ok) return; // 이미 카운팅됨 — 조용히 무시

    const supabase = await createClient();
    await supabase.rpc('increment_app_view', { p_app_id: appId });
  } catch (err) {
    // 조회수 증가 실패는 사용자에게 노출하지 않음
    console.error('[View] incrementView error:', err);
  }
}
