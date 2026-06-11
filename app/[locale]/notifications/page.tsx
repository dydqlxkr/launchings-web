/**
 * 알림 페이지 — /ko/notifications
 * 로그인 필수. 알림 목록 + 전체 읽음 처리.
 */

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import NavbarServer from '@/components/NavbarServer';
import Footer from '@/components/Footer';
import LoginPrompt from '@/components/LoginPrompt';
import NotificationsContent from './NotificationsContent';
import { listMyNotifications } from '@/lib/actions/notification';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '알림',
  description: '팔로우한 메이커의 새 앱 알림을 확인하세요.',
  robots: { index: false, follow: false },
};

export default async function NotificationsPage() {
  const t = await getTranslations('notifications');
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <NavbarServer />
      <main style={{ flex: 1, width: '100%' }}>
        <div
          className="lp-container--md"
          style={{ paddingTop: 40, paddingBottom: 60 }}
        >
          {user ? (
            <NotificationsPageContent title={t('title')} />
          ) : (
            <LoginPrompt
              title="알림을 확인하려면 로그인이 필요해요"
              description="로그인하고 팔로우한 메이커의 새 앱 소식을 받아보세요."
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

async function NotificationsPageContent({ title }: { title: string }) {
  const notifications = await listMyNotifications();

  return <NotificationsContent title={title} initialNotifications={notifications} />;
}
