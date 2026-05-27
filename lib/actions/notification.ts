'use server';

/**
 * 알림 Server Actions.
 * notifications 테이블 조회 + 읽음 처리.
 * RLS: user_id = auth.uid() 강제.
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Notification } from '@/lib/types';

/**
 * 현재 로그인 사용자의 알림 목록 조회 (최신 50건).
 * actor(Profile) + app 정보 조인.
 */
export async function listMyNotifications(): Promise<Notification[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      actor:profiles!actor_id(id, handle, display_name, avatar_url, avatar_gradient),
      app:apps!app_id(id, slug, title, thumbnail_emoji, thumbnail_gradient)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data) {
    console.error('[Notification] listMyNotifications error:', error?.message);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map(mapNotification);
}

/**
 * 현재 로그인 사용자의 안 읽은 알림 수.
 */
export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) return 0;
  return count ?? 0;
}

/**
 * 특정 알림 읽음 처리.
 */
export async function markRead(id: string): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', user.id); // RLS 이중 방어

  revalidatePath('/ko/notifications');
}

/**
 * 전체 알림 읽음 처리.
 */
export async function markAllRead(): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  revalidatePath('/ko/notifications');
}

// ── 매핑 헬퍼 ────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapNotification(row: any): Notification {
  return {
    id: row.id,
    user_id: row.user_id,
    type: row.type,
    actor_id: row.actor_id ?? null,
    app_id: row.app_id ?? null,
    message: row.message ?? null,
    is_read: row.is_read ?? false,
    created_at: row.created_at,
    actor: row.actor
      ? {
          id: row.actor.id,
          handle: row.actor.handle,
          display_name: row.actor.display_name ?? row.actor.handle,
          bio: null,
          avatar_url: row.actor.avatar_url ?? null,
          avatar_gradient: row.actor.avatar_gradient ?? null,
          avatar_initial: null,
          website_url: null,
          created_at: '',
        }
      : null,
    app: row.app
      ? {
          id: row.app.id,
          slug: row.app.slug,
          title: row.app.title,
          thumbnail_emoji: row.app.thumbnail_emoji ?? null,
          thumbnail_gradient: row.app.thumbnail_gradient ?? null,
        }
      : null,
  };
}
