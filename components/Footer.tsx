import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function Footer() {
  const t = useTranslations();

  return (
    <footer
      style={{
        borderTop: '1px solid var(--line)',
        padding: '40px 0',
        color: 'var(--muted)',
        fontSize: 13,
      }}
    >
      <div className="lp-container">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 20,
          }}
        >
          {/* 로고 + 태그라인 */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontWeight: 800,
                fontSize: 20,
                letterSpacing: '-.5px',
                marginBottom: 8,
                color: 'var(--ink)',
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg,var(--brand),var(--brand2))',
                  display: 'inline-block',
                }}
              />
              {t('nav.brand')}
            </div>
            <div>{t('footer.tagline')}</div>
          </div>

          {/* 링크 */}
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href="/ko/apps" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
              앱 둘러보기
            </Link>
            <a href="#makers" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
              메이커
            </a>
            <a href="#recruit" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
              채용
            </a>
            <Link href="/ko" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
              문의
            </Link>
            <Link href="/ko/terms" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
              이용약관
            </Link>
            <Link href="/ko/privacy" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
              개인정보처리방침
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
