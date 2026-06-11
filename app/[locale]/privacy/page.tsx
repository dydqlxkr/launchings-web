/**
 * 개인정보처리방침 페이지 — /ko/privacy
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
    url: 'https://www.launchings.io/ko/privacy',
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
            <p>개인정보처리자(운영자): 런칭스 운영자</p>
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

          <p style={{ fontSize: 14, color: '#cfd6e4', lineHeight: 1.8, marginBottom: 32 }}>
            <strong>Launchings(런칭스)</strong>(이하 &ldquo;서비스&rdquo;)는 「개인정보 보호법」(이하 &ldquo;PIPA&rdquo;)을 준수하며,
            이용자의 개인정보를 소중히 보호합니다. 본 방침은 서비스가 수집하는 개인정보의 항목,
            수집 및 이용 목적, 보유 기간, 처리위탁 현황, 이용자 권리 등을 안내합니다.
          </p>

          {/* ① 수집 항목 및 방법 */}
          <LegalSection title="제1조 (개인정보의 수집 항목 및 수집 방법)">
            <p style={{ marginBottom: 16 }}>
              서비스는 서비스 제공에 필요한 최소한의 개인정보를 수집합니다.
              서비스는 주민등록번호, 신용카드 번호 등 민감정보를 수집하지 않습니다.
            </p>

            <p style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>1. 필수 수집 항목</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 16 }}>
              <thead>
                <tr>
                  <Th>구분</Th>
                  <Th>수집 항목</Th>
                  <Th>수집 방법</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td>이메일 가입</Td>
                  <Td>이메일 주소, 비밀번호(해시·암호화 저장, 운영자 평문 미보유), 닉네임(표시이름), 사용자 ID(handle)</Td>
                  <Td>회원가입 시 이용자 직접 입력</Td>
                </tr>
                <tr>
                  <Td>Google 소셜 로그인</Td>
                  <Td>Google 계정 이메일, 프로필(이름, 프로필 사진)</Td>
                  <Td>Google OAuth 연동 시 자동 수신</Td>
                </tr>
                <tr>
                  <Td>서비스 이용 기록</Td>
                  <Td>접속 로그(IP 주소, 브라우저 정보, 접속 일시), 세션 쿠키</Td>
                  <Td>서비스 이용 시 서버 자동 수집</Td>
                </tr>
              </tbody>
            </table>

            <p style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>2. 선택 수집 항목</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 16 }}>
              <thead>
                <tr>
                  <Th>수집 항목</Th>
                  <Th>수집 방법</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td>프로필 이미지(아바타), 소개(bio), 웹사이트 URL</Td>
                  <Td>프로필 설정 시 이용자 직접 입력·업로드</Td>
                </tr>
              </tbody>
            </table>

            <p style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>3. 이용 중 생성 정보</p>
            <p>
              서비스 이용 과정에서 다음 정보가 생성·수집됩니다.
            </p>
            <ul style={{ paddingLeft: 20, lineHeight: 2, marginTop: 8 }}>
              <li>등록한 앱 정보(제목, 설명, URL, 스크린샷, 카테고리 등)</li>
              <li>추천(업보트), 북마크, 팔로우 기록</li>
              <li>리뷰, 기능요청, 댓글 내용</li>
              <li>신고·문의 내용</li>
            </ul>
          </LegalSection>

          {/* ② 수집·이용 목적 */}
          <LegalSection title="제2조 (개인정보의 수집 및 이용 목적)">
            <p style={{ marginBottom: 12 }}>서비스는 수집한 개인정보를 다음의 목적으로만 이용합니다.</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <Th>이용 목적</Th>
                  <Th>관련 항목</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td>회원 가입, 본인 확인 및 로그인 처리</Td>
                  <Td>이메일, 비밀번호(해시), 닉네임, 사용자 ID</Td>
                </tr>
                <tr>
                  <Td>메이커 프로필 표시 및 커뮤니티 기능 제공</Td>
                  <Td>닉네임, 프로필 이미지, 소개, 웹사이트 URL</Td>
                </tr>
                <tr>
                  <Td>앱 등록·추천·리뷰·기능요청·북마크·팔로우 등 서비스 핵심 기능 제공</Td>
                  <Td>등록 앱 정보, 이용 기록</Td>
                </tr>
                <tr>
                  <Td>서비스 운영·개선, 신규 기능 개발, 통계 분석</Td>
                  <Td>서비스 이용 기록</Td>
                </tr>
                <tr>
                  <Td>약관 위반 행위 감지, 어뷰징 방지, 분쟁 처리</Td>
                  <Td>접속 로그(IP), 서비스 이용 기록</Td>
                </tr>
                <tr>
                  <Td>공지사항 전달 및 이용자 문의 대응</Td>
                  <Td>이메일</Td>
                </tr>
                <tr>
                  <Td>법령상 의무 이행 및 수사기관 적법 요청 대응</Td>
                  <Td>법령에서 정하는 항목</Td>
                </tr>
              </tbody>
            </table>
          </LegalSection>

          {/* ③ 보유·이용기간 및 파기 */}
          <LegalSection title="제3조 (개인정보의 보유 및 파기)">
            <p style={{ marginBottom: 12 }}>
              서비스는 개인정보 수집·이용 목적이 달성되면 해당 정보를 지체 없이 파기합니다.
              단, 관련 법령에 따라 보존해야 하는 경우에는 해당 기간 동안 보관한 후 파기합니다.
            </p>

            <p style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>1. 회원 탈퇴 시</p>
            <p style={{ marginBottom: 16 }}>
              회원 탈퇴(프로필 설정 메뉴에서 신청 가능) 즉시 계정 및 관련 개인정보를 파기합니다.
              단, 관련 법령에 의한 보존 의무가 있는 항목은 아래 기간 동안 보관 후 파기합니다.
            </p>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 16 }}>
              <thead>
                <tr>
                  <Th>항목</Th>
                  <Th>보유 기간</Th>
                  <Th>근거 법령</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td>회원 정보(이메일, 닉네임 등)</Td>
                  <Td>탈퇴 즉시 삭제</Td>
                  <Td>개인정보 보호법</Td>
                </tr>
                <tr>
                  <Td>접속 로그·IP 기록</Td>
                  <Td>3개월</Td>
                  <Td>통신비밀보호법 제15조의2</Td>
                </tr>
                <tr>
                  <Td>소비자 불만 또는 분쟁 처리 관련 기록</Td>
                  <Td>3년</Td>
                  <Td>전자상거래 등에서의 소비자보호에 관한 법률</Td>
                </tr>
                <tr>
                  <Td>표시·광고에 관한 기록</Td>
                  <Td>6개월</Td>
                  <Td>전자상거래 등에서의 소비자보호에 관한 법률</Td>
                </tr>
              </tbody>
            </table>

            <p style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>2. 파기 방법</p>
            <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
              <li>전자 파일 형태: 재복원 불가능한 방법으로 영구 삭제</li>
              <li>출력물(해당 시): 분쇄 또는 소각</li>
            </ul>
          </LegalSection>

          {/* ④ 제3자 제공 */}
          <LegalSection title="제4조 (개인정보의 제3자 제공)">
            <p>
              서비스는 이용자의 사전 동의 없이 개인정보를 제3자에게 제공하지 않습니다.
              단, 다음 각 호의 경우는 예외로 합니다.
            </p>
            <ol style={{ paddingLeft: 20, lineHeight: 2, marginTop: 8 }}>
              <li>법령의 규정에 따르거나 수사기관의 적법한 요청이 있는 경우</li>
              <li>이용자 또는 제3자의 생명·신체·재산을 보호하기 위해 긴급한 경우로서 동의를 받을 수 없는 때</li>
              <li>통계 작성, 학술 연구 등의 목적으로 특정 개인을 알아볼 수 없는 형태로 제공하는 경우</li>
            </ol>
          </LegalSection>

          {/* ⑤ 처리위탁 및 국외이전 */}
          <LegalSection title="제5조 (개인정보 처리위탁 및 국외이전)">
            <p style={{ marginBottom: 12 }}>
              서비스는 원활한 운영을 위해 아래와 같이 개인정보 처리를 외부에 위탁합니다.
              위탁 시 관련 법령에 따라 위탁 계약을 체결하고, 수탁자가 개인정보를 안전하게 처리하도록 관리·감독합니다.
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 16 }}>
              <thead>
                <tr>
                  <Th>수탁자</Th>
                  <Th>위탁 업무</Th>
                  <Th>이전 항목</Th>
                  <Th>소재 국가</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td>Supabase, Inc.</Td>
                  <Td>데이터베이스 호스팅, 회원 인증(Auth), 파일 스토리지</Td>
                  <Td>이메일, 비밀번호(해시), 닉네임, 프로필 정보, 등록 앱 정보, 이용 기록</Td>
                  <Td>미국(및 기타 AWS 리전)</Td>
                </tr>
                <tr>
                  <Td>Vercel, Inc.</Td>
                  <Td>웹 서비스 호스팅, CDN, 엣지 네트워크</Td>
                  <Td>접속 로그(IP, 브라우저 정보)</Td>
                  <Td>미국(및 전 세계 엣지 노드)</Td>
                </tr>
                <tr>
                  <Td>Google LLC</Td>
                  <Td>Google OAuth 소셜 로그인 제공</Td>
                  <Td>Google 계정 이메일, 프로필(이름, 사진)</Td>
                  <Td>미국</Td>
                </tr>
              </tbody>
            </table>

            <p style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>국외이전 안내</p>
            <p style={{ lineHeight: 1.8 }}>
              상기 수탁자(Supabase, Vercel, Google)의 서버는 대한민국 외부(주로 미국)에 소재합니다.
              이에 따라 이용자의 개인정보가 국외로 이전될 수 있습니다. 각 수탁자는 GDPR, CCPA 등
              국제 개인정보 보호 기준을 준수하며, 표준 계약 조항(SCC) 등 적법한 이전 수단을 활용합니다.
              국외이전에 동의하지 않으시면 서비스 이용이 제한될 수 있습니다.
            </p>
          </LegalSection>

          {/* ⑥ 이용자 권리 */}
          <LegalSection title="제6조 (이용자 및 법정대리인의 권리와 행사 방법)">
            <p style={{ marginBottom: 12 }}>이용자(만 14세 미만의 경우 법정대리인)는 다음의 권리를 행사할 수 있습니다.</p>
            <ol style={{ paddingLeft: 20, lineHeight: 2 }}>
              <li>
                <strong>열람 요청</strong>: 본인이 제공한 개인정보의 처리 현황 확인
              </li>
              <li>
                <strong>정정 요청</strong>: 오류·부정확한 개인정보의 수정 (일부 항목은 서비스 내 프로필 설정에서 직접 수정 가능)
              </li>
              <li>
                <strong>삭제 요청</strong>: 법령에 따른 보존 의무가 없는 개인정보의 삭제 (회원 탈퇴로 처리)
              </li>
              <li>
                <strong>처리정지 요청</strong>: 개인정보 처리의 일시 정지 요청
              </li>
              <li>
                <strong>동의 철회</strong>: 개인정보 수집·이용 동의 철회 (회원 탈퇴로 행사)
              </li>
            </ol>
            <p style={{ marginTop: 12 }}>
              <strong>행사 방법</strong>: 서비스 내 프로필/설정 메뉴에서 직접 처리하거나,{' '}
              <Link href="/ko/contact" style={{ color: 'var(--brand)' }}>문의하기 폼(/ko/contact)</Link>을
              통해 요청 시 10일 이내 처리합니다.
            </p>
            <p style={{ marginTop: 12 }}>
              권리 행사는 이용자 본인 또는 위임을 받은 대리인이 할 수 있습니다.
              대리인이 요청하는 경우 위임장 등 대리인임을 증명하는 자료를 제출해야 합니다.
            </p>
            <p style={{ marginTop: 12 }}>
              개인정보 침해에 대한 구제를 원하시면 아래 기관에 신고할 수 있습니다.
            </p>
            <ul style={{ paddingLeft: 20, lineHeight: 2, marginTop: 8 }}>
              <li>개인정보보호위원회: privacy.go.kr / 국번 없이 182</li>
              <li>한국인터넷진흥원 개인정보침해신고센터: privacy.kisa.or.kr / 국번 없이 118</li>
              <li>개인정보 분쟁조정위원회: kopico.go.kr / 1833-6972</li>
              <li>경찰청 사이버범죄 신고시스템: ecrm.cyber.go.kr</li>
            </ul>
          </LegalSection>

          {/* ⑦ 쿠키 등 자동수집 */}
          <LegalSection title="제7조 (쿠키 및 자동수집 장치)">
            <p style={{ marginBottom: 12 }}>
              서비스는 로그인 세션 유지 및 서비스 보안을 위해 쿠키(Cookie)를 사용합니다.
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 16 }}>
              <thead>
                <tr>
                  <Th>쿠키 종류</Th>
                  <Th>목적</Th>
                  <Th>보유 기간</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td>세션 쿠키 (Supabase Auth)</Td>
                  <Td>로그인 상태 유지, 사용자 인증</Td>
                  <Td>브라우저 세션 종료 시 또는 설정된 만료 시간</Td>
                </tr>
              </tbody>
            </table>
            <p>
              브라우저 설정에서 쿠키를 비활성화할 수 있으나, 이 경우 로그인이 필요한
              서비스 기능(앱 등록, 추천, 리뷰, 북마크 등)을 이용하실 수 없습니다.
              쿠키 설정 방법은 사용하시는 브라우저의 도움말을 참고하시기 바랍니다.
            </p>
            <p style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 8, marginTop: 16 }}>
              방문 통계(Vercel Analytics / Speed Insights)
            </p>
            <p style={{ marginBottom: 8 }}>
              서비스는 서비스 품질 개선 목적으로 <strong>Vercel Analytics</strong> 및
              <strong> Vercel Speed Insights</strong>를 사용합니다.
              이 도구들은 <strong>쿠키를 사용하지 않으며</strong>, 개인 식별이 불가능한
              익명·집계 방식으로만 데이터를 수집합니다.
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 12 }}>
              <thead>
                <tr>
                  <Th>수집 항목</Th>
                  <Th>목적</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td>페이지 URL, 국가 단위 위치(도시·개인 위치 아님), 기기 유형, 브라우저 유형, 리퍼러(직전 페이지 도메인)</Td>
                  <Td>방문 통계 집계, 서비스 개선</Td>
                </tr>
                <tr>
                  <Td>Web Vitals(LCP, CLS, INP 등 페이지 성능 지표)</Td>
                  <Td>페이지 로딩 성능 모니터링·개선</Td>
                </tr>
              </tbody>
            </table>
            <p>
              수집된 데이터는 개인 식별이 불가능한 형태로 처리되며, 광고 목적 또는
              크로스사이트 추적에는 사용되지 않습니다. 처리 위탁 수탁자는
              <strong> Vercel Inc.(미국)</strong>이며, 제5조 처리위탁 현황을 참조하시기 바랍니다.
            </p>
          </LegalSection>

          {/* ⑧ 개인정보 보호책임자 */}
          <LegalSection title="제8조 (개인정보 보호책임자 및 문의처)">
            <p style={{ marginBottom: 12 }}>
              서비스는 이용자의 개인정보 관련 문의, 불만, 피해 구제 처리를 위해 아래와 같이 개인정보 보호책임자를 지정합니다.
            </p>
            <div
              style={{
                background: 'var(--chip)',
                border: '1px solid var(--line)',
                borderRadius: 10,
                padding: '16px 20px',
                lineHeight: 2,
                marginBottom: 16,
              }}
            >
              <p><strong>개인정보 보호책임자</strong>: 런칭스 운영자</p>
              <p>
                <strong>이메일</strong>:{' '}
                <a href="mailto:tuktuk.app.dev@gmail.com" style={{ color: 'var(--brand)' }}>
                  tuktuk.app.dev@gmail.com
                </a>
              </p>
              <p>
                <strong>문의하기</strong>:{' '}
                <Link href="/ko/contact" style={{ color: 'var(--brand)' }}>
                  launchings.io/ko/contact
                </Link>
              </p>
            </div>
            <p>
              개인정보 관련 문의사항은 위 연락처로 접수하시면 <strong>10일 이내</strong>에 답변 드립니다.
            </p>
          </LegalSection>

          {/* ⑨ 고지 의무 */}
          <LegalSection title="제9조 (개인정보처리방침의 변경 고지)">
            <p>
              본 개인정보처리방침은 법령·정책 변경 또는 서비스 변경 시 개정될 수 있습니다.
              내용이 변경될 경우 시행일 기준 <strong>최소 7일 전</strong>에 서비스 내 공지사항 또는
              이메일을 통해 고지합니다. 중요 사항(수집 항목, 이용 목적, 제3자 제공 등) 변경 시에는
              <strong> 30일 전</strong>에 고지합니다.
            </p>
            <p style={{ marginTop: 12 }}>
              이전 버전의 개인정보처리방침이 필요한 경우{' '}
              <Link href="/ko/contact" style={{ color: 'var(--brand)' }}>문의하기</Link>를 통해 요청하실 수 있습니다.
            </p>
          </LegalSection>

          {/* ⑩ 시행일 */}
          <LegalSection title="제10조 (시행일)">
            <p>
              본 개인정보처리방침은 <strong>2026년 5월 28일</strong>부터 시행됩니다.
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
