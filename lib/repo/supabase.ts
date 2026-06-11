/**
 * Phase 2 Supabase 구현체 — IRepo를 Supabase Postgres 읽기로 구현.
 *
 * ── 캐시 전략 (Next.js 16 / unstable_cache + revalidateTag) ──────────────
 * 비개인화 읽기 메서드는 unstable_cache로 래핑 + tags 옵션으로 태그 지정.
 *   - revalidate: 300(5분) 기본 폴백 — view_count 등 태그 무효화 안 하는 변경 신선도 보장
 *
 * 참고: Next.js 16 공식 문서(node_modules/next/dist/docs/...unstable_cache.md)에서
 * unstable_cache는 'use cache'로 교체가 권장되나, cacheComponents: true 활성화 시
 * 기존 `export const dynamic = 'force-dynamic'` 페이지와 충돌한다.
 * 이 프로젝트는 페이지 레벨 dynamic 설정을 건드리지 않는 조건이므로
 * cacheComponents 없이 동작하는 unstable_cache를 선택한다.
 *
 * 'use cache' 스코프에서 cookies()를 읽으면 캐시 오염이 발생하므로
 * 캐시 함수 내부에서는 publicSupabase(쿠키 없는 anon 클라이언트)를 사용한다.
 * 개인화 메서드(getMyReview 등)는 캐시 없이 cookied 클라이언트 유지.
 *
 * 쓰기(등록/업보트)는 별도 Server Action(lib/actions/)에서 처리.
 */

import { unstable_cache } from 'next/cache';
import { publicSupabase } from '@/lib/supabase/publicClient';
import { createClient } from '@/lib/supabase/server';
import type {
  AppWithRelations,
  AppScreenshot,
  Category,
  Profile,
  AppFilters,
  ReviewWithAuthor,
  ReviewStats,
  FeatureRequestWithAuthor,
  FollowStatus,
} from '@/lib/types';
import type { IRepo } from './interface';

// ── 캐시 태그 상수 ────────────────────────────────────────────────────────
// 무효화 측(lib/actions/*)과 동일 문자열을 공유한다.
export const CACHE_TAGS = {
  apps: 'apps',
  appSlug: (slug: string) => `app:${slug}`,
  appId: (id: string) => `app-id:${id}`,
  categories: 'categories',
  reviews: (appId: string) => `reviews:${appId}`,
  featureRequests: (appId: string) => `feature-requests:${appId}`,
  maker: (handle: string) => `maker:${handle}`,
  makerId: (id: string) => `maker-id:${id}`,
} as const;

// 공통 revalidate 초 (시간 폴백 — 태그 무효화 없는 변경의 신선도 보장)
const REVALIDATE_DEFAULT = 300; // 5분
const REVALIDATE_LONG = 3600;   // 1시간 (카테고리처럼 잘 안 바뀌는 것)

// ── 매핑 헬퍼 ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProfile(row: any): Profile {
  return {
    id: row.id,
    handle: row.handle,
    display_name: row.display_name ?? row.handle,
    bio: row.bio ?? null,
    avatar_url: row.avatar_url ?? null,
    avatar_gradient: null,
    avatar_initial: null,
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

// ── 캐시된 데이터 페처 ────────────────────────────────────────────────────
// unstable_cache(fetchFn, keyParts, options) 패턴.
// keyParts는 함수를 유일하게 식별하는 이름 배열.
// 인자가 있는 함수는 fetchFn 내부에서 클로저로 캡처되거나 인자로 받는다.

const _listAppsCached = unstable_cache(
  async (filters: AppFilters): Promise<AppWithRelations[]> => {
    const APP_COLS = [
      'id', 'author_id', 'slug', 'title', 'tagline', 'description',
      'app_type', 'live_url', 'store_url_ios', 'store_url_android',
      'demo_video_url', 'thumbnail_path', 'thumbnail_emoji',
      'thumbnail_gradient', 'embed_status', 'status',
      'vote_count', 'view_count', 'created_at', 'updated_at',
    ].join(', ');

    const catJoin = (filters.cat && filters.cat !== 'all')
      ? 'app_categories!inner(category_slug)'
      : 'app_categories(category_slug)';

    let query = publicSupabase
      .from('apps')
      .select(`
        ${APP_COLS},
        author:profiles!author_id(*),
        ${catJoin},
        app_stacks(stack)
      `)
      .eq('status', 'published');

    if (filters.cat && filters.cat !== 'all') {
      query = query.eq('app_categories.category_slug', filters.cat);
    }

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

    // 검색어 필터 (서버측 FTS 대신 인메모리 필터 — v1 단순화)
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

    return apps;
  },
  ['listApps'],
  { tags: [CACHE_TAGS.apps], revalidate: REVALIDATE_DEFAULT }
);

const _getAppsByIdsCached = unstable_cache(
  async (ids: string[]): Promise<AppWithRelations[]> => {
    if (ids.length === 0) return [];

    const COMPARE_COLS = [
      'id', 'author_id', 'slug', 'title', 'tagline', 'description',
      'app_type', 'live_url', 'store_url_ios', 'store_url_android',
      'demo_video_url', 'thumbnail_path', 'thumbnail_emoji',
      'thumbnail_gradient', 'embed_status', 'status',
      'vote_count', 'view_count', 'created_at', 'updated_at',
    ].join(', ');

    const { data, error } = await publicSupabase
      .from('apps')
      .select(`
        ${COMPARE_COLS},
        author:profiles!author_id(*),
        app_categories(category_slug),
        app_stacks(stack)
      `)
      .in('id', ids)
      .eq('status', 'published');

    if (error || !data) {
      console.error('[SupabaseRepo] getAppsByIds error:', error?.message);
      return [];
    }

    const mapped = (data ?? []).map(mapApp);
    const byId = new Map(mapped.map((a) => [a.id, a]));
    return ids.map((id) => byId.get(id)).filter(Boolean) as AppWithRelations[];
  },
  ['getAppsByIds'],
  { tags: [CACHE_TAGS.apps], revalidate: REVALIDATE_DEFAULT }
);

const _getAppBySlugCached = unstable_cache(
  async (slug: string): Promise<AppWithRelations | null> => {
    const { data, error } = await publicSupabase
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
  },
  ['getAppBySlug'],
  // tags: apps + app:slug — 앱 수정/삭제 시 해당 슬러그만 무효화 가능
  // 태그는 tags 옵션에서 정적으로 지정해야 하므로 슬러그별 동적 태그는
  // 여기서 지정하지 않고 apps 태그로만 커버한다.
  // (unstable_cache는 인자가 캐시 키에 포함되므로 slug별 엔트리는 분리됨)
  { tags: [CACHE_TAGS.apps], revalidate: REVALIDATE_DEFAULT }
);

const _listAppSlugsCached = unstable_cache(
  async (): Promise<string[]> => {
    const { data, error } = await publicSupabase
      .from('apps')
      .select('slug')
      .eq('status', 'published');

    if (error || !data) return [];
    return data.map((r: { slug: string }) => r.slug);
  },
  ['listAppSlugs'],
  { tags: [CACHE_TAGS.apps], revalidate: REVALIDATE_DEFAULT }
);

const _listProfilesCached = unstable_cache(
  async (): Promise<Profile[]> => {
    const { data, error } = await publicSupabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(mapProfile);
  },
  ['listProfiles'],
  // author 임베드가 apps에 포함되므로 apps 태그로 연결
  { tags: [CACHE_TAGS.apps], revalidate: REVALIDATE_DEFAULT }
);

const _getProfileByHandleCached = unstable_cache(
  async (handle: string): Promise<Profile | null> => {
    const { data, error } = await publicSupabase
      .from('profiles')
      .select('*')
      .eq('handle', handle)
      .single();

    if (error || !data) return null;
    return mapProfile(data);
  },
  ['getProfileByHandle'],
  { tags: [CACHE_TAGS.apps], revalidate: REVALIDATE_DEFAULT }
  // maker:handle 태그는 무효화 시 revalidateTag로 지정.
  // unstable_cache의 tags는 정적이므로 동적 handle 태그를 여기에 추가할 수 없음.
  // 대신 apps 태그(프로필 변경 → apps 태그 무효화)로 커버.
);

const _listHandlesCached = unstable_cache(
  async (): Promise<string[]> => {
    const { data, error } = await publicSupabase
      .from('profiles')
      .select('handle');

    if (error || !data) return [];
    return data.map((r: { handle: string }) => r.handle);
  },
  ['listHandles'],
  { tags: [CACHE_TAGS.apps], revalidate: REVALIDATE_DEFAULT }
);

const _listAppsByAuthorCached = unstable_cache(
  async (authorId: string): Promise<AppWithRelations[]> => {
    const { data, error } = await publicSupabase
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
  },
  ['listAppsByAuthor'],
  { tags: [CACHE_TAGS.apps], revalidate: REVALIDATE_DEFAULT }
);

const _listCategoriesCached = unstable_cache(
  async (): Promise<Category[]> => {
    const { data, error } = await publicSupabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error || !data) return [];
    return data as Category[];
  },
  ['listCategories'],
  { tags: [CACHE_TAGS.categories], revalidate: REVALIDATE_LONG }
);

const _listScreenshotsCached = unstable_cache(
  async (appId: string): Promise<AppScreenshot[]> => {
    const { data, error } = await publicSupabase
      .from('app_screenshots')
      .select('storage_path, sort_order')
      .eq('app_id', appId)
      .order('sort_order', { ascending: true });

    if (error || !data) {
      console.error('[SupabaseRepo] listScreenshots error:', error?.message);
      return [];
    }

    return data as AppScreenshot[];
  },
  ['listScreenshots'],
  { tags: [CACHE_TAGS.apps], revalidate: REVALIDATE_DEFAULT }
);

const _listReviewsCached = unstable_cache(
  async (appId: string): Promise<ReviewWithAuthor[]> => {
    const { data, error } = await publicSupabase
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
  },
  ['listReviews'],
  { tags: [CACHE_TAGS.apps], revalidate: REVALIDATE_DEFAULT }
);

const _getReviewStatsCached = unstable_cache(
  async (appId: string): Promise<ReviewStats> => {
    const { data, error } = await publicSupabase
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
  },
  ['getReviewStats'],
  { tags: [CACHE_TAGS.apps], revalidate: REVALIDATE_DEFAULT }
);

const _listFeatureRequestsCached = unstable_cache(
  async (appId: string): Promise<FeatureRequestWithAuthor[]> => {
    const { data, error } = await publicSupabase
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
  },
  ['listFeatureRequests'],
  { tags: [CACHE_TAGS.apps], revalidate: REVALIDATE_DEFAULT }
);

// ── SupabaseRepo 클래스 ───────────────────────────────────────────────────
// 비개인화 메서드: 위의 unstable_cache 래퍼에 위임.
// 개인화 메서드: cookied 클라이언트로 직접 처리.

class SupabaseRepo implements IRepo {
  // ── App ──────────────────────────────────────────────────

  listApps(filters: AppFilters): Promise<AppWithRelations[]> {
    return _listAppsCached(filters);
  }

  getAppsByIds(ids: string[]): Promise<AppWithRelations[]> {
    return _getAppsByIdsCached(ids);
  }

  getAppBySlug(slug: string): Promise<AppWithRelations | null> {
    return _getAppBySlugCached(slug);
  }

  listAppSlugs(): Promise<string[]> {
    return _listAppSlugsCached();
  }

  // ── Profile ──────────────────────────────────────────────

  listProfiles(): Promise<Profile[]> {
    return _listProfilesCached();
  }

  getProfileByHandle(handle: string): Promise<Profile | null> {
    return _getProfileByHandleCached(handle);
  }

  listHandles(): Promise<string[]> {
    return _listHandlesCached();
  }

  listAppsByAuthor(authorId: string): Promise<AppWithRelations[]> {
    return _listAppsByAuthorCached(authorId);
  }

  // ── Category ─────────────────────────────────────────────

  listCategories(): Promise<Category[]> {
    return _listCategoriesCached();
  }

  // ── Screenshot ───────────────────────────────────────────

  listScreenshots(appId: string): Promise<AppScreenshot[]> {
    return _listScreenshotsCached(appId);
  }

  // ── Review ───────────────────────────────────────────────

  listReviews(appId: string): Promise<ReviewWithAuthor[]> {
    return _listReviewsCached(appId);
  }

  getReviewStats(appId: string): Promise<ReviewStats> {
    return _getReviewStatsCached(appId);
  }

  // getMyReview — 개인화: 캐시 불가, cookied 클라이언트 사용
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

  listFeatureRequests(appId: string): Promise<FeatureRequestWithAuthor[]> {
    return _listFeatureRequestsCached(appId);
  }

  // getMyFeatureVotes — 개인화: 캐시 불가, cookied 클라이언트 사용
  async getMyFeatureVotes(appId: string, userId: string): Promise<Set<string>> {
    const supabase = await createClient();

    const { data: requestsData, error: requestsError } = await supabase
      .from('feature_requests')
      .select('id')
      .eq('app_id', appId);

    if (requestsError || !requestsData || requestsData.length === 0) {
      return new Set();
    }

    const requestIds = (requestsData as { id: string }[]).map((r) => r.id);

    const { data, error } = await supabase
      .from('feature_request_votes')
      .select('request_id')
      .eq('user_id', userId)
      .in('request_id', requestIds);

    if (error || !data) return new Set();
    return new Set((data as { request_id: string }[]).map((r) => r.request_id));
  }

  // ── Bookmark — 개인화: 캐시 불가, cookied 클라이언트 사용 ───────────────

  async listBookmarkedApps(userId: string): Promise<AppWithRelations[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('bookmarks')
      .select(`
        app:apps!app_id(
          *,
          author:profiles!author_id(*),
          app_categories(category_slug),
          app_stacks(stack)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('[SupabaseRepo] listBookmarkedApps error:', error?.message);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[])
      .map((row) => row.app)
      .filter(Boolean)
      .filter((app: { status: string }) => app.status === 'published')
      .map(mapApp);
  }

  async getMyBookmarkIds(userId: string): Promise<Set<string>> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('bookmarks')
      .select('app_id')
      .eq('user_id', userId);

    if (error || !data) return new Set();
    return new Set((data as { app_id: string }[]).map((r) => r.app_id));
  }

  // ── Follow ── 팔로워 수는 공개이지만 following 여부는 개인화 ─────────────
  // 전체를 캐시하면 개인화 필드(following)가 오염되므로 캐시하지 않는다.

  async getFollowStatus(targetId: string, viewerId: string | null): Promise<FollowStatus> {
    const supabase = await createClient();

    const { count, error: countError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', targetId);

    const follower_count = countError ? 0 : (count ?? 0);

    if (!viewerId) {
      return { following: false, follower_count };
    }

    const { data, error } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('following_id', targetId)
      .eq('follower_id', viewerId)
      .maybeSingle();

    if (error) return { following: false, follower_count };
    return { following: !!data, follower_count };
  }
}

// 싱글턴 — 클래스는 상태를 가지지 않으므로 모듈 스코프 단일 인스턴스로 충분
const supabaseRepo = new SupabaseRepo();
export default supabaseRepo;
