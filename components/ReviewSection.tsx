'use client';

/**
 * 리뷰 섹션 — 앱 상세 페이지에 포함.
 * - 평균 별점 + 리뷰 수 표시
 * - 리뷰 목록 (작성자 아바타/이름/별점/본문/날짜)
 * - 로그인 사용자용 리뷰 작성/수정 폼
 * - 비로그인 시 LoginModal 유도
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { submitReview, deleteReview } from '@/lib/actions/review';
import { useToast } from '@/components/Toast';
import type { ReviewWithAuthor, ReviewStats } from '@/lib/types';

interface Props {
  appId: string;
  appSlug: string;
  reviews: ReviewWithAuthor[];
  stats: ReviewStats;
  myReview: ReviewWithAuthor | null;
  isLoggedIn: boolean;
  onLoginRequest: () => void;
}

function StarDisplay({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }} aria-label={`${rating}점`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          style={{
            fontSize: size,
            color: n <= rating ? '#fbbf24' : 'var(--line)',
            lineHeight: 1,
          }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'inline-flex', gap: 4 }} role="group" aria-label="별점 선택">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${n}점`}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            fontSize: 26,
            color: n <= (hover || value) ? '#fbbf24' : 'var(--line)',
            lineHeight: 1,
            transition: 'color .08s',
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

export default function ReviewSection({
  appId,
  appSlug,
  reviews,
  stats,
  myReview,
  isLoggedIn,
  onLoginRequest,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [rating, setRating] = useState(myReview?.rating ?? 0);
  const [body, setBody] = useState(myReview?.body ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // 현재 표시할 리뷰 목록 (낙관적 업데이트 없이 서버 데이터 사용)
  const displayReviews = reviews;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError('별점을 선택해 주세요.');
      return;
    }
    if (!body.trim()) {
      setError('리뷰 내용을 입력해 주세요.');
      return;
    }

    const fd = new FormData();
    fd.set('app_id', appId);
    fd.set('app_slug', appSlug);
    fd.set('rating', String(rating));
    fd.set('body', body.trim());

    startTransition(async () => {
      const result = await submitReview(fd);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSubmitted(true);
      toast.show(myReview ? '리뷰가 수정됐습니다.' : '리뷰가 등록됐습니다.', 'success');
      router.refresh();
    });
  }

  function handleDelete() {
    if (!myReview) return;
    if (!window.confirm('리뷰를 삭제하시겠습니까?')) return;

    startTransition(async () => {
      const result = await deleteReview(myReview.id, appSlug);
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.show('리뷰가 삭제됐습니다.', 'info');
      router.refresh();
    });
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,.05)',
    border: '1px solid var(--line)',
    borderRadius: 10,
    padding: '12px 14px',
    fontSize: 14,
    color: 'var(--ink)',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    outline: 'none',
    resize: 'vertical',
    minHeight: 90,
  };

  return (
    <section
      style={{
        marginTop: 40,
        paddingTop: 32,
        borderTop: '1px solid var(--line)',
      }}
    >
      {/* 섹션 헤더 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        <h2
          style={{
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: '-.3px',
            margin: 0,
          }}
        >
          리뷰
        </h2>

        {stats.review_count > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StarDisplay rating={Math.round(stats.avg_rating)} size={18} />
            <span style={{ fontWeight: 700, fontSize: 16 }}>
              {stats.avg_rating.toFixed(1)}
            </span>
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>
              ({stats.review_count}개)
            </span>
          </div>
        )}

        {stats.review_count === 0 && (
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>
            아직 리뷰가 없습니다. 첫 리뷰를 남겨보세요!
          </span>
        )}
      </div>

      {/* 리뷰 작성 폼 */}
      {!isLoggedIn ? (
        <div
          style={{
            background: 'rgba(255,255,255,.03)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            padding: '20px 22px',
            marginBottom: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>
            리뷰를 남기려면 로그인이 필요합니다.
          </p>
          <button
            onClick={onLoginRequest}
            style={{
              background: 'linear-gradient(135deg,var(--brand),var(--brand2))',
              border: 'none',
              borderRadius: 9,
              padding: '9px 18px',
              fontSize: 13,
              fontWeight: 700,
              color: '#fff',
              cursor: 'pointer',
              fontFamily: 'inherit',
              flexShrink: 0,
            }}
          >
            로그인하고 리뷰 쓰기
          </button>
        </div>
      ) : (
        <div
          style={{
            background: 'rgba(255,255,255,.03)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            padding: '20px 22px',
            marginBottom: 28,
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, marginTop: 0 }}>
            {myReview ? '내 리뷰 수정' : '리뷰 작성'}
          </h3>

          {submitted ? (
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>리뷰가 저장됐습니다.</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <StarPicker value={rating} onChange={setRating} />
              </div>

              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="이 앱을 사용해본 경험을 공유해 주세요. (최대 1000자)"
                maxLength={1000}
                style={inputStyle as React.CSSProperties}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 6,
                }}
              >
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {body.length} / 1000
                </span>
              </div>

              {error && (
                <p style={{ color: '#ff6b6b', fontSize: 13, marginTop: 8 }}>{error}</p>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  disabled={isPending}
                  style={{
                    background: isPending
                      ? 'var(--chip)'
                      : 'linear-gradient(135deg,var(--brand),var(--brand2))',
                    border: 'none',
                    borderRadius: 9,
                    padding: '10px 20px',
                    fontSize: 13,
                    fontWeight: 700,
                    color: isPending ? 'var(--muted)' : '#fff',
                    cursor: isPending ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {isPending ? '저장 중...' : myReview ? '수정 완료' : '리뷰 등록'}
                </button>

                {myReview && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isPending}
                    style={{
                      background: 'none',
                      border: '1px solid rgba(255,107,107,.4)',
                      borderRadius: 9,
                      padding: '10px 16px',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#ff6b6b',
                      cursor: isPending ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    삭제
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      )}

      {/* 리뷰 목록 */}
      {displayReviews.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {displayReviews.map((review) => (
            <div
              key={review.id}
              style={{
                background: 'rgba(255,255,255,.03)',
                border: '1px solid var(--line)',
                borderRadius: 12,
                padding: '16px 18px',
              }}
            >
              {/* 작성자 + 별점 헤더 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 10,
                  flexWrap: 'wrap',
                }}
              >
                {/* 아바타 */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg,var(--brand),var(--brand2))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 800,
                    color: '#fff',
                    flexShrink: 0,
                  }}
                >
                  {review.author?.display_name?.[0] ?? '?'}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>
                    {review.author?.display_name ?? '사용자'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <StarDisplay rating={review.rating} size={13} />
                    <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 본문 */}
              <p
                style={{
                  color: '#cfd6e4',
                  fontSize: 14,
                  lineHeight: 1.65,
                  margin: 0,
                  wordBreak: 'break-word',
                }}
              >
                {review.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
