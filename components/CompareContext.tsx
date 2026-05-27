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
 *
 * sessionStorage 영속화: 페이지 이동(홈→상세→apps) 시에도 선택 유지.
 * 브라우저 탭을 닫으면 초기화됨(localStorage와 달리 탭 단위 격리).
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';

const MAX_COMPARE = 3;
const STORAGE_KEY = 'launchings_compare_ids';

interface CompareContextValue {
  ids: string[];
  toggle: (id: string) => void;
  clear: () => void;
  remove: (id: string) => void;
  isSelected: (id: string) => boolean;
  isFull: boolean;
}

const CompareContext = createContext<CompareContextValue | null>(null);

function loadFromStorage(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === 'string');
  } catch {
    // 파싱 실패 시 무시
  }
  return [];
}

function saveToStorage(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // 저장 실패 시 무시 (private browsing 등)
  }
}

export function CompareProvider({ children }: { children: ReactNode }) {
  // sessionStorage에서 초기값 복원
  const [ids, setIds] = useState<string[]>(() => loadFromStorage());

  // ids 변경 시 sessionStorage 동기화
  useEffect(() => {
    saveToStorage(ids);
  }, [ids]);

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) return prev; // 최대 3개 — 무시 (bar에서 안내)
      return [...prev, id];
    });
  }, []);

  const clear = useCallback(() => setIds([]), []);

  const remove = useCallback((id: string) => {
    setIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const isSelected = useCallback((id: string) => ids.includes(id), [ids]);

  const isFull = ids.length >= MAX_COMPARE;

  return (
    <CompareContext.Provider value={{ ids, toggle, clear, remove, isSelected, isFull }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare(): CompareContextValue {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
}
