/**
 * Phase 1 로컬 구현체 — data/seed.ts에서 데이터를 읽어 인터페이스를 구현.
 * Phase 2에서 SupabaseRepo로 교체 시 이 파일만 대체한다.
 */

import { APPS, PROFILES, CATEGORIES } from '@/data/seed';
import type {
  AppWithRelations,
  Category,
  Profile,
  AppFilters,
  ReviewWithAuthor,
  ReviewStats,
  FeatureRequestWithAuthor,
  FollowStatus,
} from '@/lib/types';
import type { IRepo } from './interface';

function matchSearch(app: AppWithRelations, q: string): boolean {
  const hay = [
    app.title,
    app.tagline ?? '',
    app.description,
    ...(app.stacks ?? []),
    app.author?.display_name ?? '',
  ]
    .join(' ')
    .toLowerCase();
  return hay.includes(q.toLowerCase());
}

class LocalRepo implements IRepo {
  // ── App ──────────────────────────────────────────────────

  async listApps(filters: AppFilters): Promise<AppWithRelations[]> {
    let list = APPS.filter((a) => a.status === 'published');

    if (filters.q && filters.q.trim()) {
      list = list.filter((a) => matchSearch(a, filters.q!.trim()));
    }

    if (filters.cat && filters.cat !== 'all') {
      list = list.filter((a) => a.categories.includes(filters.cat!));
    }

    const sort = filters.sort ?? 'votes';
    if (sort === 'votes') {
      list = [...list].sort((a, b) => b.vote_count - a.vote_count);
    } else {
      // newest: created_at 내림차순
      list = [...list].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return list;
  }

  async getAppBySlug(slug: string): Promise<AppWithRelations | null> {
    return APPS.find((a) => a.slug === slug && a.status === 'published') ?? null;
  }

  async listAppSlugs(): Promise<string[]> {
    return APPS.filter((a) => a.status === 'published').map((a) => a.slug);
  }

  // ── Profile ──────────────────────────────────────────────

  async listProfiles(): Promise<Profile[]> {
    return PROFILES;
  }

  async getProfileByHandle(handle: string): Promise<Profile | null> {
    return PROFILES.find((p) => p.handle === handle) ?? null;
  }

  async listHandles(): Promise<string[]> {
    return PROFILES.map((p) => p.handle);
  }

  async listAppsByAuthor(authorId: string): Promise<AppWithRelations[]> {
    return APPS.filter(
      (a) => a.author_id === authorId && a.status === 'published'
    ).sort((a, b) => b.vote_count - a.vote_count);
  }

  // ── Category ─────────────────────────────────────────────

  async listCategories(): Promise<Category[]> {
    return CATEGORIES;
  }

  // ── Review (로컬 구현 — 빈 데이터 반환) ──────────────────

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async listReviews(_appId: string): Promise<ReviewWithAuthor[]> {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getReviewStats(_appId: string): Promise<ReviewStats> {
    return { avg_rating: 0, review_count: 0 };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getMyReview(_appId: string, _userId: string): Promise<ReviewWithAuthor | null> {
    return null;
  }

  // ── Feature Request (로컬 구현 — 빈 데이터 반환) ─────────

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async listFeatureRequests(_appId: string): Promise<FeatureRequestWithAuthor[]> {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getMyFeatureVotes(_appId: string, _userId: string): Promise<Set<string>> {
    return new Set();
  }

  // ── Bookmark (로컬 구현 — 빈 데이터 반환) ────────────────

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async listBookmarkedApps(_userId: string): Promise<AppWithRelations[]> {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getMyBookmarkIds(_userId: string): Promise<Set<string>> {
    return new Set();
  }

  // ── Follow (로컬 구현 — 빈 데이터 반환) ──────────────────

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getFollowStatus(_targetId: string, _viewerId: string | null): Promise<FollowStatus> {
    return { following: false, follower_count: 0 };
  }
}

// 싱글턴 — 서버 컴포넌트 내에서 import 시 동일 인스턴스
const localRepo = new LocalRepo();
export default localRepo;
