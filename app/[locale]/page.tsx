import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { getRepo } from '@/lib/repo';
import type { AppWithRelations } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';
import NavbarServer from '@/components/NavbarServer';
import Footer from '@/components/Footer';
import HomeWrapper from '@/components/HomeWrapper';

export default async function HomePage() {
  const t = await getTranslations();
  const repo = getRepo();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [apps, profiles, categories] = await Promise.all([
    repo.listApps({ sort: 'votes' }),
    repo.listProfiles(),
    repo.listCategories(),
  ]);

  // 빌더별 앱 맵을 서버에서 미리 계산
  const makerApps: Record<string, AppWithRelations[]> = {};
  for (const profile of profiles) {
    makerApps[profile.id] = await repo.listAppsByAuthor(profile.id);
  }

  return (
    <>
      <NavbarServer />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <header
        style={{
          position: 'relative',
          padding: '84px 0 64px',
          overflow: 'hidden',
          textAlign: 'center',
        }}
      >
        {/* 배경 글로우 */}
        <div
          style={{
            position: 'absolute',
            top: -200,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 900,
            height: 600,
            background:
              'radial-gradient(closest-side,rgba(108,140,255,.22),transparent 70%)',
            filter: 'blur(10px)',
            pointerEvents: 'none',
          }}
        />

        <div className="lp-container" style={{ position: 'relative' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            {/* Pill 배지 */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--chip)',
                border: '1px solid var(--line)',
                color: 'var(--muted)',
                fontSize: 13,
                fontWeight: 600,
                padding: '6px 13px',
                borderRadius: 999,
                marginBottom: 22,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  boxShadow: '0 0 10px var(--accent)',
                  display: 'inline-block',
                }}
              />
              {t('hero.pill')}
            </span>

            {/* 큰 헤드라인 */}
            <h1
              style={{
                fontSize: 'clamp(32px, 6vw, 52px)',
                lineHeight: 1.12,
                letterSpacing: '-1.5px',
                fontWeight: 800,
                marginBottom: 18,
              }}
            >
              {t('hero.heading1')}
              <br />
              <span
                style={{
                  background:
                    'linear-gradient(120deg,var(--brand),var(--brand2) 60%,var(--accent))',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {t('hero.heading2')}
              </span>
            </h1>

            {/* 리드 문구 */}
            <p
              style={{
                fontSize: 18.5,
                color: 'var(--muted)',
                maxWidth: 560,
                margin: '0 auto 30px',
              }}
            >
              {t('hero.lead')}
            </p>

            {/* CTA 버튼 2개 */}
            <div
              style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Link
                href="/ko/apps"
                style={{
                  background:
                    'linear-gradient(135deg,var(--brand),var(--brand2))',
                  color: '#fff',
                  borderRadius: 12,
                  padding: '13px 24px',
                  fontSize: 15.5,
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                🔥 {t('hero.ctaBrowse')}
              </Link>
              <a
                href={user ? '/ko/submit' : '#discover'}
                style={{
                  background: 'transparent',
                  color: 'var(--ink)',
                  border: '1px solid var(--line)',
                  borderRadius: 12,
                  padding: '13px 24px',
                  fontSize: 15.5,
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                {t('hero.ctaSubmit')} →
              </a>
            </div>

            {/* 통계 행 */}
            <div
              style={{
                display: 'flex',
                gap: 36,
                justifyContent: 'center',
                marginTop: 46,
                flexWrap: 'wrap',
              }}
            >
              {[
                { n: `${apps.length}+`, l: t('hero.statApps') },
                { n: `${profiles.length}+`, l: t('hero.statBuilders') },
                { n: '86', l: t('hero.statHires') },
              ].map(({ n, l }) => (
                <div key={l}>
                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 800,
                      letterSpacing: '-.5px',
                    }}
                  >
                    {n}
                  </div>
                  <div
                    style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}
                  >
                    {l}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ── 메인 섹션들 (검색 · 그리드 · How · Makers · Recruit) ── */}
      <HomeWrapper
        apps={apps}
        profiles={profiles}
        categories={categories}
        makerApps={makerApps}
        isLoggedIn={!!user}
      />

      <Footer />
    </>
  );
}
