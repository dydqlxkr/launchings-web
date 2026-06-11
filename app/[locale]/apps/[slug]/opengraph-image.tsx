/**
 * 앱 상세 동적 OG 이미지 — /ko/apps/[slug]/opengraph-image
 *
 * Next.js 16 ImageResponse + 동적 params.
 * 한글 깨짐 방지를 위해 앱 제목/태그라인은 최대한 짧게 잘라 영문 영역과 혼용.
 * 실제 한글 폰트(Noto Sans KR 등)를 TTF로 로컬에 두지 않으므로
 * 한글이 깨질 수 있는 경우를 고려해 핵심 레이아웃은 영문 fallback으로도 읽히도록 구성.
 */

import { ImageResponse } from 'next/og';
import { getRepo } from '@/lib/repo';

// 앱 정보가 바뀔 수 있으므로 1시간 주기 재검증
export const revalidate = 3600;

export const alt = 'Launchings App';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;

  // generateStaticParams 패턴과 동일: 빌드 타임에는 localRepo 폴백
  let title = 'App on Launchings';
  let tagline = 'Korean 0→1 Builder Showcase';
  let makerName = '';
  let emoji = '🚀';

  try {
    const repo = getRepo();
    const app = await repo.getAppBySlug(slug);
    if (app) {
      title = app.title ?? title;
      tagline = app.tagline ?? tagline;
      makerName = app.author?.display_name ?? '';
      emoji = app.thumbnail_emoji ?? emoji;
    }
  } catch {
    // 빌드 타임 쿠키 컨텍스트 없을 때 폴백
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0d0f1a 0%, #111827 50%, #0f172a 100%)',
          position: 'relative',
          padding: '60px 72px',
        }}
      >
        {/* 배경 글로우 */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 500,
            height: 500,
            background:
              'radial-gradient(closest-side, rgba(108,140,255,0.14), transparent 70%)',
            borderRadius: '50%',
          }}
        />

        {/* 상단: 브랜드 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 'auto',
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6C8CFF, #a855f7)',
            }}
          />
          <span style={{ fontSize: 22, color: '#94a3b8', fontWeight: 700 }}>
            Launchings
          </span>
        </div>

        {/* 중앙: 앱 정보 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* 이모지 + 앱 제목 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
            }}
          >
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 24,
                background: 'rgba(108,140,255,0.15)',
                border: '1px solid rgba(108,140,255,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 52,
                flexShrink: 0,
              }}
            >
              {emoji}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontSize: 52,
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '-1px',
                  lineHeight: 1.1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 850,
                }}
              >
                {title}
              </div>
              {tagline && (
                <div
                  style={{
                    fontSize: 22,
                    color: '#94a3b8',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 850,
                  }}
                >
                  {tagline}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 하단: 제작자 + 도메인 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'auto',
            paddingTop: 28,
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {makerName ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6C8CFF, #a855f7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  color: '#fff',
                  fontWeight: 700,
                }}
              >
                {makerName.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: 18, color: '#94a3b8' }}>{makerName}</span>
            </div>
          ) : (
            <div />
          )}
          <span style={{ fontSize: 16, color: '#475569' }}>launchings.io</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
