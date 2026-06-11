'use client';

/**
 * 스크린샷 라이트박스(오버레이) — ScreenshotGallery에서 추출한 재사용 컴포넌트.
 * - 좌/우 화살표 네비, ESC/배경/X 닫기, body 스크롤 락
 * - 현재 인덱스는 내부 관리(initialIndex로 시작), 닫기는 onClose 콜백
 * 사용처: ScreenshotGallery(상세 하단 갤러리), AppRunner NativeDemoView(스크린샷 스트립)
 */

import { useState, useEffect, useCallback } from 'react';

interface Props {
  urls: string[];
  /** 개별 이미지 alt 문자열 (urls와 동일 길이) */
  alts: string[];
  initialIndex: number;
  onClose: () => void;
}

export default function ScreenshotLightbox({ urls, alts, initialIndex, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);

  const goNext = useCallback(() => {
    setIndex((prev) => (prev + 1) % urls.length);
  }, [urls.length]);

  const goPrev = useCallback(() => {
    setIndex((prev) => (prev - 1 + urls.length) % urls.length);
  }, [urls.length]);

  // 키보드 이벤트 (ESC / ← →)
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, goNext, goPrev]);

  // body 스크롤 락
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alts[index]}
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
      onClick={onClose}
    >
      {/* 닫기 버튼 (우상단) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
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
          {index + 1} / {urls.length}
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
        {/* 라이트박스는 의도적으로 raw img — 사용자가 원본 크기로 보려고 연 것이므로
            next/image 리사이즈를 거치지 않고 원본을 그대로 보여준다. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={urls[index]}
          alt={alts[index]}
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
  );
}
