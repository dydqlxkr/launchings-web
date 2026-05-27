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

  const navUser = user
    ? { id: user.id, email: user.email ?? null }
    : null;

  return <Navbar user={navUser} />;
}
