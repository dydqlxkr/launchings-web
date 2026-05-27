'use server';

/**
 * 조회수 증가 Server Action.
 * RPC increment_app_view(p_app_id)를 호출해 view_count + 1.
 * SECURITY DEFINER로 RLS 우회.
 */

import { createClient } from '@/lib/supabase/server';

export async function incrementView(appId: string): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.rpc('increment_app_view', { p_app_id: appId });
  } catch (err) {
    // 조회수 증가 실패는 사용자에게 노출하지 않음
    console.error('[View] incrementView error:', err);
  }
}
