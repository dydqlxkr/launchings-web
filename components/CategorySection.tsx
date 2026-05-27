'use client';

/**
 * 카테고리 섹션 — 히어로 아래에 표시되는 카테고리 타일.
 * onSelectCat 콜백으로 부모(HomeWrapper)에 카테고리 변경을 알린다.
 * 스크롤·필터 연동은 HomeWrapper가 담당한다.
 */

import { useTranslations } from 'next-intl';
import type { Category } from '@/lib/types';

interface Props {
  categories: Category[];
  selectedCat?: string;
  onSelectCat?: (slug: string) => void;
}

export default function CategorySection({ categories, selectedCat, onSelectCat }: Props) {
  const t = useTranslations('categoriesSection');

  return (
    <section
      style={{
        background: 'var(--bg2)',
        borderTop: '1px solid var(--line)',
        borderBottom: '1px solid var(--line)',
        padding: '40px 0',
      }}
    >
      <div className="lp-container">
        {/* 섹션 헤더 */}
        <div style={{ marginBottom: 24 }}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: '-.5px',
              marginBottom: 6,
            }}
          >
            {t('title')}
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            {t('subtitle')}
          </p>
        </div>

        {/* 카테고리 타일 그리드 */}
        <div className="lp-cat-grid">
          {categories.map((cat) => {
            const isActive = selectedCat === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => onSelectCat?.(cat.slug)}
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg,rgba(108,140,255,.28),rgba(155,108,255,.22))'
                    : 'var(--card)',
                  border: `1px solid ${isActive ? 'rgba(108,140,255,.5)' : 'var(--line)'}`,
                  borderRadius: 14,
                  padding: '18px 12px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'border-color .15s',
                  fontFamily: 'inherit',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
                className="hover:border-[var(--brand)]"
              >
                <span style={{ fontSize: 28 }}>{cat.emoji}</span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: isActive ? '#fff' : 'var(--ink)',
                  }}
                >
                  {cat.label_ko}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
