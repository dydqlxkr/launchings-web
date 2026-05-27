/**
 * 프로필 설정 페이지 — /ko/settings
 * 로그인 필수. 비로그인 시 홈으로 리다이렉트.
 */

import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import NavbarServer from '@/components/NavbarServer';
import Footer from '@/components/Footer';
import SettingsForm from './SettingsForm';
import DeleteAccountSection from './DeleteAccountSection';

export const metadata: Metadata = {
  title: '프로필 설정',
  description: '런칭스 프로필을 설정하세요.',
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/ko');
  }

  // 현재 프로필 조회
  const { data: profile } = await supabase
    .from('profiles')
    .select('handle, display_name, bio, website_url')
    .eq('id', user.id)
    .single();

  const t = await getTranslations('settings');

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
          {/* 헤더 */}
          <div style={{ marginBottom: 32 }}>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: '-.4px',
                marginBottom: 8,
              }}
            >
              {t('title')}
            </h1>
            <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>
              {t('description')}
            </p>
          </div>

          {/* 폼 */}
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--line)',
              borderRadius: 16,
              padding: '28px 24px',
            }}
          >
            <SettingsForm
              initialDisplayName={profile?.display_name ?? ''}
              initialHandle={profile?.handle ?? ''}
              initialBio={profile?.bio ?? null}
              initialWebsiteUrl={profile?.website_url ?? null}
            />
          </div>

          {/* 위험 구역 — 회원 탈퇴 */}
          <div style={{ marginTop: 40 }}>
            <DeleteAccountSection />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
