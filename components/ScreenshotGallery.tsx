'use client';

/**
 * 스크린샷 갤러리 컴포넌트.
 * - 가로 스크롤 썸네일 줄 (160×284)
 * - 썸네일 클릭 시 라이트박스(ScreenshotLightbox) 열림
 */

import { useState } from 'react';
import Image from 'next/image';
import ScreenshotLightbox from './ScreenshotLightbox';

interface Props {
  urls: string[];
  /** 갤러리 섹션 레이블 (e.g. "스크린샷") */
  label: string;
  /** 개별 이미지 alt 문자열 (urls와 동일 길이, 서버에서 미리 계산해 전달) */
  alts: string[];
}

export default function ScreenshotGallery({ urls, label, alts }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (urls.length === 0) return null;

  return (
    <>
      {/* 섹션 레이블 */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--muted)',
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: '.06em',
          }}
        >
          {label}
        </div>

        {/* 가로 스크롤 썸네일 줄 */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            overflowX: 'auto',
            paddingBottom: 6,
          }}
        >
          {urls.map((url, i) => (
            <button
              key={url}
              onClick={() => setOpenIndex(i)}
              aria-label={alts[i]}
              style={{
                flexShrink: 0,
                borderRadius: 10,
                overflow: 'hidden',
                border: '1px solid var(--line)',
                position: 'relative',
                width: 160,
                height: 284,
                background: 'var(--card)',
                padding: 0,
                cursor: 'pointer',
                display: 'block',
              }}
            >
              <Image
                src={url}
                alt={alts[i]}
                fill
                sizes="160px"
                style={{ objectFit: 'cover' }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* 라이트박스 오버레이 */}
      {openIndex !== null && (
        <ScreenshotLightbox
          urls={urls}
          alts={alts}
          initialIndex={openIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  );
}
