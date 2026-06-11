/**
 * app/not-found.tsx
 * 루트 세그먼트의 404 — [locale]/layout.tsx가 잘못된 로케일로 notFound()를
 * 던질 때 등 로케일 세그먼트 밖에서 매칭 실패 시 표시.
 * 루트 레이아웃(globals.css 로드) 안에서 렌더되므로 CSS 토큰 사용 가능.
 */

import Link from 'next/link';

export default function RootNotFound() {
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
      <p
        style={{
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: '0.12em',
          color: 'var(--muted)',
          textTransform: 'uppercase',
          marginBottom: 16,
        }}
      >
        404
      </p>

      <h1
        style={{
          fontSize: 'clamp(24px, 5vw, 36px)',
          fontWeight: 800,
          lineHeight: 1.3,
          marginBottom: 12,
        }}
      >
        페이지를 찾을 수 없어요
      </h1>

      <p
        style={{
          fontSize: 15,
          color: 'var(--muted)',
          maxWidth: 400,
          lineHeight: 1.7,
          marginBottom: 36,
        }}
      >
        주소가 잘못되었거나 삭제된 페이지일 수 있어요.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/ko" className="lp-btn lp-btn-primary" style={{ fontSize: 15 }}>
          홈으로
        </Link>
        <Link href="/ko/apps" className="lp-btn lp-btn-ghost" style={{ fontSize: 15 }}>
          앱 둘러보기
        </Link>
      </div>
    </div>
  );
}
