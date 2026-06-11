import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import { getRepo } from '@/lib/repo';
import NavbarClient from '@/components/NavbarClient';
import Footer from '@/components/Footer';
import AppsPageClient from '@/components/AppsPageClient';

export const revalidate = 300;

export const metadata: Metadata = {
  title: '앱 둘러보기',
  description:
    '한국 0→1 빌더들이 직접 만든 작동 제품을 카테고리별로 탐색해 보세요.',
  alternates: { canonical: '/ko/apps' },
};

export default async function AppsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('appsPage');
  const repo = getRepo();

  // 앱 전체(추천순) + 카테고리 목록 조회 (비개인화 캐시)
  const [apps, categories] = await Promise.all([
    repo.listApps({ sort: 'votes' }),
    repo.listCategories(),
  ]);

  return (
    <>
      <NavbarClient />

      {/* ── 페이지 헤더 ─────────────────────────────────────────── */}
      <header
        style={{
          position: 'relative',
          padding: '56px 0 28px',
          overflow: 'hidden',
        }}
      >
        {/* 배경 글로우 */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 700,
            height: 400,
            background:
              'radial-gradient(closest-side,rgba(108,140,255,.18),transparent 70%)',
            filter: 'blur(10px)',
            pointerEvents: 'none',
          }}
        />

        <div className="lp-container" style={{ position: 'relative' }}>
          {/* 뒤로가기 */}
          <Link
            href="/ko"
            style={{
              color: 'var(--muted)',
              fontSize: 13,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 20,
              textDecoration: 'none',
            }}
            className="hover:text-[var(--ink)] transition-colors"
          >
            ← {t('backToHome')}
          </Link>

          {/* 제목 행: 제목+설명 왼쪽, 등록 버튼 오른쪽 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: 'clamp(26px, 4vw, 38px)',
                  fontWeight: 800,
                  letterSpacing: '-1px',
                  marginBottom: 10,
                }}
              >
                {t('title')}
              </h1>
              <p
                style={{
                  fontSize: 16,
                  color: 'var(--muted)',
                  maxWidth: 540,
                }}
              >
                {t('description')}
              </p>
            </div>

            <Link
              href="/ko/submit"
              className="lp-btn lp-btn-primary lp-btn-sm"
              style={{ flexShrink: 0, fontSize: 14, padding: '10px 20px' }}
            >
              {t('submitCta')}
            </Link>
          </div>
        </div>
      </header>

      {/* ── 클라이언트 파트 (검색 + 그리드) ───────────────────── */}
      <main style={{ flex: 1, paddingBottom: 80 }}>
        <AppsPageClient
          apps={apps}
          categories={categories}
        />
      </main>

      <Footer />
    </>
  );
}
