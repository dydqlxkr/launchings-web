/**
 * 이용약관 페이지 — /ko/terms
 *
 * ⚠️ 이 약관은 참고용 초안입니다. 실제 법적 효력을 위해서는 법률 전문가의 검토가 필요합니다.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import NavbarServer from '@/components/NavbarServer';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: '이용약관',
  description: 'Launchings 서비스 이용약관. 플랫폼 이용 조건, 업로더 책임, 저작권 정책 등을 확인하세요.',
  alternates: {
    canonical: '/ko/terms',
  },
  openGraph: {
    title: '이용약관 | Launchings',
    description: 'Launchings 서비스 이용약관. 플랫폼 이용 조건, 업로더 책임, 저작권 정책 등을 확인하세요.',
    url: 'https://launchings.io/ko/terms',
    siteName: 'Launchings',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '이용약관 | Launchings',
    description: 'Launchings 서비스 이용약관',
  },
  robots: {
    index: true,
    follow: false,
  },
};

// 정적 페이지 — 빌드 타임 생성
export const dynamic = 'force-static';

export default function TermsPage() {
  return (
    <>
      <NavbarServer />
      <main style={{ flex: 1 }}>
        <div
          style={{
            maxWidth: 720,
            margin: '0 auto',
            padding: '40px 24px 80px',
          }}
        >
          {/* 뒤로 가기 */}
          <Link
            href="/ko"
            style={{
              color: 'var(--muted)',
              fontSize: 13,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 32,
            }}
          >
            ← 홈으로
          </Link>

          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: '-.5px',
              marginBottom: 8,
            }}
          >
            이용약관
          </h1>

          {/* 법적 효력 고지 */}
          <div
            style={{
              background: 'rgba(255,180,0,.08)',
              border: '1px solid rgba(255,180,0,.25)',
              borderRadius: 10,
              padding: '12px 16px',
              fontSize: 13,
              color: '#c8a000',
              marginBottom: 28,
              lineHeight: 1.6,
            }}
          >
            ⚠️ 이 약관은 참고용 초안입니다. 실제 법적 효력을 위해서는 법률 전문가의 검토가 필요합니다.
          </div>

          <div
            style={{
              color: 'var(--muted)',
              fontSize: 13,
              marginBottom: 32,
              lineHeight: 1.6,
            }}
          >
            <p>시행일: [YYYY년 MM월 DD일] (placeholder)</p>
            <p>운영자: [운영자명 placeholder]</p>
            <p>연락처: [이메일 placeholder]</p>
          </div>

          <LegalSection title="제1조 (목적)">
            <p>
              본 약관은 Launchings(이하 &ldquo;서비스&rdquo;)가 제공하는 창작 앱 쇼케이스·디스커버리 플랫폼 이용에 관한 조건 및 절차,
              이용자와 서비스 운영자의 권리·의무·책임사항 등을 규정함을 목적으로 합니다.
            </p>
          </LegalSection>

          <LegalSection title="제2조 (서비스 성격)">
            <p>
              Launchings는 이용자가 직접 제작한 앱·도구·소프트웨어(이하 &ldquo;콘텐츠&rdquo;)를
              공개하고 커뮤니티로부터 피드백을 받을 수 있는 디스커버리 플랫폼입니다.
              서비스는 콘텐츠의 운반자(common carrier) 역할을 하며,
              개별 콘텐츠의 정확성·적법성·안전성을 보증하지 않습니다.
            </p>
          </LegalSection>

          <LegalSection title="제3조 (업로더 책임 및 저작권 보증)">
            <p style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
              콘텐츠를 등록하는 이용자(업로더)는 다음 각 호를 보증합니다.
            </p>
            <ol style={{ paddingLeft: 20, lineHeight: 2 }}>
              <li>
                등록하는 콘텐츠(앱, 설명글, 이미지 등)를 <strong>직접 제작하였거나 게시할 적법한 권리</strong>를 보유하고 있음.
              </li>
              <li>
                해당 콘텐츠가 제3자의 저작권, 특허권, 상표권, 영업비밀, 기타 지식재산권을 침해하지 않음.
              </li>
              <li>
                콘텐츠에 악성코드, 피싱 요소, 스파이웨어, 랜섬웨어 등 유해 요소가 포함되지 않음.
              </li>
            </ol>
            <p style={{ marginTop: 12 }}>
              제3자의 저작권 기타 권리를 침해하여 발생하는 <strong>모든 민·형사상 책임은 해당 업로더에게 있으며,
              운영자는 이에 대한 책임을 지지 않습니다.</strong>
            </p>
          </LegalSection>

          <LegalSection title="제4조 (금지행위)">
            <p>이용자는 다음 각 호의 행위를 하여서는 안 됩니다.</p>
            <ol style={{ paddingLeft: 20, lineHeight: 2, marginTop: 8 }}>
              <li>악성코드, 피싱 페이지, 스파이웨어 등 유해 소프트웨어 배포</li>
              <li>타인의 저작물·브랜드·서비스를 무단으로 도용하거나 위장하는 행위</li>
              <li>스팸성 콘텐츠 반복 등록, 어뷰징을 통한 추천수 조작</li>
              <li>타 이용자에 대한 허위 신고, 명예 훼손, 개인정보 침해</li>
              <li>서비스 시스템에 대한 해킹, 크롤링 남용, 서비스 방해 행위</li>
              <li>관계 법령(저작권법, 정보통신망법, 개인정보 보호법 등)에 위반하는 행위</li>
            </ol>
          </LegalSection>

          <LegalSection title="제5조 (신고 및 테이크다운 절차)">
            <p>
              저작권 침해, 악성 콘텐츠 등 본 약관 위반 콘텐츠는 각 앱 상세 페이지의
              &ldquo;신고&rdquo; 기능을 통해 신고할 수 있습니다.
            </p>
            <ol style={{ paddingLeft: 20, lineHeight: 2, marginTop: 8 }}>
              <li>신고 접수 후 운영자가 검토하며, 위반이 확인된 경우 해당 콘텐츠를 즉시 비공개 처리합니다.</li>
              <li>콘텐츠 제작자에게 소명 기회를 부여하고, 소명이 타당하면 재공개합니다.</li>
              <li>
                한국 저작권법 및 정보통신망법상 임시조치 요청은 [연락처 placeholder]로 문의하십시오.
                저작권자임을 증명하는 자료와 함께 요청하시면 신속히 처리합니다.
              </li>
              <li>악의적 허위 신고는 이용 제한의 사유가 됩니다.</li>
            </ol>
          </LegalSection>

          <LegalSection title="제6조 (콘텐츠 라이선스)">
            <p>
              이용자가 서비스에 등록한 콘텐츠의 저작권은 해당 이용자에게 귀속됩니다.
              다만 이용자는 서비스 운영·홍보·서비스 개선 목적으로 서비스가 해당 콘텐츠를
              복제·배포·전시·수정(포맷 변환 등)할 수 있는 비독점·무상 라이선스를 서비스에 부여합니다.
            </p>
          </LegalSection>

          <LegalSection title="제7조 (서비스 이용 계정)">
            <p>
              서비스 이용을 위해 이메일 또는 소셜 계정(Google 등)으로 가입할 수 있습니다.
              계정 정보의 관리 책임은 이용자 본인에게 있으며,
              타인에게 계정을 양도·대여하거나 공동 사용할 수 없습니다.
            </p>
          </LegalSection>

          <LegalSection title="제8조 (서비스 제한 및 종료)">
            <p>
              운영자는 다음 각 호의 경우 사전 통지 없이 이용자의 서비스 이용을 제한하거나
              계정을 삭제할 수 있습니다.
            </p>
            <ol style={{ paddingLeft: 20, lineHeight: 2, marginTop: 8 }}>
              <li>본 약관 위반이 확인된 경우</li>
              <li>타 이용자 또는 제3자의 권리를 침해한 경우</li>
              <li>서비스 운영을 고의로 방해한 경우</li>
            </ol>
          </LegalSection>

          <LegalSection title="제9조 (면책 조항)">
            <ol style={{ paddingLeft: 20, lineHeight: 2 }}>
              <li>
                서비스에 등록된 외부 링크 및 임베드 앱은 제3자가 제공하는 콘텐츠로,
                <strong> 런칭스는 해당 콘텐츠의 정확성·안전성·적법성을 보증하지 않습니다.</strong>
              </li>
              <li>
                이용자가 서비스를 통해 등록하거나 접근한 콘텐츠로 인해 발생하는 손해에 대해
                운영자는 고의 또는 중과실이 없는 한 책임을 지지 않습니다.
              </li>
              <li>
                서비스는 무료로 제공되며, 서비스의 중단·변경·종료로 인한 손해에 대해
                운영자는 특별히 보증하지 않습니다.
              </li>
            </ol>
          </LegalSection>

          <LegalSection title="제10조 (약관 변경)">
            <p>
              운영자는 필요한 경우 본 약관을 변경할 수 있으며,
              변경 시 서비스 내 공지 또는 이메일로 7일 전 고지합니다.
              변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.
            </p>
          </LegalSection>

          <LegalSection title="제11조 (준거법 및 관할)">
            <p>
              본 약관은 대한민국 법률에 따라 해석·적용되며,
              서비스와 이용자 간의 분쟁은 서울중앙지방법원을 제1심 관할법원으로 합니다.
            </p>
          </LegalSection>

          <div
            style={{
              marginTop: 48,
              paddingTop: 20,
              borderTop: '1px solid var(--line)',
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <Link
              href="/ko/privacy"
              style={{ color: 'var(--brand)', fontSize: 13 }}
            >
              개인정보처리방침 보기 →
            </Link>
            <Link
              href="/ko"
              style={{ color: 'var(--muted)', fontSize: 13 }}
            >
              홈으로 →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2
        style={{
          fontSize: 16,
          fontWeight: 800,
          marginBottom: 12,
          color: 'var(--ink)',
        }}
      >
        {title}
      </h2>
      <div
        style={{
          fontSize: 14,
          color: '#cfd6e4',
          lineHeight: 1.8,
        }}
      >
        {children}
      </div>
    </section>
  );
}
