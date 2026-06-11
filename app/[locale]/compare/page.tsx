import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getRepo } from '@/lib/repo';
import NavbarServer from '@/components/NavbarServer';
import Footer from '@/components/Footer';
import AvatarCircle from '@/components/AvatarCircle';
import CompareRemoveButton from '@/components/CompareRemoveButton';
import type { AppWithRelations } from '@/lib/types';

export const metadata: Metadata = {
  title: '앱 비교',
  description: '런칭스 앱 나란히 비교',
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ ids?: string }>;
}

/** 비교 테이블 한 행 */
function CompareRow({
  label,
  values,
}: {
  label: string;
  values: (string | React.ReactNode)[];
}) {
  return (
    <tr
      style={{
        borderBottom: '1px solid var(--line)',
      }}
    >
      <td
        style={{
          padding: '14px 16px',
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--muted)',
          whiteSpace: 'nowrap',
          verticalAlign: 'top',
          width: 110,
          background: 'var(--bg2)',
        }}
      >
        {label}
      </td>
      {values.map((val, i) => (
        <td
          key={i}
          style={{
            padding: '14px 16px',
            fontSize: 13,
            color: 'var(--ink)',
            verticalAlign: 'top',
            borderLeft: '1px solid var(--line)',
          }}
        >
          {val}
        </td>
      ))}
    </tr>
  );
}

export default async function ComparePage({ searchParams }: PageProps) {
  const { ids: idsParam } = await searchParams;
  const t = await getTranslations('compare');
  const repo = getRepo();

  // ids 파싱 — 최대 3개
  const ids = (idsParam ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

  const [apps, allCategories] = await Promise.all([
    ids.length > 0 ? repo.getAppsByIds(ids) : Promise.resolve([] as AppWithRelations[]),
    repo.listCategories(),
  ]);
  // slug → {label_ko, emoji} 맵 (DB 기반)
  const catMap = new Map(allCategories.map((c) => [c.slug, c]));

  const colWidth = apps.length === 0 ? '100%' : `${Math.floor(100 / apps.length)}%`;

  return (
    <>
      <NavbarServer />
      <main style={{ flex: 1 }}>
        <div className="lp-container--md" style={{ paddingTop: 40, paddingBottom: 40 }}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 28,
              flexWrap: 'wrap',
            }}
          >
            <Link
              href="/ko"
              style={{
                color: 'var(--muted)',
                fontSize: 13,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
              className="hover:text-[var(--ink)] transition-colors"
            >
              ← {t('backBtn')}
            </Link>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: '-.5px',
              }}
            >
              {t('pageTitle')} ({apps.length})
            </h1>
          </div>

          {/* Empty state */}
          {apps.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                color: 'var(--muted)',
                padding: '60px 24px',
                fontSize: 15,
                background: 'var(--card)',
                border: '1px solid var(--line)',
                borderRadius: 16,
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
              <p>{t('empty')}</p>
              <Link
                href="/ko"
                style={{
                  display: 'inline-block',
                  marginTop: 20,
                  background: 'linear-gradient(135deg,var(--brand),var(--brand2))',
                  color: '#fff',
                  padding: '10px 20px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                앱 목록으로
              </Link>
            </div>
          )}

          {/* Compare table */}
          {apps.length > 0 && (
            <div
              style={{
                overflowX: 'auto',
                borderRadius: 16,
                border: '1px solid var(--line)',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  tableLayout: 'fixed',
                }}
              >
                {/* 컬럼 선언 */}
                <colgroup>
                  <col style={{ width: 110 }} />
                  {apps.map((a) => (
                    <col key={a.id} style={{ width: colWidth }} />
                  ))}
                </colgroup>

                {/* 앱 헤더 */}
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line)' }}>
                    <th
                      style={{
                        background: 'var(--bg2)',
                        padding: '16px',
                        textAlign: 'left',
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--muted)',
                        width: 110,
                      }}
                    />
                    {apps.map((app) => (
                      <th
                        key={app.id}
                        style={{
                          padding: '16px',
                          textAlign: 'left',
                          borderLeft: '1px solid var(--line)',
                          background: 'var(--card)',
                          verticalAlign: 'top',
                        }}
                      >
                        {/* 헤더: 앱 정보 + ✕ 제거 버튼 */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                          <Link
                            href={`/ko/apps/${app.slug}`}
                            style={{ display: 'block', minWidth: 0, flex: 1 }}
                            className="hover:opacity-80 transition-opacity"
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div
                                style={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: 12,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 24,
                                  background: app.thumbnail_gradient
                                    ? `linear-gradient(${app.thumbnail_gradient})`
                                    : 'var(--card2)',
                                  flexShrink: 0,
                                }}
                              >
                                {app.thumbnail_emoji}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    fontWeight: 800,
                                    fontSize: 15,
                                    color: 'var(--ink)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {app.title}
                                </div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    color:
                                      app.app_type === 'webapp'
                                        ? 'var(--accent)'
                                        : 'var(--warm)',
                                    fontWeight: 700,
                                    marginTop: 2,
                                  }}
                                >
                                  {app.app_type === 'webapp'
                                    ? '● 웹 실행'
                                    : '📦 네이티브'}
                                </div>
                              </div>
                            </div>
                          </Link>
                          {/* ✕ 제거 버튼 — 해당 앱을 비교에서 제거하고 URL 갱신 */}
                          <CompareRemoveButton appId={app.id} currentIds={ids} />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {/* 제작자 */}
                  <CompareRow
                    label={t('field.maker')}
                    values={apps.map((app) =>
                      app.author ? (
                        <Link
                          href={`/ko/makers/${app.author.handle}`}
                          key={app.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            color: 'var(--muted)',
                          }}
                          className="hover:text-[var(--brand)] transition-colors"
                        >
                          <AvatarCircle profile={app.author} size={22} fontSize={11} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {app.author.display_name}
                          </span>
                        </Link>
                      ) : (
                        '-'
                      )
                    )}
                  />

                  {/* 카테고리 */}
                  <CompareRow
                    label={t('field.category')}
                    values={apps.map((app) => {
                      const cats = (app.categories ?? []).map((cSlug) => {
                        const c = catMap.get(cSlug);
                        return c ? `${c.emoji} ${c.label_ko}` : cSlug;
                      });
                      return cats.length > 0 ? (
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {cats.map((c) => (
                            <span
                              key={c}
                              style={{
                                background: 'var(--chip)',
                                border: '1px solid var(--line)',
                                borderRadius: 6,
                                padding: '2px 7px',
                                fontSize: 11,
                                color: 'var(--muted)',
                              }}
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      ) : (
                        '-'
                      );
                    })}
                  />

                  {/* 기술 스택 */}
                  <CompareRow
                    label={t('field.stack')}
                    values={apps.map((app) => {
                      const stacks = app.stacks ?? [];
                      return stacks.length > 0 ? (
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {stacks.map((s) => (
                            <span
                              key={s}
                              style={{
                                background: 'var(--chip)',
                                border: '1px solid var(--line)',
                                borderRadius: 6,
                                padding: '2px 7px',
                                fontSize: 11,
                                color: 'var(--muted)',
                              }}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        '-'
                      );
                    })}
                  />

                  {/* 추천수 */}
                  <CompareRow
                    label={t('field.votes')}
                    values={apps.map((app) => (
                      <span key={app.id} style={{ fontWeight: 800, fontSize: 15, color: 'var(--accent)' }}>
                        ▲ {app.vote_count.toLocaleString()}
                      </span>
                    ))}
                  />

                  {/* 실행 가능 여부 */}
                  <CompareRow
                    label={t('field.runnable')}
                    values={apps.map((app) =>
                      app.app_type === 'webapp' ? (
                        <span key={app.id} style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 12 }}>
                          ✓ {t('runnable_yes')}
                        </span>
                      ) : (
                        <span key={app.id} style={{ color: 'var(--warm)', fontWeight: 700, fontSize: 12 }}>
                          {t('runnable_no')}
                        </span>
                      )
                    )}
                  />

                  {/* 설명 */}
                  <CompareRow
                    label={t('field.description')}
                    values={apps.map((app) => (
                      <span key={app.id} style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.6 }}>
                        {app.tagline ?? app.description}
                      </span>
                    ))}
                  />
                </tbody>
              </table>
            </div>
          )}

          {/* 각 앱 상세 링크 */}
          {apps.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: 10,
                marginTop: 24,
                flexWrap: 'wrap',
              }}
            >
              {apps.map((app) => (
                <Link
                  key={app.id}
                  href={`/ko/apps/${app.slug}`}
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--line)',
                    borderRadius: 10,
                    padding: '8px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--muted)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  className="hover:border-[var(--brand)] hover:text-[var(--ink)] transition-colors"
                >
                  {app.thumbnail_emoji} {app.title} 상세 →
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
