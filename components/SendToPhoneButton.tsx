'use client';

/**
 * SendToPhoneButton — "폰으로 보기" QR 버튼.
 * 데스크톱에서 보다가 폰 카메라로 QR을 스캔해 같은 페이지(또는 데모/스토어)로
 * 바로 이동하는 용도. QR은 qrcode 패키지로 클라이언트에서 생성(외부 요청 없음 — CSP 안전).
 *
 * variant:
 *  - 'chip': 상세 페이지 액션 행의 기존 버튼(링크 복사 등)과 같은 칩 스타일
 *  - 'rail': 피드 우측 레일의 원형 버튼 스타일
 */

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Modal from './Modal';

interface Props {
  /** QR에 인코딩할 절대 URL */
  url: string;
  /** 모달 제목 아래 표시할 앱 이름 */
  appTitle: string;
  variant?: 'chip' | 'rail';
}

export default function SendToPhoneButton({ url, appTitle, variant = 'chip' }: Props) {
  const t = useTranslations('sendToPhone');
  const [open, setOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // 모달이 처음 열릴 때 QR 생성 (동적 import — 피드/상세 초기 번들에서 제외)
  useEffect(() => {
    if (!open || qrDataUrl) return;
    let cancelled = false;
    import('qrcode').then((QRCode) =>
      QRCode.toDataURL(url, {
        width: 240,
        margin: 2,
        color: { dark: '#0b0d12', light: '#ffffff' },
      })
    ).then((dataUrl) => {
      if (!cancelled) setQrDataUrl(dataUrl);
    }).catch(() => {
      /* 생성 실패 시 URL 텍스트만 표시 */
    });
    return () => {
      cancelled = true;
    };
  }, [open, qrDataUrl, url]);

  const button =
    variant === 'rail' ? (
      <button
        onClick={() => setOpen(true)}
        aria-label={t('open')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          color: 'var(--ink)',
        }}
      >
        <span
          style={{
            width: 52,
            height: 52,
            borderRadius: 999,
            background: 'rgba(255,255,255,.08)',
            border: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
          }}
          aria-hidden="true"
        >
          📱
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
          {t('railLabel')}
        </span>
      </button>
    ) : (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--chip)',
          color: 'var(--ink)',
          border: '1px solid var(--line)',
          borderRadius: 10,
          padding: '10px 14px',
          fontSize: 13.5,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        <span aria-hidden="true">📱</span> {t('open')}
      </button>
    );

  return (
    <>
      {button}
      <Modal isOpen={open} onClose={() => setOpen(false)} labelId="send-to-phone-title" maxWidth={340}>
        <div style={{ textAlign: 'center', padding: '6px 4px' }}>
          <h2 id="send-to-phone-title" style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>
            {t('title')}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>
            {t('desc', { title: appTitle })}
          </p>
          {qrDataUrl ? (
            // QR은 정밀 스캔용 정적 이미지 — next/image 최적화 불필요
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt={t('qrAlt')}
              width={240}
              height={240}
              style={{ borderRadius: 12, display: 'block', margin: '0 auto' }}
            />
          ) : (
            <div
              className="lp-skeleton"
              style={{ width: 240, height: 240, borderRadius: 12, margin: '0 auto' }}
              aria-hidden="true"
            />
          )}
          <p
            style={{
              fontSize: 11.5,
              color: 'var(--muted)',
              marginTop: 14,
              wordBreak: 'break-all',
              lineHeight: 1.5,
            }}
          >
            {url}
          </p>
        </div>
      </Modal>
    </>
  );
}
