'use client';

/**
 * HeroCtaSubmit — 히어로 섹션 "등록" CTA 버튼.
 *
 * 로그인 시 /ko/submit, 비로그인 시 #discover로 이동.
 * 깜빡임 방지: 로딩 중(= 비로그인 상태 기본값)에는 #discover href로 렌더하고
 * 텍스트는 변하지 않으므로 시각적 변화가 없다.
 */

import { useSession } from './useSession';

interface Props {
  label: string;
}

export default function HeroCtaSubmit({ label }: Props) {
  const { isLoggedIn } = useSession();

  return (
    <a
      href={isLoggedIn ? '/ko/submit' : '#discover'}
      className="lp-btn lp-btn-ghost"
      style={{ fontSize: 15.5 }}
    >
      {label}
    </a>
  );
}
