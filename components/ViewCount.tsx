/**
 * 조회수 표시 — 순수 표시 컴포넌트 (서버/클라이언트 모두 사용 가능).
 * 1000 이상은 1.2k 형식으로 표시.
 */

interface Props {
  count: number;
  style?: React.CSSProperties;
}

export function formatViewCount(n: number): string {
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return String(n);
}

export default function ViewCount({ count, style }: Props) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        fontSize: 12,
        color: 'var(--muted)',
        ...style,
      }}
    >
      <span aria-hidden="true">👁</span>
      <span>{formatViewCount(count)}</span>
    </span>
  );
}
