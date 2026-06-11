/**
 * /ko/my-apps 로딩 스켈레톤.
 * App Router의 loading.tsx — Suspense 경계로 자동 래핑됨.
 */

import { Skeleton } from '@/components/Skeleton';

/** 내 앱 리스트 행 스켈레톤 1개 */
function MyAppRowSkeleton() {
  return (
    <div
      aria-hidden="true"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: 14,
        padding: '16px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
    >
      {/* 썸네일 */}
      <Skeleton
        variant="line"
        height={52}
        width={52}
        style={{ borderRadius: 12, flexShrink: 0 }}
      />
      {/* 텍스트 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skeleton variant="line" height={16} width="40%" />
        <Skeleton variant="text" height={12} width="60%" />
      </div>
      {/* 상태 배지 */}
      <Skeleton
        variant="line"
        height={26}
        width={70}
        style={{ borderRadius: 999, flexShrink: 0 }}
      />
      {/* 액션 버튼 */}
      <Skeleton
        variant="line"
        height={34}
        width={80}
        style={{ borderRadius: 9, flexShrink: 0 }}
      />
    </div>
  );
}

export default function MyAppsLoading() {
  return (
    <main style={{ flex: 1, width: '100%' }}>
      <div className="lp-container--md" style={{ paddingTop: 40, paddingBottom: 60 }}>
        {/* 헤더 + 등록 버튼 스켈레톤 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
          <div
            aria-hidden="true"
            className="lp-skeleton"
            style={{ height: 42, width: 130, borderRadius: 10 }}
          />
        </div>

        {/* 앱 행 스켈레톤 5개 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <MyAppRowSkeleton key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}
