'use client';

/**
 * 전역 토스트 시스템.
 * - ToastProvider: app/[locale]/layout.tsx에서 children 감싸기
 * - useToast: 컴포넌트에서 toast.show() 호출
 * - variant: 'success' | 'error' | 'info'
 * - 자동 사라짐 2.5s + 수동 닫기(×)
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

// ── 타입 ────────────────────────────────────────────────────────────────────

type Variant = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  variant: Variant;
}

interface ToastContextValue {
  show: (message: string, variant?: Variant) => void;
}

// ── 컨텍스트 ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ── 색상 매핑 (디자인 토큰) ───────────────────────────────────────────────────

const VARIANT_STYLES: Record<
  Variant,
  { border: string; color: string; bg: string }
> = {
  success: {
    border: 'var(--accent)',
    color: 'var(--accent)',
    bg: 'rgba(46,230,166,.10)',
  },
  error: {
    border: 'var(--red)',
    color: 'var(--red)',
    bg: 'rgba(255,107,107,.10)',
  },
  info: {
    border: 'var(--brand)',
    color: 'var(--brand)',
    bg: 'rgba(108,140,255,.10)',
  },
};

// ── ToastItem ─────────────────────────────────────────────────────────────────

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
}) {
  const style = VARIANT_STYLES[toast.variant];

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'var(--card2)',
        border: `1px solid ${style.border}`,
        borderRadius: 12,
        padding: '12px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,.4)',
        maxWidth: 'calc(100vw - 32px)',
        width: 'max-content',
        pointerEvents: 'auto',
      }}
    >
      <span
        style={{
          color: style.color,
          fontSize: 14,
          fontWeight: 600,
          lineHeight: 1.5,
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          flex: 1,
        }}
      >
        {toast.message}
      </span>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="닫기"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--muted)',
          fontSize: 16,
          cursor: 'pointer',
          lineHeight: 1,
          padding: 0,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}

// ── ToastProvider ─────────────────────────────────────────────────────────────

let nextId = 0;
const AUTO_DISMISS_MS = 2500;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (message: string, variant: Variant = 'info') => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message, variant }]);
      const timer = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  // unmount 시 타이머 전체 클리어
  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((t) => clearTimeout(t));
      map.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}

      {/* 토스트 컨테이너 — 화면 하단 중앙 */}
      {toasts.length > 0 && (
        <div
          aria-label="알림"
          style={{
            position: 'fixed',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            alignItems: 'center',
            pointerEvents: 'none',
          }}
        >
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

// ── useToast ──────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return ctx;
}
