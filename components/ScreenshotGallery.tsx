'use client';

/**
 * 스크린샷 갤러리 컴포넌트.
 * - 가로 스크롤 썸네일 줄 (160×284)
 * - 썸네일 클릭 시 라이트박스(오버레이) 열림
 * - 라이트박스: 좌/우 화살표 네비, ESC/배경/X 닫기, 스크롤 락
 */

import { useState, useEffect, useCallback } from 'react';

interface Props {
  urls: string[];
  /** 갤러리 섹션 레이블 (e.g. "스크린샷") */
  label: string;
  /** 개별 이미지 alt 문자열 (urls와 동일 길이, 서버에서 미리 계산해 전달) */
  alts: string[];
}

export default function ScreenshotGallery({ urls, label, alts }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const isOpen = openIndex !== null;

  const close = useCallback(() => {
    setOpenIndex(null);
    document.body.style.overflow = '';
  }, []);

  const goNext = useCallback(() => {
    setOpenIndex((prev) => (prev === null ? null : (prev + 1) % urls.length));
  }, [urls.length]);

  const goPrev = useCallback(() => {
    setOpenIndex((prev) =>
      prev === null ? null : (prev - 1 + urls.length) % urls.length,
    );
  }, [urls.length]);

  // 키보드 이벤트 (ESC / ← →)
  useEffect(() => {
    if (!isOpen) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, close, goNext, goPrev]);

  // body 스크롤 락
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={alts[i]}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* 라이트박스 오버레이 */}
      {isOpen && openIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alts[openIndex]}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          // 배경 클릭 시 닫기 (이미지/버튼 영역은 stopPropagation)
          onClick={close}
        >
          {/* 닫기 버튼 (우상단) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            aria-label="닫기"
            style={{
              position: 'absolute',
              top: 16,
              right: 20,
              background: 'rgba(255,255,255,.12)',
              border: '1px solid rgba(255,255,255,.25)',
              borderRadius: 8,
              color: '#fff',
              fontSize: 20,
              lineHeight: 1,
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 1001,
            }}
          >
            ✕
          </button>

          {/* 인디케이터 (상단 중앙) */}
          {urls.length > 1 && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'rgba(255,255,255,.75)',
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '.04em',
                zIndex: 1001,
              }}
            >
              {openIndex + 1} / {urls.length}
            </div>
          )}

          {/* 이전 화살표 */}
          {urls.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              aria-label="이전 이미지"
              style={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,.12)',
                border: '1px solid rgba(255,255,255,.25)',
                borderRadius: 8,
                color: '#fff',
                fontSize: 22,
                lineHeight: 1,
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 1001,
              }}
            >
              ‹
            </button>
          )}

          {/* 메인 이미지 */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={urls[openIndex]}
              alt={alts[openIndex]}
              style={{
                maxWidth: '90vw',
                maxHeight: '90vh',
                objectFit: 'contain',
                borderRadius: 12,
                boxShadow: '0 8px 40px rgba(0,0,0,.5)',
                display: 'block',
              }}
            />
          </div>

          {/* 다음 화살표 */}
          {urls.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              aria-label="다음 이미지"
              style={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,.12)',
                border: '1px solid rgba(255,255,255,.25)',
                borderRadius: 8,
                color: '#fff',
                fontSize: 22,
                lineHeight: 1,
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 1001,
              }}
            >
              ›
            </button>
          )}
        </div>
      )}
    </>
  );
}
