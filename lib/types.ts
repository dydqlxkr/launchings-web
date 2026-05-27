/**
 * 도메인 타입 — ARCHITECTURE_v1.md §3 Postgres 스키마와 1:1 대응.
 * Phase 2에서 Supabase로 교체 시 이 타입은 그대로 유지된다.
 */

export type AppStatus = 'draft' | 'published' | 'hidden' | 'removed';
export type AppType = 'webapp' | 'native' | 'link';
export type EmbedStatus = 'unknown' | 'embeddable' | 'blocked';

export interface Category {
  slug: string;
  label_ko: string;
  label_en: string;
  emoji: string;
  sort_order: number;
}

export interface Profile {
  id: string; // uuid (= auth.users.id in Phase 2)
  handle: string; // URL slug — /makers/[handle]
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  avatar_gradient: string | null; // Phase 1 시드 전용 — DB에는 없음
  avatar_initial: string | null; // Phase 1 시드 전용
  website_url: string | null;
  created_at: string; // ISO 8601
}

export interface App {
  id: string; // uuid
  author_id: string; // uuid → Profile.id
  slug: string;
  title: string;
  tagline: string | null;
  description: string;
  app_type: AppType;
  live_url: string | null;
  store_url_ios: string | null;
  store_url_android: string | null;
  demo_video_url: string | null;
  thumbnail_path: string | null; // Storage 경로 or null
  thumbnail_emoji: string | null; // Phase 1 시드 전용
  thumbnail_gradient: string | null; // Phase 1 시드 전용
  embed_status: EmbedStatus;
  status: AppStatus;
  vote_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  // 조인 데이터 (쿼리 시 포함)
  categories?: string[]; // category slug 배열
  stacks?: string[]; // 기술 스택 배열
  author?: Profile;
}

export interface AppWithRelations extends App {
  categories: string[];
  stacks: string[];
  author: Profile;
}

// 정렬 옵션
export type SortOption = 'votes' | 'newest';

// 필터 파라미터 (URL searchParams와 대응)
export interface AppFilters {
  q?: string; // 검색어
  cat?: string; // category slug
  sort?: SortOption;
}

export interface MakerFilters {
  q?: string;
  sort?: 'votes' | 'score';
}

// ── 리뷰 ─────────────────────────────────────
export interface Review {
  id: string;
  app_id: string;
  author_id: string;
  rating: number; // 1~5
  body: string;
  created_at: string;
  updated_at: string;
  author?: Profile; // 조인 시 포함
}

export interface ReviewWithAuthor extends Review {
  author: Profile;
}

// 평균평점 + 리뷰 수 집계
export interface ReviewStats {
  avg_rating: number;
  review_count: number;
}
