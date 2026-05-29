/**
 * 앱이 "신규"인지 판정 — 등록(created_at) 후 7일 이내.
 *
 * 표시 전용(배지)이며 일 단위로 충분히 거칠어, 렌더 중 현재 시각을 읽어도
 * 하이드레이션상 의미 있는 불일치를 만들지 않는다. 현재 시각 읽기를
 * 이 헬퍼로 격리해 컴포넌트 렌더를 순수하게 유지한다.
 */
const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function isNewApp(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;
  return Date.now() - created < NEW_WINDOW_MS;
}
