'use client';

/**
 * [locale]/error.tsx
 * 로케일 세그먼트 하위에서 발생한 미처리 예외를 잡는 에러 바운더리.
 * 반드시 'use client' — React 에러 바운더리는 클라이언트 컴포넌트만 가능.
 *
 * Next.js 16: reset prop 이름이 unstable_retry 로 변경됨 (breaking change).
 */

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorPageProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

export default function LocaleError({ error, unstable_retry }: ErrorPageProps) {
  useEffect(() => {
    console.error('[LocaleError]', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        color: 'var(--ink)',
        textAlign: 'center',
        padding: '40px 24px',
      }}
    >
      {/* 제목 */}
      <h1
        style={{
          fontSize: 'clamp(22px, 5vw, 32px)',
          fontWeight: 800,
          lineHeight: 1.3,
          marginBottom: 12,
        }}
      >
        문제가 발생했어요
      </h1>

      {/* 설명 */}
      <p
        style={{
          fontSize: 15,
          color: 'var(--muted)',
          maxWidth: 400,
          lineHeight: 1.7,
          marginBottom: 32,
        }}
      >
        예기치 않은 오류가 발생했어요. 잠시 후 다시 시도해 주세요.
      </p>

      {/* 액션 버튼 */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: 24,
        }}
      >
        <button
          onClick={unstable_retry}
          style={{
            background: 'linear-gradient(135deg,var(--brand),var(--brand2))',
            color: '#fff',
            borderRadius: 12,
            padding: '13px 24px',
            fontSize: 15,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          다시 시도
        </button>
        <Link
          href="/ko"
          style={{
            background: 'transparent',
            color: 'var(--ink)',
            border: '1px solid var(--line)',
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

      {/* 에러 digest — 디버깅용 식별자. 외부 전송 없음. */}
      {error.digest && (
        <p
          style={{
            fontSize: 11,
            color: 'var(--muted)',
            opacity: 0.6,
            fontFamily: 'monospace',
          }}
        >
          {error.digest}
        </p>
      )}
    </div>
  );
}
