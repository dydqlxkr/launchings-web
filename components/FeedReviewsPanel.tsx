'use client';

/**
 * FeedReviewsPanel — 유튜브 쇼츠식 "그 자리에서 열리는" 리뷰 패널.
 *
 * 위치:
 *   - 데스크톱(>640px): FeedClient의 `.lp-feed-slide` flex 행에 형제로 삽입되는
 *     사이드 패널(폰 프레임 오른쪽, 레일 다음). 페이지 스크롤은 잠그지 않는다.
 *   - 모바일(≤640px): 화면 하단 바텀시트(fixed) + 딤 배경. 열려 있는 동안
 *     피드 스크롤(슬라이드 스와이프)을 잠근다. (globals.css .lp-feed-reviews-panel)
 *
 * 데이터: 앱별 모듈 캐시(reviewsCache)로 "열 때 최초 1회" 서버 조회 원칙을 지킨다.
 * 작성/수정/삭제 성공 시 서버가 revalidateTag('apps')로 SSG를 무효화하고,
 * 이 패널은 캐시를 무시하고 즉시 재조회(force)해 목록/카운트를 반영한다.
 */

import { useEffect, useRef, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { getAppReviews, submitReview, deleteReview, type AppReviewsResult } from '@/lib/actions/review';
import { useToast } from './Toast';
import ConfirmDialog from './ConfirmDialog';
import LoginModal from './LoginModal';
import AvatarCircle from './AvatarCircle';
import { Skeleton } from './Skeleton';
import { StarDisplay, StarPicker, formatReviewDate } from './StarRating';
import type { ReviewWithAuthor, ReviewStats } from '@/lib/types';

interface Props {
  appId: string;
  appSlug: string;
  appTitle: string;
  isLoggedIn: boolean;
  onClose: () => void;
  /** 서버 확정 리뷰 수로 피드 레일 카운트 동기화 */
  onReviewCountChange: (count: number) => void;
}

const EMPTY_STATS: ReviewStats = { avg_rating: 0, review_count: 0 };

// 앱별 조회 결과 캐시(모듈 스코프) — 같은 세션에서 같은 앱 패널을 다시 열 때
// 중복 네트워크 조회를 피한다. 작성/수정/삭제 후에는 force로 갱신한다.
const reviewsCache = new Map<string, AppReviewsResult>();
const inflight = new Map<string, Promise<AppReviewsResult>>();

function loadAppReviews(appId: string, opts: { force?: boolean } = {}): Promise<AppReviewsResult> {
  if (!opts.force) {
    const cached = reviewsCache.get(appId);
    if (cached) return Promise.resolve(cached);
    const existing = inflight.get(appId);
    if (existing) return existing;
  }

  const promise = getAppReviews(appId).then((res) => {
    if (!res.error) reviewsCache.set(appId, res);
    inflight.delete(appId);
    return res;
  });
  inflight.set(appId, promise);
  return promise;
}

function ReviewListItem({ review }: { review: ReviewWithAuthor }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,.03)',
        border: '1px solid var(--line)',
        borderRadius: 10,
        padding: '12px 14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <AvatarCircle profile={review.author} size={26} fontSize={11} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 12.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {review.author?.display_name ?? '사용자'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
            <StarDisplay rating={review.rating} size={11} />
            <span style={{ color: 'var(--muted)', fontSize: 11 }}>
              {formatReviewDate(review.created_at)}
            </span>
          </div>
        </div>
      </div>
      <p
        style={{
          color: '#cfd6e4',
          fontSize: 13,
          lineHeight: 1.6,
          margin: 0,
          wordBreak: 'break-word',
        }}
      >
        {review.body}
      </p>
    </div>
  );
}

export default function FeedReviewsPanel({
  appId,
  appSlug,
  appTitle,
  isLoggedIn,
  onClose,
  onReviewCountChange,
}: Props) {
  const t = useTranslations('review');
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ReviewWithAuthor[]>([]);
  const [stats, setStats] = useState<ReviewStats>(EMPTY_STATS);
  const [myReview, setMyReview] = useState<ReviewWithAuthor | null>(null);

  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const prevLoggedInRef = useRef(isLoggedIn);

  function applyResult(res: AppReviewsResult) {
    if (res.error) {
      setLoadError(res.error);
      return;
    }
    setLoadError(null);
    setReviews(res.reviews);
    setStats(res.stats);
    setMyReview(res.myReview);
    setRating(res.myReview?.rating ?? 0);
    setBody(res.myReview?.body ?? '');
    onReviewCountChange(res.stats.review_count);
  }

  // 마운트 상태 추적 — refetch 완료 시점에 이미 언마운트됐으면 setState 생략
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 조회(최초 로드/강제 재조회 공용) — effect에서도 호출되므로 setLoading(true)를
  // 마이크로태스크로 미뤄 "effect 본문에서 setState를 동기 호출"하는 패턴을 피한다
  // (react-hooks/set-state-in-effect: cascading render 경고 방지).
  function refetch(force: boolean) {
    queueMicrotask(() => setLoading(true));
    loadAppReviews(appId, { force }).then((res) => {
      if (!mountedRef.current) return;
      applyResult(res);
      setLoading(false);
    });
  }

  // 최초 로드(앱별 캐시 사용) — 초기 loading/error state는 이미 true/null 기본값이므로
  // 여기서는 refetch 호출만 한다.
  useEffect(() => {
    refetch(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId]);

  // 로그인 상태가 비로그인→로그인으로 바뀌면 개인화(내 리뷰) 반영을 위해 강제 재조회
  useEffect(() => {
    if (isLoggedIn && !prevLoggedInRef.current) {
      refetch(true);
    }
    prevLoggedInRef.current = isLoggedIn;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, appId]);

  // 열릴 때 닫기 버튼으로 포커스
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // ESC 닫기
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // 모바일 바텀시트일 때만 피드 스크롤(슬라이드 스와이프) 잠금.
  // 데스크톱 사이드 패널은 페이지 스크롤을 잠그지 않는다.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(max-width: 640px)').matches) return;

    const scrollContainer = panelRef.current?.closest('.hide-scrollbar') as HTMLElement | null;
    const prevContainerOverflow = scrollContainer?.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;

    if (scrollContainer) scrollContainer.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    return () => {
      if (scrollContainer) scrollContainer.style.overflow = prevContainerOverflow ?? '';
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);

  function handleRetry() {
    refetch(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (rating === 0) {
      setFormError(t('selectRating'));
      return;
    }
    if (!body.trim()) {
      setFormError(t('placeholder'));
      return;
    }

    const fd = new FormData();
    fd.set('app_id', appId);
    fd.set('app_slug', appSlug);
    fd.set('rating', String(rating));
    fd.set('body', body.trim());

    const wasNew = !myReview;

    startTransition(async () => {
      const result = await submitReview(fd);
      if (result.error) {
        setFormError(result.error);
        return;
      }
      toast.show(wasNew ? t('toastSubmitted') : t('toastUpdated'), 'success');
      const fresh = await loadAppReviews(appId, { force: true });
      applyResult(fresh);
    });
  }

  function handleDelete() {
    if (!myReview) return;
    setConfirmDeleteOpen(true);
  }

  function handleDeleteConfirmed() {
    setConfirmDeleteOpen(false);
    if (!myReview) return;

    startTransition(async () => {
      const result = await deleteReview(myReview.id, appSlug);
      if (result.error) {
        setFormError(result.error);
        return;
      }
      toast.show(t('toastDeleted'), 'info');
      const fresh = await loadAppReviews(appId, { force: true });
      applyResult(fresh);
    });
  }

  return (
    <>
      {/* 모바일 전용 딤 배경 — 데스크톱에서는 CSS로 숨김 */}
      <div className="lp-feed-reviews-backdrop" onClick={onClose} aria-hidden="true" />

      <div
        ref={panelRef}
        className="lp-feed-reviews-panel"
        role="dialog"
        aria-label={`${appTitle} 리뷰`}
      >
        {/* 헤더 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            padding: '14px 16px',
            borderBottom: '1px solid var(--line)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0, whiteSpace: 'nowrap' }}>
              {t('sectionTitle')}
              {stats.review_count > 0 ? ` ${stats.review_count}` : ''}
            </h2>
            {stats.review_count > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--muted)' }}>
                <StarDisplay rating={Math.round(stats.avg_rating)} size={12} />
                {stats.avg_rating.toFixed(1)}
              </span>
            )}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="닫기"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              fontSize: 20,
              cursor: 'pointer',
              lineHeight: 1,
              padding: 4,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* 목록 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Skeleton variant="card" height={62} style={{ borderRadius: 10 }} />
              <Skeleton variant="card" height={62} style={{ borderRadius: 10 }} />
              <Skeleton variant="card" height={62} style={{ borderRadius: 10 }} />
            </div>
          ) : loadError ? (
            <div style={{ textAlign: 'center', padding: '28px 12px' }}>
              <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12 }}>{loadError}</p>
              <button
                type="button"
                onClick={handleRetry}
                style={{
                  background: 'var(--chip)',
                  border: '1px solid var(--line)',
                  borderRadius: 9,
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--ink)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                다시 시도
              </button>
            </div>
          ) : reviews.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: '28px 12px' }}>
              {t('noReviews')}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {reviews.map((review) => (
                <ReviewListItem key={review.id} review={review} />
              ))}
            </div>
          )}
        </div>

        {/* 작성 영역 (하단 고정) */}
        <div style={{ borderTop: '1px solid var(--line)', padding: '12px 14px', flexShrink: 0 }}>
          {!isLoggedIn ? (
            <button
              type="button"
              onClick={() => setShowLogin(true)}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg,var(--brand),var(--brand2))',
                border: 'none',
                borderRadius: 9,
                padding: '11px 0',
                fontSize: 13,
                fontWeight: 700,
                color: '#fff',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {t('loginButton')}
            </button>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <StarPicker value={rating} onChange={setRating} size={20} />
                {myReview && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isPending}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ff6b6b',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: isPending ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                      padding: 0,
                    }}
                  >
                    {t('delete')}
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={t('placeholder')}
                  maxLength={1000}
                  rows={1}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,.05)',
                    border: '1px solid var(--line)',
                    borderRadius: 9,
                    padding: '9px 12px',
                    fontSize: 13,
                    color: 'var(--ink)',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    outline: 'none',
                    resize: 'none',
                    minHeight: 38,
                    maxHeight: 80,
                  }}
                />
                <button
                  type="submit"
                  disabled={isPending}
                  style={{
                    flexShrink: 0,
                    background: isPending ? 'var(--chip)' : 'linear-gradient(135deg,var(--brand),var(--brand2))',
                    border: 'none',
                    borderRadius: 9,
                    padding: '10px 14px',
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: isPending ? 'var(--muted)' : '#fff',
                    cursor: isPending ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isPending ? '저장 중...' : myReview ? t('update') : t('submit')}
                </button>
              </div>

              {formError && (
                <p style={{ color: '#ff6b6b', fontSize: 12, marginTop: 6, marginBottom: 0 }}>{formError}</p>
              )}
            </form>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title={t('confirmDelete')}
        confirmLabel={t('delete')}
        danger
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmDeleteOpen(false)}
      />

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} reason="review" />
    </>
  );
}
