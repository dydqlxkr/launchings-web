/**
 * Repository 인터페이스 — 데이터 접근 추상화 경계.
 *
 * Phase 1: LocalRepo (data/seed.ts) 구현
 * Phase 2: SupabaseRepo 구현으로 교체 — 이 인터페이스는 변경 없음.
 *
 * 호출부(페이지/서버 컴포넌트)는 getRepo()를 통해 구현체를 받으므로
 * Phase 2 전환 시 getRepo()의 return만 바꾸면 된다.
 */

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

export interface IAppRepo {
  /** 앱 목록 조회 (published만). 검색·카테고리·정렬 적용 */
  listApps(filters: AppFilters): Promise<AppWithRelations[]>;

  /** 슬러그로 앱 단건 조회 */
  getAppBySlug(slug: string): Promise<AppWithRelations | null>;

  /** 모든 앱 슬러그 목록 (정적 경로 생성용) */
  listAppSlugs(): Promise<string[]>;
}

export interface IProfileRepo {
  /** 메이커 목록 조회 */
  listProfiles(): Promise<Profile[]>;

  /** handle로 메이커 단건 조회 */
  getProfileByHandle(handle: string): Promise<Profile | null>;

  /** 모든 handle 목록 (정적 경로 생성용) */
  listHandles(): Promise<string[]>;

  /** 메이커가 만든 앱 목록 */
  listAppsByAuthor(authorId: string): Promise<AppWithRelations[]>;
}

export interface ICategoryRepo {
  /** 카테고리 전체 목록 */
  listCategories(): Promise<Category[]>;
}

export interface IReviewRepo {
  /** 앱의 리뷰 목록 조회 (작성자 포함) */
  listReviews(appId: string): Promise<ReviewWithAuthor[]>;

  /** 앱의 평균 평점 + 리뷰 수 */
  getReviewStats(appId: string): Promise<ReviewStats>;

  /** 특정 사용자가 해당 앱에 작성한 리뷰 (없으면 null) */
  getMyReview(appId: string, userId: string): Promise<ReviewWithAuthor | null>;
}

export interface IFeatureRequestRepo {
  /** 앱의 기능 요청 목록 (vote_count 내림차순) */
  listFeatureRequests(appId: string): Promise<FeatureRequestWithAuthor[]>;

  /** 특정 사용자가 앱의 기능 요청에 투표한 request_id 집합 */
  getMyFeatureVotes(appId: string, userId: string): Promise<Set<string>>;
}

export interface IBookmarkRepo {
  /** 사용자가 북마크한 앱 목록 */
  listBookmarkedApps(userId: string): Promise<AppWithRelations[]>;

  /** 사용자가 북마크한 앱 id 집합 */
  getMyBookmarkIds(userId: string): Promise<Set<string>>;
}

export interface IFollowRepo {
  /** 팔로우 상태 및 팔로워 수 조회 (viewerId가 null이면 following=false) */
  getFollowStatus(targetId: string, viewerId: string | null): Promise<FollowStatus>;
}

export interface IRepo extends IAppRepo, IProfileRepo, ICategoryRepo, IReviewRepo, IFeatureRequestRepo, IBookmarkRepo, IFollowRepo {}
