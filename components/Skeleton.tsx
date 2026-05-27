/**
 * 스켈레톤 로딩 컴포넌트.
 * - variant: 'card' | 'line' | 'thumb' | 'text'
 * - globals.css의 .lp-skeleton(--skeleton 색 + shimmer 1.6s) 사용.
 * - prefers-reduced-motion 이면 globals.css 전역 규칙으로 자동 정적.
 */

interface SkeletonProps {
  variant?: 'card' | 'line' | 'thumb' | 'text';
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
}

export function Skeleton({
  variant = 'line',
  width,
  height,
  style,
}: SkeletonProps) {
  const base: React.CSSProperties = {
    background: 'var(--skeleton)',
    borderRadius: 'var(--r-sm)',
    display: 'block',
  };

  const variantStyle: Record<string, React.CSSProperties> = {
    line: { height: height ?? 16, width: width ?? '100%' },
    text: { height: height ?? 14, width: width ?? '80%', borderRadius: 4 },
    thumb: {
      height: height ?? 128,
      width: width ?? '100%',
      borderRadius: 'var(--r-md)',
    },
    card: {
      height: height ?? 220,
      width: width ?? '100%',
      borderRadius: 'var(--r-lg)',
    },
  };

  return (
    <span
      aria-hidden="true"
      className="lp-skeleton"
      style={{ ...base, ...variantStyle[variant], ...style }}
    />
  );
}

/** 앱 카드 형태의 스켈레톤 1장 */
export function AppCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: 16,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 썸네일 */}
      <Skeleton variant="thumb" />

      {/* 본문 */}
      <div style={{ padding: '15px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Skeleton variant="line" height={18} width="60%" />
        <Skeleton variant="text" height={13} />
        <Skeleton variant="text" height={13} width="70%" />

        {/* 하단 행 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <Skeleton variant="line" height={24} width={80} style={{ borderRadius: 999 }} />
          <Skeleton variant="line" height={28} width={60} style={{ borderRadius: 9 }} />
        </div>
      </div>
    </div>
  );
}

/** 메이커 카드 형태의 스켈레톤 1장 */
export function MakerCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: 18,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Skeleton variant="line" height={52} width={52} style={{ borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skeleton variant="line" height={16} width="60%" />
          <Skeleton variant="text" height={12} width="40%" />
        </div>
      </div>
      {/* bio */}
      <Skeleton variant="text" height={13} />
      <Skeleton variant="text" height={13} width="80%" />
      {/* 대표 앱 */}
      <Skeleton variant="card" height={56} style={{ borderRadius: 12 }} />
      {/* 푸터 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton variant="line" height={14} width={80} />
        <Skeleton variant="line" height={32} width={80} style={{ borderRadius: 9 }} />
      </div>
    </div>
  );
}

/** 앱 카드 N장 스켈레톤 그리드 */
export function AppGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="lp-grid">
      {Array.from({ length: count }).map((_, i) => (
        <AppCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** 메이커 카드 N장 스켈레톤 그리드 */
export function MakerGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="lp-makers-grid">
      {Array.from({ length: count }).map((_, i) => (
        <MakerCardSkeleton key={i} />
      ))}
    </div>
  );
}
