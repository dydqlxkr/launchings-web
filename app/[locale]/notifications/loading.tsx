/**
 * /ko/notifications 로딩 스켈레톤.
 * App Router의 loading.tsx — Suspense 경계로 자동 래핑됨.
 */

import { Skeleton } from '@/components/Skeleton';

/** 알림 행 스켈레톤 1개 */
function NotificationRowSkeleton() {
  return (
    <div
      aria-hidden="true"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        padding: '14px 0',
        borderBottom: '1px solid var(--line)',
      }}
    >
      {/* 아바타 */}
      <Skeleton
        variant="line"
        height={40}
        width={40}
        style={{ borderRadius: '50%', flexShrink: 0 }}
      />
      {/* 텍스트 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
        <Skeleton variant="line" height={14} width="70%" />
        <Skeleton variant="text" height={12} width="45%" />
      </div>
      {/* 시각 */}
      <Skeleton variant="text" height={12} width={60} style={{ flexShrink: 0 }} />
    </div>
  );
}

export default function NotificationsLoading() {
  return (
    <main style={{ flex: 1, width: '100%' }}>
      <div className="lp-container--md" style={{ paddingTop: 40, paddingBottom: 60 }}>
        {/* 헤더 스켈레톤 */}
        <div style={{ marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            aria-hidden="true"
            className="lp-skeleton"
            style={{ height: 30, width: 140, borderRadius: 8 }}
          />
        </div>

        {/* 알림 행 5개 */}
        {Array.from({ length: 5 }).map((_, i) => (
          <NotificationRowSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}
