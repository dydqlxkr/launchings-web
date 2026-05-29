/**
 * 내 북마크 페이지 — /ko/bookmarks
 * 로그인 필수. 북마크한 앱 목록(AppCard 그리드).
 */

import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getRepo } from '@/lib/repo';
import NavbarServer from '@/components/NavbarServer';
import Footer from '@/components/Footer';
import LoginPrompt from '@/components/LoginPrompt';
import AppCard from '@/components/AppCard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '내 북마크',
  description: '북마크한 앱 목록을 확인하세요.',
  robots: { index: false, follow: false },
};

export default async function BookmarksPage() {
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
            <BookmarksContent userId={user.id} />
          ) : (
            <LoginPrompt />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

async function BookmarksContent({ userId }: { userId: string }) {
  const repo = getRepo();
  const [apps, bookmarkIds] = await Promise.all([
    repo.listBookmarkedApps(userId),
    repo.getMyBookmarkIds(userId),
  ]);

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: '-.5px',
            marginBottom: 4,
          }}
        >
          내 북마크
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          북마크한 앱들을 한곳에서 확인하세요.
        </p>
      </div>

      {apps.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 24px',
            color: 'var(--muted)',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔖</div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--ink)',
              marginBottom: 8,
            }}
          >
            아직 북마크한 앱이 없어요
          </h2>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              maxWidth: 320,
              margin: '0 auto',
            }}
          >
            앱 카드나 상세 페이지에서 북마크 아이콘을 눌러 저장해 보세요.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          {apps.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              isLoggedIn={true}
              initialBookmarked={bookmarkIds.has(app.id)}
            />
          ))}
        </div>
      )}
    </>
  );
}
