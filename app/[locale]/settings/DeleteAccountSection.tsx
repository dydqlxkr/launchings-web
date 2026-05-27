'use client';

/**
 * 회원 탈퇴 위험 구역 섹션.
 * - 탈퇴 버튼 클릭 → 1단계 확인 모달 → 2단계 최종 확인 → deleteAccount() 실행.
 * - 공용 Modal 컴포넌트 재사용.
 * - 완료/에러는 Toast로 표시.
 * - SUPABASE_SERVICE_ROLE_KEY 미설정 시 에러 메시지만 표시(앱 정상 동작).
 */

import { useState, useTransition, useId } from 'react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { deleteAccount } from '@/lib/actions/account';

export default function DeleteAccountSection() {
  const t = useTranslations('settings');
  const toast = useToast();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isFinalOpen, setIsFinalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const confirmTitleId = useId();
  const finalTitleId = useId();

  function handleDeleteClick() {
    setIsConfirmOpen(true);
  }

  function handleConfirmNext() {
    setIsConfirmOpen(false);
    setIsFinalOpen(true);
  }

  function handleFinalConfirm() {
    startTransition(async () => {
      const result = await deleteAccount();
      if (result?.error) {
        setIsFinalOpen(false);
        toast.show(result.error, 'error');
      }
      // 성공 시 server action에서 redirect('/ko') 처리됨
    });
  }

  return (
    <>
      {/* 위험 구역 카드 */}
      <div
        style={{
          background: 'rgba(255,107,107,.05)',
          border: '1px solid rgba(255,107,107,.25)',
          borderRadius: 16,
          padding: '24px',
        }}
      >
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--red)',
            marginBottom: 8,
          }}
        >
          {t('deleteAccount.dangerZoneTitle')}
        </h2>
        <p
          style={{
            fontSize: 14,
            color: 'var(--muted)',
            marginBottom: 20,
            lineHeight: 1.6,
          }}
        >
          {t('deleteAccount.dangerZoneDesc')}
        </p>
        <button
          onClick={handleDeleteClick}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,107,107,.5)',
            borderRadius: 10,
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--red)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'background .12s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              'rgba(255,107,107,.1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              'transparent';
          }}
        >
          {t('deleteAccount.button')}
        </button>
      </div>

      {/* 1단계 확인 모달 */}
      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        labelId={confirmTitleId}
        maxWidth={420}
      >
        <div style={{ padding: '28px 24px' }}>
          <h3
            id={confirmTitleId}
            style={{
              fontSize: 18,
              fontWeight: 800,
              marginBottom: 12,
              color: 'var(--ink)',
            }}
          >
            {t('deleteAccount.confirmTitle')}
          </h3>
          <p
            style={{
              fontSize: 14,
              color: 'var(--muted)',
              lineHeight: 1.6,
              marginBottom: 24,
            }}
          >
            {t('deleteAccount.confirmDesc')}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setIsConfirmOpen(false)}
              style={{
                flex: 1,
                background: 'var(--chip)',
                border: 'none',
                borderRadius: 10,
                padding: '12px 0',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--muted)',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {t('deleteAccount.cancel')}
            </button>
            <button
              onClick={handleConfirmNext}
              style={{
                flex: 1,
                background: 'rgba(255,107,107,.15)',
                border: '1px solid rgba(255,107,107,.4)',
                borderRadius: 10,
                padding: '12px 0',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--red)',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {t('deleteAccount.confirmNext')}
            </button>
          </div>
        </div>
      </Modal>

      {/* 2단계 최종 확인 모달 */}
      <Modal
        isOpen={isFinalOpen}
        onClose={() => !isPending && setIsFinalOpen(false)}
        labelId={finalTitleId}
        maxWidth={420}
      >
        <div style={{ padding: '28px 24px' }}>
          <h3
            id={finalTitleId}
            style={{
              fontSize: 18,
              fontWeight: 800,
              marginBottom: 12,
              color: 'var(--red)',
            }}
          >
            {t('deleteAccount.finalTitle')}
          </h3>
          <p
            style={{
              fontSize: 14,
              color: 'var(--muted)',
              lineHeight: 1.6,
              marginBottom: 24,
            }}
          >
            {t('deleteAccount.finalDesc')}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setIsFinalOpen(false)}
              disabled={isPending}
              style={{
                flex: 1,
                background: 'var(--chip)',
                border: 'none',
                borderRadius: 10,
                padding: '12px 0',
                fontSize: 14,
                fontWeight: 600,
                color: isPending ? 'var(--muted)' : 'var(--muted)',
                cursor: isPending ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {t('deleteAccount.cancel')}
            </button>
            <button
              onClick={handleFinalConfirm}
              disabled={isPending}
              style={{
                flex: 1,
                background: isPending
                  ? 'rgba(255,107,107,.08)'
                  : 'rgba(255,107,107,.2)',
                border: '1px solid rgba(255,107,107,.5)',
                borderRadius: 10,
                padding: '12px 0',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--red)',
                cursor: isPending ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {isPending
                ? t('deleteAccount.deleting')
                : t('deleteAccount.finalConfirm')}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
