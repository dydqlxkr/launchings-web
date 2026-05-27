'use client';

/**
 * 기능 요청 섹션 — 앱 상세 페이지에 포함.
 * - 기능 요청 목록 (vote_count 내림차순, 막대 도표 포함)
 * - 로그인 사용자용 기능 제안 폼
 * - 낙관적 업보트 토글
 * - 비로그인 시 LoginModal 유도
 */

import { useState, useTransition } from 'react';
import {
  addFeatureRequest,
  toggleFeatureVote,
  deleteFeatureRequest,
} from '@/lib/actions/featureRequest';
import type { FeatureRequestWithAuthor } from '@/lib/types';

interface Props {
  appId: string;
  /** 현재 사용하지 않음 — 향후 revalidatePath 등에 활용 가능 */
  appSlug?: string;
  requests: FeatureRequestWithAuthor[];
  /** 현재 로그인 사용자가 투표한 request_id 집합 */
  myVotedIds: string[];
  isLoggedIn: boolean;
  userId?: string;
  onLoginRequest: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

export default function FeatureRequestSection({
  appId,
  requests: initialRequests,
  myVotedIds,
  isLoggedIn,
  userId,
  onLoginRequest,
}: Props) {
  const [isPending, startTransition] = useTransition();

  // 낙관적 목록 상태
  const [requests, setRequests] =
    useState<FeatureRequestWithAuthor[]>(initialRequests);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set(myVotedIds));

  // 입력 폼 상태
  const [body, setBody] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitPending, setSubmitPending] = useState(false);

  // 최대 vote_count (막대 도표 기준)
  const maxVotes = Math.max(...requests.map((r) => r.vote_count), 1);

  // ── 업보트 토글 ─────────────────────────────
  function handleVote(requestId: string) {
    if (!isLoggedIn) {
      onLoginRequest();
      return;
    }

    const isVoted = votedIds.has(requestId);

    // 낙관적 업데이트
    setRequests((prev) =>
      prev
        .map((r) =>
          r.id === requestId
            ? { ...r, vote_count: r.vote_count + (isVoted ? -1 : 1) }
            : r
        )
        .sort((a, b) => b.vote_count - a.vote_count)
    );
    setVotedIds((prev) => {
      const next = new Set(prev);
      if (isVoted) next.delete(requestId);
      else next.add(requestId);
      return next;
    });

    startTransition(async () => {
      const result = await toggleFeatureVote(requestId);
      if (result.error) {
        // 롤백
        setRequests((prev) =>
          prev
            .map((r) =>
              r.id === requestId
                ? { ...r, vote_count: r.vote_count + (isVoted ? 1 : -1) }
                : r
            )
            .sort((a, b) => b.vote_count - a.vote_count)
        );
        setVotedIds((prev) => {
          const next = new Set(prev);
          if (isVoted) next.add(requestId);
          else next.delete(requestId);
          return next;
        });
      } else if (!result.error && result.vote_count !== undefined) {
        // 서버 확정값으로 동기화
        const confirmedCount = result.vote_count;
        setRequests((prev) =>
          prev
            .map((r) =>
              r.id === requestId
                ? { ...r, vote_count: confirmedCount }
                : r
            )
            .sort((a, b) => b.vote_count - a.vote_count)
        );
      }
    });
  }

  // ── 기능 제안 등록 ───────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const trimmed = body.trim();
    if (trimmed.length < 4) {
      setFormError('기능 요청은 4자 이상 입력해 주세요.');
      return;
    }
    if (trimmed.length > 200) {
      setFormError('기능 요청은 200자 이하로 입력해 주세요.');
      return;
    }

    setSubmitPending(true);
    startTransition(async () => {
      const result = await addFeatureRequest(appId, trimmed);
      setSubmitPending(false);
      if (result.error) {
        setFormError(result.error);
        return;
      }
      setBody('');
      // 페이지 새로고침으로 최신 목록 반영
      window.location.reload();
    });
  }

  // ── 삭제 ────────────────────────────────────
  function handleDelete(requestId: string) {
    if (!window.confirm('기능 요청을 삭제하시겠습니까?')) return;

    // 낙관적 삭제
    setRequests((prev) => prev.filter((r) => r.id !== requestId));

    startTransition(async () => {
      const result = await deleteFeatureRequest(requestId);
      if (!('ok' in result)) {
        // 롤백: 페이지 새로고침
        window.location.reload();
      }
    });
  }

  const textareaStyle: React.CSSProperties = {
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
    minHeight: 72,
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
          gap: 12,
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
          기능 요청
        </h2>
        {requests.length > 0 && (
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>
            ({requests.length}개)
          </span>
        )}
      </div>

      {/* 기능 제안 폼 */}
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
            기능을 제안하려면 로그인이 필요합니다.
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
            로그인하고 기능 제안
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
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, marginTop: 0 }}>
            기능 제안
          </h3>
          <form onSubmit={handleSubmit}>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="원하는 기능을 제안해 주세요. (4~200자)"
              maxLength={200}
              style={textareaStyle}
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
                {body.length} / 200
              </span>
            </div>

            {formError && (
              <p style={{ color: '#ff6b6b', fontSize: 13, marginTop: 8 }}>
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending || submitPending}
              style={{
                marginTop: 10,
                background:
                  isPending || submitPending
                    ? 'var(--chip)'
                    : 'linear-gradient(135deg,var(--brand),var(--brand2))',
                border: 'none',
                borderRadius: 9,
                padding: '10px 20px',
                fontSize: 13,
                fontWeight: 700,
                color: isPending || submitPending ? 'var(--muted)' : '#fff',
                cursor: isPending || submitPending ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {isPending || submitPending ? '등록 중...' : '기능 제안'}
            </button>
          </form>
        </div>
      )}

      {/* 빈 상태 */}
      {requests.length === 0 && (
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          아직 기능 요청이 없어요. 원하는 기능을 제안해보세요!
        </p>
      )}

      {/* 기능 요청 목록 */}
      {requests.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {requests.map((req) => {
            const isVoted = votedIds.has(req.id);
            const barPct = maxVotes > 0 ? (req.vote_count / maxVotes) * 100 : 0;
            const isOwner = userId === req.author_id;

            return (
              <div
                key={req.id}
                style={{
                  background: 'rgba(255,255,255,.03)',
                  border: '1px solid var(--line)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* 막대 도표 배경 */}
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${barPct}%`,
                    background:
                      'linear-gradient(90deg,rgba(108,140,255,.10),rgba(155,108,255,.06))',
                    transition: 'width .3s ease',
                    borderRadius: '12px 0 0 12px',
                  }}
                />

                {/* 콘텐츠 */}
                <div style={{ position: 'relative', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  {/* 업보트 버튼 */}
                  <button
                    type="button"
                    onClick={() => handleVote(req.id)}
                    aria-label={isVoted ? '추천 취소' : '추천'}
                    style={{
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2,
                      background: isVoted
                        ? 'rgba(108,140,255,.20)'
                        : 'rgba(255,255,255,.06)',
                      border: `1px solid ${isVoted ? 'var(--brand)' : 'var(--line)'}`,
                      borderRadius: 8,
                      padding: '6px 10px',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      minWidth: 44,
                      transition: 'background .12s, border-color .12s',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        color: isVoted ? 'var(--brand)' : 'var(--muted)',
                        lineHeight: 1,
                        transition: 'color .12s',
                      }}
                    >
                      ▲
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: isVoted ? 'var(--brand)' : 'var(--ink)',
                      }}
                    >
                      {req.vote_count}
                    </span>
                  </button>

                  {/* 본문 + 메타 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        color: '#cfd6e4',
                        fontSize: 14,
                        lineHeight: 1.6,
                        margin: '0 0 6px 0',
                        wordBreak: 'break-word',
                      }}
                    >
                      {req.body}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {req.author?.display_name ?? '사용자'} · {formatDate(req.created_at)}
                      </span>
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => handleDelete(req.id)}
                          disabled={isPending}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255,107,107,.6)',
                            fontSize: 12,
                            cursor: isPending ? 'not-allowed' : 'pointer',
                            padding: 0,
                            fontFamily: 'inherit',
                          }}
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
