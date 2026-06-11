/**
 * [locale]/not-found.tsx
 * 로케일 세그먼트 하위에서 notFound()가 호출될 때 표시.
 * 정적 프리렌더 가능 — cookies()/getCurrentUser 의존 없음.
 * next-intl NextIntlClientProvider 컨텍스트 안에 있지만
 * not-found는 컨텍스트 밖에서 렌더될 수 있으므로 한국어 하드코딩.
 */

import Link from 'next/link';

export default function LocaleNotFound() {
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
        페이지를 찾을 수 없어요
      </h1>

      {/* 설명 */}
      <p
        style={{
          fontSize: 15,
          color: 'var(--muted)',
          maxWidth: 400,
          lineHeight: 1.7,
          marginBottom: 36,
        }}
      >
        요청하신 주소가 존재하지 않거나 이동되었을 수 있어요.
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
          href="/ko"
          style={{
            background: 'linear-gradient(135deg,var(--brand),var(--brand2))',
            color: '#fff',
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
        <Link
          href="/ko/apps"
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
          앱 둘러보기
        </Link>
      </div>
    </div>
  );
}
