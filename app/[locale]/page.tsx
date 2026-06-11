import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { getRepo } from '@/lib/repo';
import type { AppWithRelations } from '@/lib/types';
import { getCurrentUser } from '@/lib/supabase/getCurrentUser';
import NavbarServer from '@/components/NavbarServer';
import Footer from '@/components/Footer';
import HomeWrapper from '@/components/HomeWrapper';

export const metadata: Metadata = {
  alternates: { canonical: '/ko' },
};

// 콜드스타트 방지: 앱/빌더 수가 임계치 미만이면 히어로 카운터를 숨겨
// '텅 빈 사이트' 인상을 주지 않는다 (P1-4).
const HERO_STATS_MIN_APPS = 10;
const HERO_STATS_MIN_BUILDERS = 3;

export default async function HomePage() {
  const t = await getTranslations();
  const repo = getRepo();

  // 요청 내 1회로 dedupe (NavbarServer와 공유)
  const user = await getCurrentUser();

  const [apps, profiles, categories] = await Promise.all([
    repo.listApps({ sort: 'votes' }),
    repo.listProfiles(),
    repo.listCategories(),
  ]);

  // N+1 제거: listApps() 결과를 author_id로 메모리 group-by (추가 DB 쿼리 없음)
  const makerApps: Record<string, AppWithRelations[]> = {};
  for (const app of apps) {
    const aid = app.author_id;
    if (!makerApps[aid]) makerApps[aid] = [];
    makerApps[aid].push(app);
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
                whiteSpace: 'pre-line',
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
                className="lp-btn lp-btn-primary"
                style={{ fontSize: 15.5 }}
              >
                🔥 {t('hero.ctaBrowse')}
              </Link>
              <a
                href={user ? '/ko/submit' : '#discover'}
                className="lp-btn lp-btn-ghost"
                style={{ fontSize: 15.5 }}
              >
                {t('hero.ctaSubmit')}
              </a>
            </div>

            {/* 통계 행 — 콜드스타트 방지: 임계치 미만이면 숨김 (P1-4) */}
            {apps.length >= HERO_STATS_MIN_APPS &&
              profiles.length >= HERO_STATS_MIN_BUILDERS && (
            <div
              style={{
                display: 'flex',
                gap: 36,
                justifyContent: 'center',
                marginTop: 46,
                flexWrap: 'wrap',
              }}
            >
              {(() => {
                const totalVotes = apps.reduce((s, a) => s + a.vote_count, 0);
                const voteLabel = totalVotes >= 10 ? `${totalVotes}+` : String(totalVotes);
                return [
                  { n: String(apps.length), l: t('hero.statApps') },
                  { n: String(profiles.length), l: t('hero.statBuilders') },
                  { n: voteLabel, l: t('hero.statVotes') },
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
                ));
              })()}
            </div>
            )}
          </div>
        </div>
      </header>

      {/* ── 메인 섹션들 (트렌딩 그리드 · 주목받는 메이커) ── */}
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
