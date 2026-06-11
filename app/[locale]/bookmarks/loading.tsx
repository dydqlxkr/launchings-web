/**
 * /ko/bookmarks 로딩 스켈레톤.
 * App Router의 loading.tsx — Suspense 경계로 자동 래핑됨.
 */

import { AppGridSkeleton } from '@/components/Skeleton';

export default function BookmarksLoading() {
  return (
    <main style={{ flex: 1, width: '100%' }}>
      <div className="lp-container--md" style={{ paddingTop: 40, paddingBottom: 60 }}>
        {/* 헤더 스켈레톤 */}
        <div style={{ marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            aria-hidden="true"
            className="lp-skeleton"
            style={{ height: 30, width: 180, borderRadius: 8 }}
          />
          <div
            aria-hidden="true"
            className="lp-skeleton"
            style={{ height: 16, width: 260, borderRadius: 6 }}
          />
        </div>

        {/* 앱 카드 그리드 스켈레톤 */}
        <AppGridSkeleton count={6} />
      </div>
    </main>
  );
}
