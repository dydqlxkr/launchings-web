/**
 * Phase 1 로컬 시드 데이터.
 * 프로토타입(런칭스_프로토타입.html)의 BUILDERS/APPS 데이터를 기반으로,
 * ARCHITECTURE_v1.md §3 스키마 타입과 정확히 일치하는 형태로 작성.
 *
 * Phase 2 교체 포인트: 이 파일을 import하는 lib/repo/index.ts의 구현체를
 * Supabase 구현체(lib/repo/supabase.ts)로 교체하면 된다.
 * 타입은 lib/types.ts에서 공유하므로 변경 없음.
 */

import type { Category, Profile, AppWithRelations } from '@/lib/types';

// ────────────────────────────────────────────────────────────
// categories (= DB seed.sql의 categories 테이블)
// ────────────────────────────────────────────────────────────
export const CATEGORIES: Category[] = [
  { slug: 'ai', label_ko: 'AI / LLM', label_en: 'AI / LLM', emoji: '🤖', sort_order: 1 },
  { slug: 'productivity', label_ko: '생산성', label_en: 'Productivity', emoji: '⚡', sort_order: 2 },
  { slug: 'design', label_ko: '디자인', label_en: 'Design', emoji: '🎨', sort_order: 3 },
  { slug: 'game', label_ko: '게임', label_en: 'Game', emoji: '🎮', sort_order: 4 },
  { slug: 'mobile', label_ko: '모바일', label_en: 'Mobile', emoji: '📱', sort_order: 5 },
  { slug: 'other', label_ko: '실험실', label_en: 'Lab', emoji: '🧪', sort_order: 6 },
  // 0010_finance_category.sql 과 동기
  { slug: 'finance', label_ko: '금융/핀테크', label_en: 'Finance', emoji: '💸', sort_order: 7 },
];

// ────────────────────────────────────────────────────────────
// profiles (= DB의 profiles 테이블)
// 시드 데이터 제거됨 — 실제 데이터는 Supabase DB에서 조회
// ────────────────────────────────────────────────────────────
export const PROFILES: Profile[] = [];

// ────────────────────────────────────────────────────────────
// apps (= DB의 apps + app_categories + app_stacks 조인 결과)
// 시드 데이터 제거됨 — 실제 데이터는 Supabase DB에서 조회
// ────────────────────────────────────────────────────────────
export const APPS: AppWithRelations[] = [];
