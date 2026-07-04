/**
 * 공유 유효성 검사 상수 및 헬퍼.
 * 서버/클라이언트 양쪽에서 사용 가능 (순수 JS — 외부 의존 없음).
 */

/**
 * 외부 URL이 안전한 스킴(https: 또는 http:)인지 검증.
 *
 * - new URL() 파싱 실패 → false
 * - javascript:, data:, vbscript: 등 비-HTTP 스킴 → false
 * - https: 또는 http: → true
 *
 * 렌더 가드 및 Server Action 저장 전 모두 이 헬퍼를 통해 검증한다.
 */
export function isSafeHttpUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * iframe 데모로 임베드해도 되는 URL인지 검증 (렌더 가드).
 *
 * 데모 iframe은 sandbox에 allow-same-origin을 부여한다(웹앱 데모의
 * IndexedDB/localStorage 동작에 필수 — ADR-0004 개정). cross-origin
 * 콘텐츠에는 일반 iframe과 동등한 격리가 유지되지만, 만약 우리 자신의
 * 도메인을 임베드하면 same-origin이 되어 sandbox 해제·부모 DOM 접근이
 * 가능해지므로 자기 도메인은 반드시 차단한다.
 */
export function isEmbeddableDemoUrl(url: string | null | undefined): boolean {
  if (!isSafeHttpUrl(url)) return false;
  try {
    const host = new URL(url as string).hostname.toLowerCase();
    if (host === 'launchings.io' || host.endsWith('.launchings.io')) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * 외부에서 접속 가능한 "공개" http(s) URL인지 검증 (제출 모더레이션용, P2-8).
 *
 * isSafeHttpUrl(스킴 검증)에 더해 localhost·사설/예약 IP·내부망 호스트를 차단한다.
 * 방문자 브라우저에서 iframe으로 실행되므로, 이런 비공개 주소는 무의미하거나 악용될 수 있다.
 */
export function isPublicHttpUrl(url: string | null | undefined): boolean {
  if (!isSafeHttpUrl(url)) return false;
  try {
    const host = new URL(url as string).hostname.toLowerCase();

    // 로컬/내부망 이름
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) {
      return false;
    }
    // 점 없는 단일 라벨 호스트(예: intranet) — 공개 도메인은 최소 1개의 점을 가진다
    if (!host.includes('.')) return false;

    // IPv4 사설/루프백/링크로컬/예약 범위
    const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (m) {
      const a = Number(m[1]);
      const b = Number(m[2]);
      if (a === 0 || a === 10 || a === 127) return false;
      if (a === 169 && b === 254) return false;
      if (a === 172 && b >= 16 && b <= 31) return false;
      if (a === 192 && b === 168) return false;
      if (a >= 224) return false; // 멀티캐스트/예약
    }

    // IPv6 루프백/링크로컬/유니크로컬
    if (host === '[::1]' || host.startsWith('[fe80') || host.startsWith('[fc') || host.startsWith('[fd')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

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
