/**
 * 내 등록 제품 관리 페이지 — /ko/my-apps
 * 로그인 필수. 본인이 등록한 모든 앱(status 무관) 목록 표시.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import NavbarServer from '@/components/NavbarServer';
import Footer from '@/components/Footer';
import LoginPrompt from '@/components/LoginPrompt';
import MyAppsList from './MyAppsList';

export const metadata: Metadata = {
  title: '내 등록 제품',
  description: '내가 런칭스에 등록한 제품을 관리하세요.',
};

export default async function MyAppsPage() {
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
            <MyAppsContent userId={user.id} />
          ) : (
            <LoginPrompt />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

async function MyAppsContent({ userId }: { userId: string }) {
  const supabase = await createClient();

  // 본인 앱 전체 조회 (status 무관, apps_select_own RLS 정책으로 허용)
  const { data, error } = await supabase
    .from('apps')
    .select(`
      *,
      author:profiles!author_id(*),
      app_categories(category_slug),
      app_stacks(stack)
    `)
    .eq('author_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[MyAppsPage] fetch error:', error.message);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apps = (data ?? []).map((row: any) => ({
    id: row.id,
    author_id: row.author_id,
    slug: row.slug,
    title: row.title,
    tagline: row.tagline ?? null,
    description: row.description ?? '',
    app_type: row.app_type,
    live_url: row.live_url ?? null,
    store_url_ios: row.store_url_ios ?? null,
    store_url_android: row.store_url_android ?? null,
    demo_video_url: row.demo_video_url ?? null,
    thumbnail_path: row.thumbnail_path ?? null,
    thumbnail_emoji: row.thumbnail_emoji ?? null,
    thumbnail_gradient: row.thumbnail_gradient ?? null,
    embed_status: row.embed_status ?? 'unknown',
    status: row.status,
    vote_count: row.vote_count ?? 0,
    view_count: row.view_count ?? 0,
    created_at: row.created_at,
    updated_at: row.updated_at ?? row.created_at,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    categories: (row.app_categories ?? []).map((c: any) => c.category_slug).filter(Boolean),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stacks: (row.app_stacks ?? []).map((s: any) => s.stack).filter(Boolean),
    author: row.author ?? {},
  }));

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: '-.5px',
              marginBottom: 4,
            }}
          >
            내 등록 제품
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            내가 런칭스에 등록한 제품을 관리하세요.
          </p>
        </div>
        <Link
          href="/ko/submit"
          style={{
            background: 'linear-gradient(135deg,var(--brand),var(--brand2))',
            border: 'none',
            borderRadius: 10,
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 700,
            color: '#fff',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          + 제품 등록하기
        </Link>
      </div>

      {apps.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 24px',
            color: 'var(--muted)',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 16 }}>📦</div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--ink)',
              marginBottom: 8,
            }}
          >
            아직 등록한 제품이 없어요
          </h2>
          <p style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 320, margin: '0 auto 24px' }}>
            직접 만든 앱·도구를 런칭스 커뮤니티에 공개해 보세요.
          </p>
          <Link
            href="/ko/submit"
            style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg,var(--brand),var(--brand2))',
              border: 'none',
              borderRadius: 12,
              padding: '13px 32px',
              fontSize: 15,
              fontWeight: 700,
              color: '#fff',
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(108,140,255,.35)',
            }}
          >
            제품 등록하기
          </Link>
        </div>
      ) : (
        <MyAppsList apps={apps} />
      )}
    </>
  );
}
