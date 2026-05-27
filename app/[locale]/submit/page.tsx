/**
 * 앱 등록 페이지 — /ko/submit
 * 로그인 필수. 비로그인 접근 시 홈으로 리다이렉트.
 */

import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getRepo } from '@/lib/repo';
import NavbarServer from '@/components/NavbarServer';
import Footer from '@/components/Footer';
import SubmitForm from './SubmitForm';

export const metadata: Metadata = {
  title: '제품 등록',
  description: '런칭스에 내가 만든 제품을 등록하세요.',
};

export default async function SubmitPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/ko');
  }

  const repo = getRepo();
  const categories = await repo.listCategories();

  return (
    <>
      <NavbarServer />
      <main style={{ flex: 1 }}>
        <div
          className="max-w-[1120px] mx-auto px-6 py-10"
          style={{ maxWidth: 700 }}
        >
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: '-.5px',
              marginBottom: 8,
            }}
          >
            제품 등록
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 32 }}>
            직접 만든 앱·도구를 런칭스 커뮤니티에 공개하세요.
          </p>

          <SubmitForm categories={categories} userId={user.id} />
        </div>
      </main>
      <Footer />
    </>
  );
}
