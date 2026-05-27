'use client';

/**
 * 공용 Modal 컴포넌트 (P0-3 접근성 대응)
 *
 * - role="dialog" aria-modal="true" aria-labelledby
 * - 오픈 시 첫 포커서블 엘리먼트에 focus, 닫을 때 트리거로 복귀
 * - ESC 닫기
 * - 오픈 중 body overflow:hidden
 * - Tab 포커스 트랩 (모달 내부 순환)
 */

import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** aria-labelledby에 사용할 제목 엘리먼트의 id */
  labelId?: string;
  children: React.ReactNode;
  /** 모달 패널의 maxWidth (기본 400px) */
  maxWidth?: number;
}

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export default function Modal({
  isOpen,
  onClose,
  labelId,
  children,
  maxWidth = 400,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  // 모달을 연 트리거 엘리먼트를 기억해 닫을 때 포커스 복귀
  const triggerRef = useRef<Element | null>(null);

  // 열릴 때: 트리거 기억 + 첫 포커서블로 포커스 이동 + body 스크롤 잠금
  useEffect(() => {
    if (!isOpen) return;

    triggerRef.current = document.activeElement;
    document.body.style.overflow = 'hidden';

    // 다음 틱에 패널이 렌더된 뒤 포커스 이동
    const raf = requestAnimationFrame(() => {
      if (!panelRef.current) return;
      const first = panelRef.current.querySelector<HTMLElement>(FOCUSABLE_SELECTORS);
      first?.focus();
    });

    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = '';
      // 닫힐 때 트리거로 포커스 복귀
      if (triggerRef.current && 'focus' in triggerRef.current) {
        (triggerRef.current as HTMLElement).focus();
      }
    };
  }, [isOpen]);

  // ESC 닫기
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Tab 포커스 트랩
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
        ).filter((el) => !el.closest('[hidden]'));

        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  const modalContent = (
    <div
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,.6)',
        backdropFilter: 'blur(4px)',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        style={{
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: 18,
          width: '100%',
          maxWidth,
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {children}
      </div>
    </div>
  );

  // createPortal로 body에 직접 마운트
  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}
