'use client';

/**
 * 비교 바스켓 컨텍스트 — 앱 카드에서 선택 → 플로팅 바 → 비교 페이지 라우팅.
 *
 * URL 기반 방식(/ko/compare?ids=...) 채택 이유:
 *  - 비교 링크를 공유할 수 있음 (URL이 상태)
 *  - SSR/ISR 비교 페이지 대응 가능 (Phase 2+ 캐시)
 *  - 클라이언트 전역 상태 최소화 (Context는 선택 바스켓만 관리)
 *
 * 최대 3개 제한 — 모바일에서 side-by-side 가독성 한계.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

const MAX_COMPARE = 3;

interface CompareContextValue {
  ids: string[];
  toggle: (id: string) => void;
  clear: () => void;
  isSelected: (id: string) => boolean;
  isFull: boolean;
}

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) return prev; // 최대 3개 — 무시 (bar에서 toast)
      return [...prev, id];
    });
  }, []);

  const clear = useCallback(() => setIds([]), []);

  const isSelected = useCallback((id: string) => ids.includes(id), [ids]);

  const isFull = ids.length >= MAX_COMPARE;

  return (
    <CompareContext.Provider value={{ ids, toggle, clear, isSelected, isFull }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare(): CompareContextValue {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
}
