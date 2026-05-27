/**
 * 홈 페이지 로딩 스켈레톤.
 * App Router의 loading.tsx — Suspense 경계로 자동 래핑됨.
 */

import { AppGridSkeleton, MakerGridSkeleton } from '@/components/Skeleton';

export default function HomeLoading() {
  return (
    <div style={{ flex: 1 }}>
      {/* 트렌딩 앱 그리드 스켈레톤 */}
      <section style={{ paddingTop: 14 }}>
        <div className="lp-container" style={{ paddingBottom: 46 }}>
          {/* 섹션 헤더 */}
          <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              aria-hidden="true"
              className="lp-skeleton"
              style={{ height: 28, width: 200, borderRadius: 8 }}
            />
            <div
              aria-hidden="true"
              className="lp-skeleton"
              style={{ height: 16, width: 280, borderRadius: 6 }}
            />
          </div>
          <AppGridSkeleton count={9} />
        </div>
      </section>

      {/* 메이커 그리드 스켈레톤 */}
      <section style={{ padding: '46px 0' }}>
        <div className="lp-container">
          <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              aria-hidden="true"
              className="lp-skeleton"
              style={{ height: 28, width: 200, borderRadius: 8 }}
            />
          </div>
          <MakerGridSkeleton count={8} />
        </div>
      </section>
    </div>
  );
}
