/**
 * /ko/apps/[slug] 로딩 스켈레톤.
 * App Router의 loading.tsx — Suspense 경계로 자동 래핑됨.
 */

import { Skeleton } from '@/components/Skeleton';

export default function AppDetailLoading() {
  return (
    <main style={{ flex: 1, width: '100%' }}>
      <div
        className="lp-container--md"
        style={{ paddingTop: 40, paddingBottom: 40 }}
      >
        {/* 뒤로가기 */}
        <Skeleton variant="text" height={13} width={80} style={{ marginBottom: 24 }} />

        {/* 앱 헤더 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 20,
            marginBottom: 28,
            flexWrap: 'wrap',
          }}
        >
          {/* 썸네일 */}
          <Skeleton
            variant="line"
            height={80}
            width={80}
            style={{ borderRadius: 20, flexShrink: 0 }}
          />

          {/* 제목/설명 */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Skeleton variant="line" height={28} width="60%" style={{ borderRadius: 6 }} />
            <Skeleton variant="text" height={15} width="80%" />
            <Skeleton variant="text" height={13} width={120} />
          </div>

          {/* 업보트 버튼 */}
          <Skeleton variant="line" height={36} width={72} style={{ borderRadius: 9 }} />
        </div>

        {/* 설명 카드 */}
        <div
          style={{
            border: '1px solid var(--line)',
            borderRadius: 12,
            padding: '18px 20px',
            marginBottom: 28,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <Skeleton variant="text" height={12} width={60} />
          <Skeleton variant="text" />
          <Skeleton variant="text" width="90%" />
          <Skeleton variant="text" width="75%" />
        </div>

        {/* 메타 행 */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 28, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[80, 70, 90].map((w, i) => (
              <Skeleton
                key={i}
                variant="line"
                height={24}
                width={w}
                style={{ borderRadius: 7 }}
              />
            ))}
          </div>
        </div>

        {/* CTA 버튼 */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 36 }}>
          <Skeleton variant="line" height={42} width={120} style={{ borderRadius: 10 }} />
        </div>

        {/* AppRunner 자리 */}
        <Skeleton variant="card" height={400} style={{ marginBottom: 40, borderRadius: 16 }} />
      </div>
    </main>
  );
}
