/**
 * 개인정보처리방침 페이지 — /ko/privacy
 *
 * ⚠️ 이 방침은 참고용 초안입니다. 실제 법적 효력을 위해서는 법률 전문가의 검토가 필요합니다.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import NavbarServer from '@/components/NavbarServer';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description: 'Launchings 개인정보처리방침. 수집 항목, 이용 목적, 보유 기간, 제3자 제공 여부를 확인하세요.',
  alternates: {
    canonical: '/ko/privacy',
  },
  openGraph: {
    title: '개인정보처리방침 | Launchings',
    description: 'Launchings 개인정보처리방침. 수집 항목, 이용 목적, 보유 기간 등을 확인하세요.',
    url: 'https://launchings.io/ko/privacy',
    siteName: 'Launchings',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '개인정보처리방침 | Launchings',
    description: 'Launchings 개인정보처리방침',
  },
  robots: {
    index: true,
    follow: false,
  },
};

// 정적 페이지 — 빌드 타임 생성
export const dynamic = 'force-static';

export default function PrivacyPage() {
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
            개인정보처리방침
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
            ⚠️ 이 방침은 참고용 초안입니다. 실제 법적 효력을 위해서는 법률 전문가의 검토가 필요합니다.
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
            <p>개인정보처리자: [운영자명 placeholder]</p>
            <p>연락처: [이메일 placeholder]</p>
          </div>

          <LegalSection title="제1조 (개인정보의 수집 항목 및 수집 방법)">
            <p style={{ marginBottom: 12 }}>
              Launchings(이하 &ldquo;서비스&rdquo;)는 다음의 개인정보를 수집합니다.
            </p>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 13,
              }}
            >
              <thead>
                <tr>
                  <Th>수집 항목</Th>
                  <Th>수집 목적</Th>
                  <Th>수집 방법</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td>이메일 주소</Td>
                  <Td>회원 식별, 로그인 링크 발송, 공지 안내</Td>
                  <Td>이메일 입력, OAuth 연동</Td>
                </tr>
                <tr>
                  <Td>프로필 정보 (이름, 아바타 이미지)</Td>
                  <Td>메이커 프로필 표시</Td>
                  <Td>소셜 로그인 제공자(Google 등)에서 수신</Td>
                </tr>
                <tr>
                  <Td>업로드 콘텐츠 (앱 설명, 이미지)</Td>
                  <Td>서비스 내 공개 표시</Td>
                  <Td>이용자 직접 입력·업로드</Td>
                </tr>
                <tr>
                  <Td>서비스 이용 기록 (추천, 신고 등)</Td>
                  <Td>서비스 기능 제공, 어뷰징 방지</Td>
                  <Td>서비스 이용 시 자동 수집</Td>
                </tr>
                <tr>
                  <Td>접속 로그 (IP, 브라우저 정보)</Td>
                  <Td>보안, 분쟁 해결</Td>
                  <Td>서버 자동 수집</Td>
                </tr>
              </tbody>
            </table>
            <p style={{ marginTop: 12, color: 'var(--muted)', fontSize: 12 }}>
              * 서비스는 민감정보(주민등록번호, 신용카드 번호 등)를 수집하지 않습니다.
            </p>
          </LegalSection>

          <LegalSection title="제2조 (개인정보의 이용 목적)">
            <ol style={{ paddingLeft: 20, lineHeight: 2 }}>
              <li>회원 가입 및 로그인 처리</li>
              <li>앱 등록·업보트·신고 등 서비스 기능 제공</li>
              <li>서비스 운영·개선 및 신규 기능 개발</li>
              <li>이용 약관 위반 행위 감지 및 처리</li>
              <li>법령상 의무 이행</li>
            </ol>
          </LegalSection>

          <LegalSection title="제3조 (개인정보의 보유 및 파기)">
            <p style={{ marginBottom: 12 }}>
              서비스는 개인정보 수집·이용 목적이 달성된 후 해당 정보를 지체 없이 파기합니다.
              단, 관계 법령에 따라 보존해야 하는 경우에는 해당 기간 동안 보관합니다.
            </p>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 13,
              }}
            >
              <thead>
                <tr>
                  <Th>항목</Th>
                  <Th>보유 기간</Th>
                  <Th>근거</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td>회원 정보</Td>
                  <Td>탈퇴 후 즉시 삭제</Td>
                  <Td>개인정보 보호법</Td>
                </tr>
                <tr>
                  <Td>서비스 이용 기록, 접속 로그</Td>
                  <Td>3개월</Td>
                  <Td>통신비밀보호법</Td>
                </tr>
                <tr>
                  <Td>전자상거래 관련 기록 (해당 시)</Td>
                  <Td>5년</Td>
                  <Td>전자상거래법</Td>
                </tr>
              </tbody>
            </table>
          </LegalSection>

          <LegalSection title="제4조 (개인정보 처리위탁)">
            <p style={{ marginBottom: 12 }}>
              서비스는 원활한 운영을 위해 다음과 같이 개인정보 처리를 위탁합니다.
            </p>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 13,
              }}
            >
              <thead>
                <tr>
                  <Th>수탁자</Th>
                  <Th>위탁 업무</Th>
                  <Th>위탁 정보</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td>Supabase Inc. (미국)</Td>
                  <Td>DB 호스팅, 인증, 파일 저장</Td>
                  <Td>이메일, 프로필, 업로드 콘텐츠</Td>
                </tr>
                <tr>
                  <Td>Vercel Inc. (미국)</Td>
                  <Td>웹 서비스 호스팅, CDN</Td>
                  <Td>접속 로그(IP, 브라우저 정보)</Td>
                </tr>
              </tbody>
            </table>
            <p style={{ marginTop: 12, lineHeight: 1.7 }}>
              수탁자(Supabase, Vercel)의 서버는 미국에 소재할 수 있습니다.
              이용자의 개인정보가 국외로 이전될 수 있으며,
              각 수탁자는 GDPR·CCPA 등 국제 개인정보 보호 기준을 준수합니다.
              개인정보의 국외 이전에 동의하지 않으시면 서비스를 이용하실 수 없습니다.
            </p>
          </LegalSection>

          <LegalSection title="제5조 (개인정보의 제3자 제공)">
            <p>
              서비스는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.
              단, 다음 각 호의 경우는 예외로 합니다.
            </p>
            <ol style={{ paddingLeft: 20, lineHeight: 2, marginTop: 8 }}>
              <li>법령의 규정에 따르거나 수사기관의 적법한 요청이 있는 경우</li>
              <li>이용자의 생명·신체·재산을 보호하기 위한 긴급한 경우</li>
            </ol>
          </LegalSection>

          <LegalSection title="제6조 (이용자의 권리)">
            <p>이용자는 다음의 권리를 행사할 수 있습니다.</p>
            <ol style={{ paddingLeft: 20, lineHeight: 2, marginTop: 8 }}>
              <li>개인정보 열람 요청</li>
              <li>오류 정정 요청</li>
              <li>삭제 요청 (단, 법령에 따라 보관이 필요한 경우 제외)</li>
              <li>처리 정지 요청</li>
            </ol>
            <p style={{ marginTop: 12 }}>
              위 권리 행사는 [연락처 placeholder]로 이메일 문의하시면 처리해 드립니다.
            </p>
          </LegalSection>

          <LegalSection title="제7조 (쿠키 및 자동 수집 정보)">
            <p>
              서비스는 로그인 세션 유지를 위해 쿠키(Cookie)를 사용합니다.
              브라우저 설정에서 쿠키를 비활성화할 수 있으나,
              이 경우 로그인이 필요한 기능을 이용하실 수 없습니다.
            </p>
          </LegalSection>

          <LegalSection title="제8조 (개인정보 보호 책임자)">
            <p>
              개인정보 처리에 관한 불만, 피해 구제 및 문의사항은 아래로 연락주세요.
            </p>
            <div style={{ marginTop: 12, lineHeight: 2 }}>
              <p>개인정보 보호 책임자: [담당자명 placeholder]</p>
              <p>연락처: [이메일 placeholder]</p>
            </div>
            <p style={{ marginTop: 12 }}>
              개인정보 침해에 대한 구제를 위해 개인정보분쟁조정위원회(1833-6972),
              개인정보침해신고센터(privacy.kisa.or.kr)에 신고하실 수 있습니다.
            </p>
          </LegalSection>

          <LegalSection title="제9조 (방침 변경)">
            <p>
              본 개인정보처리방침은 법령·정책 변경 또는 서비스 변경 시 개정될 수 있습니다.
              변경 시 서비스 내 공지 또는 이메일로 7일 전 고지합니다.
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
              href="/ko/terms"
              style={{ color: 'var(--brand)', fontSize: 13 }}
            >
              이용약관 보기 →
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

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        background: 'var(--chip)',
        border: '1px solid var(--line)',
        padding: '8px 12px',
        fontSize: 12,
        fontWeight: 700,
        color: 'var(--muted)',
        textAlign: 'left',
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td
      style={{
        border: '1px solid var(--line)',
        padding: '8px 12px',
        fontSize: 13,
        color: '#cfd6e4',
        verticalAlign: 'top',
      }}
    >
      {children}
    </td>
  );
}
