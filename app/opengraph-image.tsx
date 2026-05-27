/**
 * 홈/기본 OG 이미지 — /opengraph-image
 *
 * Next.js 16 ImageResponse 사용. Edge runtime 호환을 위해 한글 폰트 로딩을 하지 않고
 * 영문 브랜드 + 영문 태그라인으로 구성한다. (Edge에서 한글 폰트를 로딩하면
 * 빌드 시 또는 런타임에 실패하는 케이스가 있음 — 안전 우선)
 */

import { ImageResponse } from 'next/og';

export const alt = 'Launchings — Korean Builder Showcase';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0d0f1a 0%, #111827 50%, #0f172a 100%)',
          position: 'relative',
        }}
      >
        {/* 배경 글로우 */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 800,
            height: 500,
            background:
              'radial-gradient(closest-side, rgba(108,140,255,0.18), transparent 70%)',
            borderRadius: '50%',
          }}
        />

        {/* 브랜드 로고 + 이름 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 28,
          }}
        >
          {/* dot 로고 */}
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6C8CFF, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 32px rgba(108,140,255,0.5)',
            }}
          />
          <span
            style={{
              fontSize: 54,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-1px',
            }}
          >
            Launchings
          </span>
        </div>

        {/* 태그라인 */}
        <div
          style={{
            fontSize: 26,
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: 700,
            lineHeight: 1.4,
            marginBottom: 40,
          }}
        >
          Korean 0→1 Builder Showcase
        </div>

        {/* 하단 배지 */}
        <div
          style={{
            display: 'flex',
            gap: 12,
          }}
        >
          {['Apps', 'Makers', 'Discovery'].map((label) => (
            <div
              key={label}
              style={{
                background: 'rgba(108,140,255,0.15)',
                border: '1px solid rgba(108,140,255,0.3)',
                borderRadius: 8,
                padding: '8px 18px',
                fontSize: 15,
                color: '#818cf8',
                fontWeight: 600,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* 도메인 */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            fontSize: 16,
            color: '#475569',
          }}
        >
          launchings.io
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
