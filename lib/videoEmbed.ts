/**
 * 유튜브/Vimeo URL을 임베드 URL로 변환하는 헬퍼.
 *
 * 지원 형식:
 *   YouTube:
 *     - https://www.youtube.com/watch?v=VIDEO_ID
 *     - https://youtu.be/VIDEO_ID
 *     - https://youtube.com/shorts/VIDEO_ID
 *     - https://www.youtube.com/embed/VIDEO_ID (이미 임베드 형식인 경우)
 *   Vimeo:
 *     - https://vimeo.com/123456789
 *     - https://player.vimeo.com/video/123456789 (이미 임베드 형식인 경우)
 *
 * 인식 안 되면 null 반환.
 * ID 추출은 정규식으로 안전하게 — 쿼리스트링·해시·경로 suffix 방어.
 *
 * 서버/클라이언트 양쪽에서 사용 가능 (순수 JS — 외부 의존 없음).
 */

/** YouTube 비디오 ID 정규식: 11자 영문/숫자/하이픈/언더스코어 */
const YT_ID_RE = /^[A-Za-z0-9_-]{11}$/;

/**
 * URL에서 YouTube 비디오 ID를 추출한다.
 * 인식 안 되면 null 반환.
 */
function extractYouTubeId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, '');

  if (host === 'youtube.com' || host === 'm.youtube.com') {
    // /watch?v=ID
    const vParam = parsed.searchParams.get('v');
    if (vParam && YT_ID_RE.test(vParam)) return vParam;

    // /shorts/ID 또는 /embed/ID
    const pathMatch = parsed.pathname.match(/^\/(shorts|embed)\/([A-Za-z0-9_-]{11})/);
    if (pathMatch) return pathMatch[2];
  }

  if (host === 'youtu.be') {
    // youtu.be/ID
    const id = parsed.pathname.slice(1).split('/')[0];
    if (id && YT_ID_RE.test(id)) return id;
  }

  return null;
}

/**
 * URL에서 Vimeo 비디오 ID를 추출한다.
 * 인식 안 되면 null 반환.
 */
function extractVimeoId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, '');

  if (host === 'vimeo.com') {
    // vimeo.com/123456789 (숫자 ID만)
    const idMatch = parsed.pathname.match(/^\/(\d+)/);
    if (idMatch) return idMatch[1];
  }

  if (host === 'player.vimeo.com') {
    // player.vimeo.com/video/123456789 — 이미 임베드 형식
    const idMatch = parsed.pathname.match(/^\/video\/(\d+)/);
    if (idMatch) return idMatch[1];
  }

  return null;
}

/**
 * 입력 URL을 임베드 URL로 변환한다.
 * - YouTube → https://www.youtube.com/embed/{ID}
 * - Vimeo   → https://player.vimeo.com/video/{ID}
 * - 인식 안 되면 null 반환
 */
export function getEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  const ytId = extractYouTubeId(url);
  if (ytId) {
    return `https://www.youtube.com/embed/${ytId}`;
  }

  const vimeoId = extractVimeoId(url);
  if (vimeoId) {
    return `https://player.vimeo.com/video/${vimeoId}`;
  }

  return null;
}

/**
 * URL이 임베드 가능한 YouTube/Vimeo 링크인지 확인.
 * getEmbedUrl과 동일 로직 — 편의 래퍼.
 */
export function isEmbeddableVideoUrl(url: string | null | undefined): boolean {
  return getEmbedUrl(url) !== null;
}
