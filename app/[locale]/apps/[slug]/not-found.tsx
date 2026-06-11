/**
 * apps/[slug]/not-found.tsx
 * apps/[slug]/page.tsx 에서 notFound() 호출 시 표시.
 * 정적 프리렌더 가능 — cookies()/getCurrentUser 의존 없음.
 */

import Link from 'next/link';

export default function AppNotFound() {
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
      {/* 에러 코드 */}
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

      {/* 제목 */}
      <h1
        style={{
          fontSize: 'clamp(24px, 5vw, 36px)',
          fontWeight: 800,
          lineHeight: 1.3,
          marginBottom: 12,
        }}
      >
        이 앱을 찾을 수 없어요
      </h1>

      {/* 설명 */}
      <p
        style={{
          fontSize: 15,
          color: 'var(--muted)',
          maxWidth: 440,
          lineHeight: 1.7,
          marginBottom: 36,
        }}
      >
        삭제되었거나 비공개로 전환되었을 수 있어요.
        <br />
        다른 작동 제품들을 둘러보세요.
      </p>

      {/* CTA 버튼 */}
      <Link
        href="/ko/apps"
        style={{
          background: 'linear-gradient(135deg,var(--brand),var(--brand2))',
          color: '#fff',
          borderRadius: 12,
          padding: '13px 28px',
          fontSize: 15,
          fontWeight: 700,
          textDecoration: 'none',
          display: 'inline-block',
        }}
      >
        앱 목록으로
      </Link>
    </div>
  );
}
