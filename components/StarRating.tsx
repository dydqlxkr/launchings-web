'use client';

/**
 * 별점 표시/선택 공용 컴포넌트 — ReviewSection / FeedReviewsPanel 공용.
 * - StarDisplay: 읽기 전용 별점 표시
 * - StarPicker: 클릭으로 별점 선택 (호버 프리뷰)
 * - formatReviewDate: 리뷰 작성일 표시 포맷 (YYYY. M. D.)
 */

import { useState } from 'react';

export function StarDisplay({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }} aria-label={`${rating}점`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          style={{
            fontSize: size,
            color: n <= rating ? '#fbbf24' : 'var(--line)',
            lineHeight: 1,
          }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export function StarPicker({
  value,
  onChange,
  size = 26,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'inline-flex', gap: 4 }} role="group" aria-label="별점 선택">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${n}점`}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            fontSize: size,
            color: n <= (hover || value) ? '#fbbf24' : 'var(--line)',
            lineHeight: 1,
            transition: 'color .08s',
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function formatReviewDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}
