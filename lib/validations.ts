/**
 * 공유 유효성 검사 상수 및 헬퍼.
 * 서버/클라이언트 양쪽에서 사용 가능 (순수 JS — 외부 의존 없음).
 */

/** handle 허용 규칙: 소문자 영문·숫자·하이픈·언더스코어, 3~20자 */
export const HANDLE_RE = /^[a-z0-9_-]{3,20}$/;

/** 예약어 목록 (라우트 충돌 방지) */
export const RESERVED_HANDLES = new Set([
  'admin',
  'api',
  'auth',
  'settings',
  'submit',
  'compare',
  'apps',
  'makers',
  'privacy',
  'terms',
  'ko',
  'en',
  'support',
  'help',
  'about',
]);

/**
 * handle 유효성 검사 — 오류 문자열 반환, 통과 시 null.
 */
export function validateHandle(handle: string): string | null {
  const trimmed = handle?.trim().toLowerCase();
  if (!trimmed) {
    return '사용자 ID를 입력해 주세요.';
  }
  if (!HANDLE_RE.test(trimmed)) {
    return '사용자 ID는 소문자 영문, 숫자, 하이픈(-), 언더스코어(_)만 사용 가능하며 3~20자여야 합니다.';
  }
  if (RESERVED_HANDLES.has(trimmed)) {
    return '사용할 수 없는 ID입니다. 다른 ID를 입력해 주세요.';
  }
  return null;
}
