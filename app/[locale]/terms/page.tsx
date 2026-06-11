/**
 * 이용약관 페이지 — /ko/terms
 *
 * 본 문서는 일반 템플릿이며 실제 적용 전 법률 전문가 검토를 권장합니다.
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
    url: 'https://www.launchings.io/ko/terms',
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
            본 문서는 일반 템플릿이며 실제 적용 전 법률 전문가 검토를 권장합니다.
          </div>

          <div
            style={{
              color: 'var(--muted)',
              fontSize: 13,
              marginBottom: 32,
              lineHeight: 1.6,
            }}
          >
            <p>시행일: 2026년 5월 28일</p>
            <p>최종 수정일: 2026년 6월 11일</p>
            <p>운영자: 런칭스 운영자</p>
            <p>
              연락처:{' '}
              <a href="mailto:tuktuk.app.dev@gmail.com" style={{ color: 'var(--brand)' }}>
                tuktuk.app.dev@gmail.com
              </a>
              {' '}또는{' '}
              <Link href="/ko/contact" style={{ color: 'var(--brand)' }}>
                문의하기 폼(/ko/contact)
              </Link>
            </p>
          </div>

          <LegalSection title="제1조 (목적 및 정의)">
            <p style={{ marginBottom: 12 }}>
              본 약관은 <strong>Launchings(런칭스)</strong>(이하 &ldquo;서비스&rdquo;)가 제공하는
              AI 앱 쇼케이스·디스커버리 플랫폼의 이용에 관한 조건, 절차,
              이용자와 운영자의 권리·의무·책임사항 등을 규정함을 목적으로 합니다.
            </p>
            <p>본 약관에서 사용하는 주요 용어의 정의는 다음과 같습니다.</p>
            <ol style={{ paddingLeft: 20, lineHeight: 2, marginTop: 8 }}>
              <li>
                <strong>서비스</strong>: 운영자가 인터넷을 통해 제공하는 Launchings 웹사이트(launchings.io) 및 관련 기능 일체.
              </li>
              <li>
                <strong>이용자</strong>: 본 약관에 동의하고 서비스를 이용하는 모든 자(비회원 포함).
              </li>
              <li>
                <strong>회원</strong>: 서비스에 이메일 또는 소셜 계정으로 가입하여 계정을 보유한 이용자.
              </li>
              <li>
                <strong>메이커(Maker)</strong>: 서비스에 앱을 직접 등록한 회원.
              </li>
              <li>
                <strong>콘텐츠</strong>: 이용자가 서비스에 등록·게시한 앱 정보(제목, 설명, URL, 스크린샷 등), 리뷰, 기능요청, 댓글, 기타 게시물 일체.
              </li>
              <li>
                <strong>운영자</strong>: 서비스를 기획·운영하는 주체(런칭스 운영자).
              </li>
            </ol>
          </LegalSection>

          <LegalSection title="제2조 (약관의 효력 및 변경)">
            <ol style={{ paddingLeft: 20, lineHeight: 2 }}>
              <li>
                본 약관은 서비스 화면에 게시하거나 이용자에게 공지함으로써 효력이 발생합니다.
              </li>
              <li>
                이용자가 서비스에 가입하거나 서비스를 이용하는 경우 본 약관에 동의한 것으로 간주합니다.
              </li>
              <li>
                운영자는 「약관의 규제에 관한 법률」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 위반하지 않는 범위 내에서 본 약관을 개정할 수 있습니다.
              </li>
              <li>
                약관이 변경되는 경우, 운영자는 변경 적용일 기준 최소 <strong>7일 전</strong>(중요 변경 시 30일 전)에
                서비스 내 공지 또는 이메일을 통해 고지합니다.
              </li>
              <li>
                변경된 약관의 적용일 이후에도 서비스를 계속 이용하는 경우, 변경된 약관에 동의한 것으로 봅니다.
                동의하지 않는 이용자는 서비스 이용을 중단하고 회원 탈퇴를 할 수 있습니다.
              </li>
            </ol>
          </LegalSection>

          <LegalSection title="제3조 (회원 가입 및 계정 관리)">
            <ol style={{ paddingLeft: 20, lineHeight: 2 }}>
              <li>
                이용자는 이메일+비밀번호 또는 Google 계정(OAuth)으로 회원 가입할 수 있습니다.
              </li>
              <li>
                회원 가입 시 <strong>만 14세 이상</strong>이어야 합니다.
                만 14세 미만은 법정대리인의 동의 없이 가입할 수 없으며, 서비스는 만 14세 미만의 가입을 허용하지 않습니다.
              </li>
              <li>
                이용자는 본인의 정확한 정보를 제공해야 하며, 타인의 정보를 도용하거나 허위 정보를 기재해서는 안 됩니다.
              </li>
              <li>
                계정 및 비밀번호의 관리 책임은 이용자 본인에게 있습니다.
                계정 도용이나 보안 침해가 발생한 경우 즉시 운영자에게 통보해야 합니다.
              </li>
              <li>
                이용자는 계정을 타인에게 양도·대여하거나 공동으로 사용할 수 없습니다.
              </li>
              <li>
                회원은 서비스 내 설정 페이지에서 언제든지 회원 탈퇴를 신청할 수 있습니다.
                탈퇴 시 회원 정보 및 관련 데이터는 개인정보처리방침에 따라 처리됩니다.
              </li>
            </ol>
          </LegalSection>

          <LegalSection title="제4조 (서비스의 내용·변경·중단)">
            <ol style={{ paddingLeft: 20, lineHeight: 2 }}>
              <li>
                서비스는 빌더(메이커)가 AI를 활용해 제작한 앱(주로 웹앱)을 등록·공유하고,
                다른 이용자가 둘러보며 추천(업보트), 리뷰, 기능요청, 북마크, 팔로우 등의 상호작용을 할 수 있는 커뮤니티·디스커버리 플랫폼입니다.
                등록된 외부 앱은 서비스 내 iframe으로 실행될 수 있습니다.
              </li>
              <li>
                운영자는 서비스의 내용을 변경·추가·삭제할 수 있으며, 이 경우 변경 사항을 사전에 공지합니다.
                단, 긴급하거나 불가피한 사정이 있는 경우 사후에 공지할 수 있습니다.
              </li>
              <li>
                운영자는 서버 점검, 설비 장애, 천재지변, 기타 부득이한 사유로 서비스를 일시 중단할 수 있으며,
                이 경우 사전 공지를 원칙으로 합니다.
              </li>
              <li>
                서비스는 현재 무료로 제공되며, 유료 기능이 추가될 경우 사전에 별도로 고지합니다.
              </li>
            </ol>
          </LegalSection>

          <LegalSection title="제5조 (이용자 콘텐츠 — 등록 앱·리뷰 등의 책임 및 권리 보증)">
            <p style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
              콘텐츠를 등록·게시하는 이용자(메이커 포함)는 다음 각 호를 보증하고, 이에 전적인 책임을 집니다.
            </p>
            <ol style={{ paddingLeft: 20, lineHeight: 2 }}>
              <li>
                등록하는 콘텐츠(앱, 설명글, 스크린샷, 리뷰, 기능요청 등)를 <strong>직접 제작하였거나 게시할 적법한 권리</strong>를 보유하고 있음.
              </li>
              <li>
                해당 콘텐츠가 제3자의 저작권, 특허권, 상표권, 영업비밀, 초상권, 기타 지식재산권을 침해하지 않음.
              </li>
              <li>
                콘텐츠에 악성코드, 피싱 요소, 스파이웨어, 랜섬웨어, 크립토재킹 스크립트 등 유해 요소가 포함되지 않음.
              </li>
              <li>
                콘텐츠가 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」, 「저작권법」, 「개인정보 보호법」 등 관련 법령을 위반하지 않음.
              </li>
            </ol>
            <p style={{ marginTop: 12 }}>
              제3자의 저작권 기타 권리를 침해하여 발생하는 <strong>모든 민·형사상 책임은 해당 이용자에게 있으며,
              운영자는 이에 대한 어떠한 책임도 지지 않습니다.</strong>
              운영자는 이러한 분쟁으로 인해 손해를 입은 경우, 해당 이용자에게 손해배상을 청구할 수 있습니다.
            </p>
            <p style={{ marginTop: 12 }}>
              이용자가 서비스에 등록한 콘텐츠의 저작권은 해당 이용자에게 귀속됩니다.
              다만 이용자는 서비스 운영·홍보·개선 목적으로 운영자가 해당 콘텐츠를
              복제·배포·전시·수정(포맷 변환 등)할 수 있는 <strong>비독점·무상·전 세계적 라이선스</strong>를 운영자에게 부여합니다.
              이 라이선스는 콘텐츠 삭제 또는 회원 탈퇴 시 종료됩니다(단, 운영자가 이미 공유한 범위는 제외).
            </p>
          </LegalSection>

          <LegalSection title="제6조 (금지행위)">
            <p>이용자는 다음 각 호의 행위를 하여서는 안 됩니다.</p>
            <ol style={{ paddingLeft: 20, lineHeight: 2, marginTop: 8 }}>
              <li>악성코드, 피싱 페이지, 스파이웨어, 랜섬웨어 등 유해 소프트웨어를 등록·배포하는 행위</li>
              <li>타인의 저작물·브랜드·서비스를 무단으로 도용하거나 위장·사칭하는 행위</li>
              <li>스팸성 콘텐츠 반복 등록, 어뷰징을 통한 추천수 또는 통계 조작</li>
              <li>타 이용자에 대한 허위 신고, 명예 훼손, 개인정보 무단 수집·유포</li>
              <li>서비스 시스템에 대한 해킹, 무단 크롤링, 서비스 방해(DDoS 등) 행위</li>
              <li>타인의 계정을 도용하거나 타인을 사칭하는 행위</li>
              <li>영리 목적의 광고성 게시물을 무단으로 게시하는 행위</li>
              <li>미성년자에게 유해한 콘텐츠를 등록하거나 제공하는 행위</li>
              <li>관계 법령(저작권법, 정보통신망법, 개인정보 보호법 등)에 위반하는 일체의 행위</li>
              <li>그 외 공공질서 또는 미풍양속에 반하거나, 서비스의 정상적인 운영을 저해하는 행위</li>
            </ol>
          </LegalSection>

          <LegalSection title="제7조 (게시물 관리·삭제·신고 및 테이크다운 절차)">
            <ol style={{ paddingLeft: 20, lineHeight: 2 }}>
              <li>
                운영자는 본 약관 및 관련 법령에 위반되는 콘텐츠를 사전 통지 없이 삭제하거나 비공개 처리할 수 있습니다.
              </li>
              <li>
                이용자는 각 앱·게시물 상세 페이지의 &ldquo;신고&rdquo; 기능을 통해 약관 위반 콘텐츠를 신고할 수 있습니다.
                신고 내용: 위반 사유, 근거 자료 등.
              </li>
              <li>
                운영자는 신고 접수 후 검토하여 위반이 확인된 경우 즉시 해당 콘텐츠를 비공개 처리하고,
                콘텐츠 등록자에게 소명 기회를 부여합니다. 소명이 타당한 경우 재공개합니다.
              </li>
              <li>
                한국 저작권법 및 「정보통신망법」상 임시조치 요청은
                <Link href="/ko/contact" style={{ color: 'var(--brand)', marginLeft: 4 }}>
                  문의하기
                </Link>를 통해 접수해 주십시오.
                저작권자임을 증명하는 자료(저작권 등록증 등)와 함께 침해 사실을 명시하여 요청하시면 신속히 처리합니다.
              </li>
              <li>
                악의적 허위 신고는 이용 제한의 사유가 될 수 있습니다.
              </li>
            </ol>
          </LegalSection>

          <LegalSection title="제8조 (면책 및 책임 제한)">
            <ol style={{ paddingLeft: 20, lineHeight: 2 }}>
              <li>
                서비스에 등록된 외부 링크 및 iframe으로 임베드되는 앱은 제3자가 제공하는 콘텐츠입니다.
                <strong> 운영자는 해당 외부 콘텐츠의 정확성·안전성·적법성·보안에 대해 어떠한 보증도 하지 않으며,
                이로 인해 발생하는 손해에 대해 책임을 지지 않습니다.</strong>
                이용자는 외부 앱 이용 시 해당 앱의 운영자가 정한 별도의 이용약관과 정책을 확인해야 합니다.
              </li>
              <li>
                이용자가 서비스를 통해 등록하거나 접근한 콘텐츠로 인해 발생하는 손해에 대해
                운영자는 고의 또는 중과실이 없는 한 책임을 지지 않습니다.
              </li>
              <li>
                서비스는 현재 무료로 제공됩니다. 운영자는 서비스의 중단·변경·종료로 인한 손해에 대해
                관련 법령이 허용하는 범위 내에서 책임을 제한할 수 있습니다.
              </li>
              <li>
                천재지변, 전쟁, 폭동, 파업, 서버 인프라 장애 등 운영자의 합리적 통제 범위를 벗어난 사유로
                서비스가 제공되지 못한 경우 운영자는 책임을 지지 않습니다.
              </li>
              <li>
                운영자는 이용자 간, 또는 이용자와 제3자 간에 발생한 분쟁에 대해 개입하거나
                이에 대해 책임을 지지 않습니다.
              </li>
            </ol>
          </LegalSection>

          <LegalSection title="제9조 (분쟁해결 및 준거법)">
            <ol style={{ paddingLeft: 20, lineHeight: 2 }}>
              <li>
                본 약관은 <strong>대한민국 법률</strong>에 따라 해석·적용됩니다.
              </li>
              <li>
                서비스 이용과 관련하여 발생한 분쟁은 먼저 운영자와 이용자 간의 협의를 통해 해결하도록 노력합니다.
              </li>
              <li>
                협의가 이루어지지 않는 경우, <strong>서울중앙지방법원</strong>을 제1심 관할법원으로 합니다.
              </li>
            </ol>
          </LegalSection>

          <LegalSection title="제10조 (시행일)">
            <p>
              본 약관은 <strong>2026년 5월 28일</strong>부터 시행됩니다.
              이전 약관은 본 약관 시행일부터 효력을 상실합니다.
              최종 수정일: <strong>2026년 6월 11일</strong>.
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
