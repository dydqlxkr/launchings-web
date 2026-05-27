'use client';

/**
 * 신고 버튼 + 모달.
 * 비로그인 → LoginModal 유도.
 * 로그인 → 사유 select + 선택적 상세 텍스트 → reportApp Server Action.
 */

import { useState, useTransition } from 'react';
import { reportApp, type ReportReason } from '@/lib/actions/report';
import LoginModal from './LoginModal';

interface Props {
  appId: string;
  isLoggedIn: boolean;
}

const REASON_OPTIONS: { value: ReportReason; label: string }[] = [
  { value: 'stolen', label: '저작권 침해 (도용)' },
  { value: 'malware', label: '악성코드 / 피싱' },
  { value: 'spam', label: '스팸 / 광고성 콘텐츠' },
  { value: 'inappropriate', label: '부적절한 콘텐츠' },
  { value: 'broken', label: '작동하지 않음' },
  { value: 'other', label: '기타' },
];

export default function ReportButton({ appId, isLoggedIn }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>('other');
  const [detail, setDetail] = useState('');
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<
    { success: true } | { error: string } | null
  >(null);

  function handleOpen() {
    if (!isLoggedIn) {
      setLoginModalOpen(true);
      return;
    }
    setResult(null);
    setReason('other');
    setDetail('');
    setModalOpen(true);
  }

  function handleClose() {
    setModalOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await reportApp(appId, reason, detail);
      setResult(res);
      if (res.success) {
        setTimeout(() => setModalOpen(false), 1500);
      }
    });
  }

  return (
    <>
      {/* 신고 버튼 */}
      <button
        onClick={handleOpen}
        style={{
          background: 'none',
          border: '1px solid var(--line)',
          borderRadius: 8,
          padding: '7px 14px',
          fontSize: 12,
          color: 'var(--muted)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          transition: 'border-color .12s, color .12s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = '#ff6b6b';
          (e.currentTarget as HTMLButtonElement).style.color = '#ff6b6b';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--line)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)';
        }}
      >
        ⚑ 신고
      </button>

      {/* 로그인 유도 모달 */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />

      {/* 신고 모달 */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,.6)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={handleClose}
        >
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--line)',
              borderRadius: 18,
              padding: '28px 24px',
              width: '100%',
              maxWidth: 420,
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 닫기 */}
            <button
              onClick={handleClose}
              style={{
                position: 'absolute',
                top: 14,
                right: 16,
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                fontSize: 20,
                cursor: 'pointer',
                lineHeight: 1,
              }}
              aria-label="닫기"
            >
              ×
            </button>

            <h2
              style={{
                fontSize: 17,
                fontWeight: 800,
                marginBottom: 6,
              }}
            >
              앱 신고
            </h2>
            <p
              style={{
                fontSize: 13,
                color: 'var(--muted)',
                marginBottom: 20,
                lineHeight: 1.5,
              }}
            >
              운영자가 검토 후 조치합니다. 허위 신고는 서비스 이용이 제한될 수 있습니다.
            </p>

            {'success' in (result ?? {}) ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '20px 0',
                  color: 'var(--accent)',
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                신고가 접수되었습니다. 감사합니다.
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* 사유 선택 */}
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--muted)',
                    marginBottom: 8,
                  }}
                >
                  신고 사유 *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as ReportReason)}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,.05)',
                    border: '1px solid var(--line)',
                    borderRadius: 10,
                    padding: '11px 14px',
                    fontSize: 14,
                    color: 'var(--ink)',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    outline: 'none',
                    marginBottom: 14,
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage:
                      'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\' viewBox=\'0 0 12 8\'%3E%3Cpath fill=\'%23888\' d=\'M1 1l5 5 5-5\'/%3E%3C/svg%3E")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 14px center',
                  }}
                >
                  {REASON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {/* 상세 설명 (선택) */}
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--muted)',
                    marginBottom: 8,
                  }}
                >
                  상세 설명 (선택)
                </label>
                <textarea
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  maxLength={500}
                  placeholder="추가로 전달할 내용이 있으면 입력해 주세요."
                  rows={3}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,.05)',
                    border: '1px solid var(--line)',
                    borderRadius: 10,
                    padding: '11px 14px',
                    fontSize: 13,
                    color: 'var(--ink)',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    outline: 'none',
                    resize: 'vertical',
                    minHeight: 72,
                  }}
                />

                {/* 에러 메시지 */}
                {result && 'error' in result && (
                  <p
                    style={{
                      color: '#ff6b6b',
                      fontSize: 13,
                      marginTop: 10,
                    }}
                  >
                    {result.error}
                  </p>
                )}

                {/* 제출 */}
                <button
                  type="submit"
                  disabled={isPending}
                  style={{
                    width: '100%',
                    background: isPending
                      ? 'var(--chip)'
                      : 'linear-gradient(135deg,#ff6b6b,#ff8e53)',
                    border: 'none',
                    borderRadius: 10,
                    padding: '12px 0',
                    fontSize: 14,
                    fontWeight: 700,
                    color: isPending ? 'var(--muted)' : '#fff',
                    cursor: isPending ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    marginTop: 16,
                    transition: 'opacity .12s',
                  }}
                >
                  {isPending ? '처리 중...' : '신고 제출'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
