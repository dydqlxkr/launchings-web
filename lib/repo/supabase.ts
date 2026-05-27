/**
 * Phase 2 Supabase 구현체 — IRepo를 Supabase Postgres 읽기로 구현.
 * 서버 클라이언트(@supabase/ssr)를 사용 — anon key + RLS.
 *
 * 읽기 경로는 Next.js 캐시(unstable_cache / fetch cache)와 통합.
 * 쓰기(등록/업보트)는 별도 Server Action(lib/actions/)에서 처리.
 */

import { createClient } from '@/lib/supabase/server';
import type {
  AppWithRelations,
  Category,
  Profile,
  AppFilters,
  ReviewWithAuthor,
  ReviewStats,
  FeatureRequestWithAuthor,
} from '@/lib/types';
import type { IRepo } from './interface';

class SupabaseRepo implements IRepo {
  // ── App ──────────────────────────────────────────────────

  async listApps(filters: AppFilters): Promise<AppWithRelations[]> {
    const supabase = await createClient();

    let query = supabase
      .from('apps')
      .select(`
        *,
        author:profiles!author_id(*),
        app_categories(category_slug),
        app_stacks(stack)
      `)
      .eq('status', 'published');

    // 카테고리 필터
    if (filters.cat && filters.cat !== 'all') {
      query = query.eq('app_categories.category_slug', filters.cat);
    }

    // 정렬
    if (filters.sort === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order('vote_count', { ascending: false });
    }

    const { data, error } = await query;
    if (error) {
      console.error('[SupabaseRepo] listApps error:', error.message);
      return [];
    }

    let apps = (data ?? []).map(mapApp);

    // 검색어 필터 (서버측 FTS 대신 클라이언트 필터 — v1 단순화)
    if (filters.q && filters.q.trim()) {
      const q = filters.q.toLowerCase().trim();
      apps = apps.filter((a) => {
        const hay = [
          a.title,
          a.tagline ?? '',
          a.description,
          ...(a.stacks ?? []),
          a.author?.display_name ?? '',
        ]
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }

    // 카테고리 필터를 앱 레벨에서도 적용 (조인 null 행 제거)
    if (filters.cat && filters.cat !== 'all') {
      apps = apps.filter((a) => a.categories.includes(filters.cat!));
    }

    return apps;
  }

  async getAppBySlug(slug: string): Promise<AppWithRelations | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('apps')
      .select(`
        *,
        author:profiles!author_id(*),
        app_categories(category_slug),
        app_stacks(stack)
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error || !data) return null;
    return mapApp(data);
  }

  async listAppSlugs(): Promise<string[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('apps')
      .select('slug')
      .eq('status', 'published');

    if (error || !data) return [];
    return data.map((r: { slug: string }) => r.slug);
  }

  // ── Profile ──────────────────────────────────────────────

  async listProfiles(): Promise<Profile[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(mapProfile);
  }

  async getProfileByHandle(handle: string): Promise<Profile | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('handle', handle)
      .single();

    if (error || !data) return null;
    return mapProfile(data);
  }

  async listHandles(): Promise<string[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('handle');

    if (error || !data) return [];
    return data.map((r: { handle: string }) => r.handle);
  }

  async listAppsByAuthor(authorId: string): Promise<AppWithRelations[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('apps')
      .select(`
        *,
        author:profiles!author_id(*),
        app_categories(category_slug),
        app_stacks(stack)
      `)
      .eq('author_id', authorId)
      .eq('status', 'published')
      .order('vote_count', { ascending: false });

    if (error || !data) return [];
    return data.map(mapApp);
  }

  // ── Category ─────────────────────────────────────────────

  async listCategories(): Promise<Category[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error || !data) return [];
    return data as Category[];
  }

  // ── Review ───────────────────────────────────────────────

  async listReviews(appId: string): Promise<ReviewWithAuthor[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        author:profiles!author_id(*)
      `)
      .eq('app_id', appId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('[SupabaseRepo] listReviews error:', error?.message);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map(mapReview);
  }

  async getReviewStats(appId: string): Promise<ReviewStats> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('app_id', appId);

    if (error || !data || data.length === 0) {
      return { avg_rating: 0, review_count: 0 };
    }

    const total = (data as { rating: number }[]).reduce((sum, r) => sum + r.rating, 0);
    return {
      avg_rating: Math.round((total / data.length) * 10) / 10,
      review_count: data.length,
    };
  }

  async getMyReview(appId: string, userId: string): Promise<ReviewWithAuthor | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        author:profiles!author_id(*)
      `)
      .eq('app_id', appId)
      .eq('author_id', userId)
      .maybeSingle();

    if (error || !data) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return mapReview(data as any);
  }

  // ── Feature Request ───────────────────────────────────────

  async listFeatureRequests(appId: string): Promise<FeatureRequestWithAuthor[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('feature_requests')
      .select(`
        *,
        author:profiles!author_id(*)
      `)
      .eq('app_id', appId)
      .order('vote_count', { ascending: false });

    if (error || !data) {
      console.error('[SupabaseRepo] listFeatureRequests error:', error?.message);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map(mapFeatureRequest);
  }

  async getMyFeatureVotes(appId: string, userId: string): Promise<Set<string>> {
    const supabase = await createClient();

    // 먼저 해당 앱의 기능 요청 ID 목록 조회
    const { data: requestsData, error: requestsError } = await supabase
      .from('feature_requests')
      .select('id')
      .eq('app_id', appId);

    if (requestsError || !requestsData || requestsData.length === 0) {
      return new Set();
    }

    const requestIds = (requestsData as { id: string }[]).map((r) => r.id);

    // 해당 요청들 중 사용자가 투표한 항목 조회
    const { data, error } = await supabase
      .from('feature_request_votes')
      .select('request_id')
      .eq('user_id', userId)
      .in('request_id', requestIds);

    if (error || !data) return new Set();
    return new Set((data as { request_id: string }[]).map((r) => r.request_id));
  }
}

// ── 매핑 헬퍼 ────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProfile(row: any): Profile {
  return {
    id: row.id,
    handle: row.handle,
    display_name: row.display_name ?? row.handle,
    bio: row.bio ?? null,
    avatar_url: row.avatar_url ?? null,
    avatar_gradient: null, // DB에 없는 Phase 1 전용 필드
    avatar_initial: null,  // DB에 없는 Phase 1 전용 필드
    website_url: row.website_url ?? null,
    created_at: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApp(row: any): AppWithRelations {
  const categories: string[] = (row.app_categories ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((c: any) => c.category_slug)
    .filter(Boolean);

  const stacks: string[] = (row.app_stacks ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((s: any) => s.stack)
    .filter(Boolean);

  return {
    id: row.id,
    author_id: row.author_id,
    slug: row.slug,
    title: row.title,
    tagline: row.tagline ?? null,
    description: row.description ?? '',
    app_type: row.app_type,
    live_url: row.live_url ?? null,
    store_url_ios: row.store_url_ios ?? null,
    store_url_android: row.store_url_android ?? null,
    demo_video_url: row.demo_video_url ?? null,
    thumbnail_path: row.thumbnail_path ?? null,
    thumbnail_emoji: row.thumbnail_emoji ?? null,
    thumbnail_gradient: row.thumbnail_gradient ?? null,
    embed_status: row.embed_status ?? 'unknown',
    status: row.status,
    vote_count: row.vote_count ?? 0,
    view_count: row.view_count ?? 0,
    created_at: row.created_at,
    updated_at: row.updated_at ?? row.created_at,
    categories,
    stacks,
    author: row.author ? mapProfile(row.author) : ({} as Profile),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReview(row: any): ReviewWithAuthor {
  return {
    id: row.id,
    app_id: row.app_id,
    author_id: row.author_id,
    rating: row.rating,
    body: row.body,
    created_at: row.created_at,
    updated_at: row.updated_at ?? row.created_at,
    author: row.author ? mapProfile(row.author) : ({} as Profile),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapFeatureRequest(row: any): FeatureRequestWithAuthor {
  return {
    id: row.id,
    app_id: row.app_id,
    author_id: row.author_id,
    body: row.body,
    vote_count: row.vote_count ?? 0,
    created_at: row.created_at,
    author: row.author ? mapProfile(row.author) : ({} as Profile),
  };
}

// 싱글턴 — 각 요청마다 새 supabase 클라이언트 내부 생성
const supabaseRepo = new SupabaseRepo();
export default supabaseRepo;
