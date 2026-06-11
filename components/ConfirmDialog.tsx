'use client';

/**
 * ConfirmDialog — 공용 확인 다이얼로그.
 * Modal 컴포넌트(포커스 트랩 포함)를 기반으로 한다.
 *
 * props:
 *   open         — 열림 여부
 *   title        — 다이얼로그 제목
 *   description  — 부가 설명 (선택)
 *   confirmLabel — 확인 버튼 라벨
 *   cancelLabel  — 취소 버튼 라벨 (기본: common.cancel)
 *   danger       — true면 확인 버튼을 var(--red) 스타일로
 *   onConfirm    — 확인 콜백
 *   onCancel     — 취소/닫기 콜백
 */

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import Modal from './Modal';

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  const titleId = useId();
  const tc = useTranslations('common');
  const resolvedCancelLabel = cancelLabel ?? tc('cancel');

  return (
    <Modal isOpen={open} onClose={onCancel} labelId={titleId} maxWidth={400}>
      <div style={{ padding: '28px 24px' }}>
        <h3
          id={titleId}
          style={{
            fontSize: 18,
            fontWeight: 800,
            marginBottom: description ? 10 : 24,
            color: danger ? 'var(--red)' : 'var(--ink)',
          }}
        >
          {title}
        </h3>

        {description && (
          <p
            style={{
              fontSize: 14,
              color: 'var(--muted)',
              lineHeight: 1.6,
              marginBottom: 24,
            }}
          >
            {description}
          </p>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          {/* 취소 버튼 */}
          <button
            type="button"
            onClick={onCancel}
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
            {resolvedCancelLabel}
          </button>

          {/* 확인 버튼 */}
          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1,
              background: danger ? 'rgba(255,107,107,.15)' : 'linear-gradient(135deg,var(--brand),var(--brand2))',
              border: danger ? '1px solid rgba(255,107,107,.4)' : 'none',
              borderRadius: 10,
              padding: '12px 0',
              fontSize: 14,
              fontWeight: 700,
              color: danger ? 'var(--red)' : '#fff',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
