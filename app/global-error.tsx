'use client';

/**
 * app/global-error.tsx
 * 루트 레이아웃 자체가 깨질 때 대비한 최후의 에러 바운더리.
 * 반드시 'use client' + 자체 <html><body> 포함 (루트 레이아웃을 대체하므로).
 *
 * Next.js 16: reset prop 이름이 unstable_retry 로 변경됨 (breaking change).
 */

import Link from 'next/link';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

export default function GlobalError({ error, unstable_retry }: GlobalErrorProps) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          background: '#0b0d12',
          color: '#eef1f6',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Pretendard", "Noto Sans KR", sans-serif',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '40px 24px',
          boxSizing: 'border-box',
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(22px, 5vw, 32px)',
            fontWeight: 800,
            lineHeight: 1.3,
            marginBottom: 12,
          }}
        >
          서비스에 문제가 발생했어요
        </h1>

        <p
          style={{
            fontSize: 15,
            color: '#9aa6b8',
            maxWidth: 380,
            lineHeight: 1.7,
            marginBottom: 32,
          }}
        >
          페이지를 불러오는 중 오류가 발생했어요.
          <br />
          새로고침을 시도해 주세요.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={unstable_retry}
            style={{
              background: 'linear-gradient(135deg,#6c8cff,#9b6cff)',
              color: '#fff',
              borderRadius: 12,
              padding: '13px 24px',
              fontSize: 15,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            새로고침
          </button>
          <Link
            href="/ko"
            style={{
              background: 'transparent',
              color: '#eef1f6',
              border: '1px solid #232a36',
              borderRadius: 12,
              padding: '13px 24px',
              fontSize: 15,
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            홈으로
          </Link>
        </div>

        {error.digest && (
          <p
            style={{
              marginTop: 20,
              fontSize: 11,
              color: '#9aa6b8',
              opacity: 0.5,
              fontFamily: 'monospace',
            }}
          >
            {error.digest}
          </p>
        )}
      </body>
    </html>
  );
}
