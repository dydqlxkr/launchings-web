/**
 * 앱 등록 페이지 — /ko/submit
 * 비로그인 시 로그인 안내 화면을 렌더. 로그인 후 새로고침하면 폼이 보인다.
 */

import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getRepo } from '@/lib/repo';
import NavbarServer from '@/components/NavbarServer';
import Footer from '@/components/Footer';
import LoginPrompt from '@/components/LoginPrompt';
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

  return (
    <>
      <NavbarServer />
      <main style={{ flex: 1, width: '100%' }}>
        <div
          className="lp-container--sm"
          style={{
            paddingTop: 40,
            paddingBottom: 60,
          }}
        >
          {user ? (
            <>
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
              <SubmitFormWithCategories userId={user.id} />
            </>
          ) : (
            <LoginPrompt />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

async function SubmitFormWithCategories({ userId }: { userId: string }) {
  const repo = getRepo();
  const categories = await repo.listCategories();
  return <SubmitForm categories={categories} userId={userId} />;
}
