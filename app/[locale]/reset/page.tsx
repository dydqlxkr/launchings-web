/**
 * 비밀번호 재설정 페이지 — /ko/reset
 * 이메일 재설정 링크 클릭 후 /auth/callback → 여기로 리다이렉트됨.
 * recovery 세션이 있어야 비밀번호 변경 가능.
 */

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import NavbarServer from '@/components/NavbarServer';
import Footer from '@/components/Footer';
import ResetPasswordForm from './ResetPasswordForm';

export const metadata: Metadata = {
  title: '비밀번호 재설정',
  description: '런칭스 계정 비밀번호를 재설정합니다.',
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage() {
  const t = await getTranslations('resetPassword');

  return (
    <>
      <NavbarServer />
      <main style={{ flex: 1, width: '100%' }}>
        <div
          className="lp-container--sm"
          style={{ paddingTop: 60, paddingBottom: 60 }}
        >
          {/* 로고 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: 'linear-gradient(135deg,var(--brand),var(--brand2))',
                boxShadow: '0 0 14px var(--brand)',
                display: 'inline-block',
              }}
            />
            <span style={{ fontWeight: 800, fontSize: 16 }}>런칭스</span>
          </div>

          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--line)',
              borderRadius: 18,
              padding: '32px 28px',
              maxWidth: 400,
            }}
          >
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, letterSpacing: '-.3px' }}>
              {t('title')}
            </h1>
            <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.6 }}>
              {t('desc')}
            </p>

            <ResetPasswordForm />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
