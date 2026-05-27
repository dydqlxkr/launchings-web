/**
 * 제품 수정 페이지 — /ko/my-apps/[id]/edit
 * 로그인 + 소유자만 접근. 기존 데이터로 폼을 프리필.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getRepo } from '@/lib/repo';
import NavbarServer from '@/components/NavbarServer';
import Footer from '@/components/Footer';
import SubmitForm from '@/app/[locale]/submit/SubmitForm';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '제품 수정',
};

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function EditAppPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // 앱 조회 (소유자 확인 포함)
  const { data: row, error } = await supabase
    .from('apps')
    .select(`
      *,
      app_categories(category_slug),
      app_stacks(stack)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error || !row) {
    notFound();
  }

  // 소유자가 아니면 notFound
  if (row.author_id !== user.id) {
    notFound();
  }

  // 카테고리 목록 로드
  const repo = getRepo();
  const categories = await repo.listCategories();

  // initialData 구성
  const initialData = {
    id: row.id,
    slug: row.slug,
    title: row.title,
    tagline: row.tagline ?? '',
    description: row.description ?? '',
    app_type: row.app_type as 'webapp' | 'native' | 'link',
    live_url: row.live_url ?? '',
    store_url_ios: row.store_url_ios ?? '',
    store_url_android: row.store_url_android ?? '',
    thumbnail_path: row.thumbnail_path ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    categories: (row.app_categories ?? []).map((c: any) => c.category_slug).filter(Boolean) as string[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stacks: (row.app_stacks ?? []).map((s: any) => s.stack).filter(Boolean) as string[],
  };

  return (
    <>
      <NavbarServer />
      <main style={{ flex: 1, width: '100%' }}>
        <div
          className="lp-container--sm"
          style={{ paddingTop: 40, paddingBottom: 60 }}
        >
          <div style={{ marginBottom: 20 }}>
            <Link
              href="/ko/my-apps"
              style={{
                fontSize: 13,
                color: 'var(--muted)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              ← 내 등록 제품으로
            </Link>
          </div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: '-.5px',
              marginBottom: 8,
            }}
          >
            제품 수정
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 32 }}>
            등록한 제품 정보를 수정하세요.
          </p>
          <SubmitForm
            categories={categories}
            userId={user.id}
            mode="edit"
            initialData={initialData}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
