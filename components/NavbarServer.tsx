/**
 * 서버 컴포넌트 — Supabase에서 현재 사용자 정보를 읽어 Navbar(Client)에 전달.
 * RSC에서 직접 auth를 읽으므로 클라이언트 번들에 세션 데이터가 노출되지 않음.
 */

import { createClient } from '@/lib/supabase/server';
import Navbar from './Navbar';

export default async function NavbarServer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <Navbar user={null} />;
  }

  // profiles 테이블에서 handle과 display_name 조회
  const { data: profile } = await supabase
    .from('profiles')
    .select('handle, display_name')
    .eq('id', user.id)
    .single();

  // 안 읽은 알림 수 조회
  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  const navUser = {
    id: user.id,
    email: user.email ?? null,
    handle: profile?.handle ?? null,
    displayName: profile?.display_name ?? null,
  };

  return <Navbar user={navUser} unreadNotifications={unreadCount ?? 0} />;
}
