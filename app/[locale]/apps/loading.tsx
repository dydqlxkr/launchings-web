/**
 * /ko/apps 로딩 스켈레톤.
 * App Router의 loading.tsx — Suspense 경계로 자동 래핑됨.
 */

import { AppGridSkeleton } from '@/components/Skeleton';

export default function AppsLoading() {
  return (
    <main style={{ flex: 1, paddingBottom: 80 }}>
      <div className="lp-container" style={{ paddingTop: 28 }}>
        {/* 검색창 스켈레톤 */}
        <div
          aria-hidden="true"
          className="lp-skeleton"
          style={{ height: 52, borderRadius: 14, marginBottom: 36 }}
        />

        {/* 인기 앱 섹션 헤더 */}
        <div style={{ marginBottom: 22, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            aria-hidden="true"
            className="lp-skeleton"
            style={{ height: 26, width: 200, borderRadius: 8 }}
          />
          <div
            aria-hidden="true"
            className="lp-skeleton"
            style={{ height: 14, width: 240, borderRadius: 6 }}
          />
        </div>

        <AppGridSkeleton count={8} />
      </div>
    </main>
  );
}
