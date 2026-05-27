'use client';

/**
 * AppRunner — 앱 실행 영역 (Phase 3 구현)
 *
 * webapp (type !== 'native'):
 *   - srcdoc 데모가 있으면 → iframe srcDoc (우리 코드, sandbox + allow-same-origin 허용)
 *   - live_url이 있으면 → iframe src (외부 URL, allow-same-origin 제거, ADR-0004)
 *   - 둘 다 없으면 → 안내 메시지
 *
 * native (type === 'native'):
 *   - 폰 프레임 + 30초 영상 placeholder + 스크린샷 스트립 + 스토어 버튼 + MVP 안내
 *
 * 보안 (ADR-0004):
 *   - srcdoc(우리 통제): sandbox="allow-scripts allow-same-origin allow-modals"
 *   - 외부 URL: sandbox="allow-scripts allow-forms allow-popups-to-escape-sandbox"
 *     (allow-same-origin 미부여, referrerpolicy="no-referrer")
 *   - 임베드 실패 감지: onLoad 후 blank 여부 → 폴백 버튼 표시
 */

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { AppWithRelations } from '@/lib/types';

interface Props {
  app: AppWithRelations;
  /** 사전계산된 srcdoc HTML (서버에서 주입). null이면 외부 URL 또는 native 경로. */
  srcDoc: string | null;
}

function NativeDemoView({ app }: { app: AppWithRelations }) {
  const t = useTranslations('appRunner');

  // 스크린샷 플레이스홀더: 앱 그라디언트로 4개 생성
  const gradColors = app.thumbnail_gradient ?? '135deg, #1e2734, #2a3a5a';
  const shots = [0, 1, 2, 3];

  return (
    <div
      style={{
        minHeight: 420,
        display: 'flex',
        gap: 26,
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg,#13161f,#1a1f2b)',
        padding: '34px 24px',
        flexWrap: 'wrap',
        borderRadius: 16,
        overflow: 'auto',
      }}
    >
      {/* 폰 프레임 */}
      <div
        style={{
          width: 220,
          height: 440,
          background: '#0a0c11',
          border: '7px solid #20242e',
          borderRadius: 34,
          position: 'relative',
          flexShrink: 0,
          boxShadow: '0 20px 60px rgba(0,0,0,.5)',
        }}
      >
        {/* 노치 */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 80,
            height: 16,
            background: '#20242e',
            borderRadius: '0 0 10px 10px',
          }}
        />
        {/* 스크린 */}
        <div
          style={{
            position: 'absolute',
            inset: 10,
            borderRadius: 26,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            textAlign: 'center',
            padding: 20,
            background: `linear-gradient(${gradColors})`,
          }}
        >
          <div style={{ fontSize: 44 }}>{app.thumbnail_emoji}</div>
          {/* 재생 버튼 */}
          <button
            aria-label={t('playDemo')}
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(255,255,255,.9)',
              color: '#111',
              border: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              cursor: 'pointer',
            }}
          >
            ▶
          </button>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.8)' }}>
            {t('nativeDemoVideo')}
          </div>
        </div>
      </div>

      {/* 우측 정보 */}
      <div style={{ maxWidth: 280 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>
          {app.thumbnail_emoji} {app.title}
        </h3>
        <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>
          {app.tagline ?? app.description}
        </p>

        {/* 스크린샷 스트립 */}
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 7 }}>
          {t('nativeDemoScreenshots')}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {shots.map((i) => (
            <div
              key={i}
              aria-label={t('screenshotAlt', { n: i + 1 })}
              style={{
                width: 44,
                height: 76,
                borderRadius: 8,
                border: '1px solid var(--line)',
                background: `linear-gradient(${160 + i * 15}deg, ${gradColors.replace('135deg,', '')})`,
              }}
            />
          ))}
        </div>

        {/* 스토어 버튼 */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {app.store_url_ios && (
            <a
              href={app.store_url_ios}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'linear-gradient(135deg,var(--brand),var(--brand2))',
                color: '#fff',
                padding: '9px 14px',
                borderRadius: 9,
                fontWeight: 700,
                fontSize: 13,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              📱 App Store
            </a>
          )}
          {app.store_url_android && (
            <a
              href={app.store_url_android}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                border: '1px solid var(--line)',
                color: 'var(--ink)',
                padding: '9px 14px',
                borderRadius: 9,
                fontWeight: 700,
                fontSize: 13,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              🤖 Google Play
            </a>
          )}
        </div>

        {/* MVP 안내 */}
        <div
          style={{
            background: 'rgba(255,180,84,.08)',
            border: '1px solid rgba(255,180,84,.3)',
            borderRadius: 9,
            padding: '9px 12px',
            fontSize: 11.5,
            color: 'var(--warm)',
            marginTop: 14,
          }}
        >
          ⓘ {t('nativeDemoMvpNote')}
        </div>
      </div>
    </div>
  );
}

/** 외부 URL iframe 로딩 타임아웃 (ms) */
const EMBED_TIMEOUT_MS = 2500;

function WebAppView({ app, srcDoc }: { app: AppWithRelations; srcDoc: string | null }) {
  const t = useTranslations('appRunner');
  const [embedFailed, setEmbedFailed] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasExternalUrl = !srcDoc && !!app.live_url;

  // srcdoc(우리 코드)용 sandbox: allow-same-origin 허용 (우리 코드이므로 안전)
  const srcdocSandbox = 'allow-scripts allow-same-origin allow-modals';
  // 외부 URL용 sandbox: allow-same-origin 미부여 (ADR-0004)
  const externalSandbox = 'allow-scripts allow-forms allow-popups-to-escape-sandbox';

  // 외부 URL 경로: 타임아웃 내 로드 신호 없으면 폴백 전환
  useEffect(() => {
    if (!hasExternalUrl || embedFailed) return;

    timeoutRef.current = setTimeout(() => {
      if (!iframeLoaded) {
        setEmbedFailed(true);
      }
    }, EMBED_TIMEOUT_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [hasExternalUrl, embedFailed, iframeLoaded]);

  function handleLoad() {
    if (!hasExternalUrl) return;
    setIframeLoaded(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }

  const displayUrl = app.live_url ?? `https://${app.slug}.launchings.app`;

  if (embedFailed) {
    return (
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {/* 스크린샷 폴백 카드 — 앱 썸네일 배경 */}
        <div
          style={{
            background: app.thumbnail_gradient
              ? `linear-gradient(${app.thumbnail_gradient})`
              : 'linear-gradient(135deg,#13161f,#1a1f2b)',
            minHeight: 200,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 24px',
            gap: 16,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 56 }}>{app.thumbnail_emoji}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{app.title}</div>
          {app.tagline && (
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,.7)', maxWidth: 400 }}>
              {app.tagline}
            </div>
          )}
        </div>

        {/* 폴백 안내 + 버튼 */}
        <div
          style={{
            padding: '28px 24px',
            textAlign: 'center',
            background: 'var(--card)',
          }}
        >
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.6 }}>
            {t('embedBlocked')}
            <br />
            <span style={{ fontSize: 12 }}>{t('embedBlockedHint')}</span>
          </div>
          {app.live_url && (
            <a
              href={app.live_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'linear-gradient(135deg,var(--brand),var(--brand2))',
                color: '#fff',
                padding: '13px 28px',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 15,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                textDecoration: 'none',
              }}
            >
              ↗ {t('openInTab')}
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      {/* 툴바 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          background: 'var(--card)',
          borderBottom: '1px solid var(--line)',
          fontSize: 12,
          color: 'var(--muted)',
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'var(--accent)',
            boxShadow: '0 0 8px var(--accent)',
            flexShrink: 0,
            display: 'inline-block',
          }}
        />
        <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 11 }}>
          {t('liveRunning')}
        </span>
        <div
          style={{
            flex: 1,
            background: 'var(--bg)',
            border: '1px solid var(--line)',
            borderRadius: 7,
            padding: '4px 10px',
            color: '#7f8aa0',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            fontSize: 11,
          }}
        >
          {displayUrl}
        </div>
        {/* 외부 URL 폴백 버튼 */}
        {app.live_url && (
          <a
            href={app.live_url}
            target="_blank"
            rel="noopener noreferrer"
            title={t('openInTab')}
            style={{
              color: 'var(--muted)',
              fontSize: 14,
              textDecoration: 'none',
              flexShrink: 0,
              lineHeight: 1,
            }}
          >
            ↗
          </a>
        )}
      </div>

      {/* 외부 사이트 경고 (외부 URL 경로만) */}
      {hasExternalUrl && (
        <div
          style={{
            background: 'rgba(255,180,84,.07)',
            borderBottom: '1px solid rgba(255,180,84,.2)',
            padding: '5px 14px',
            fontSize: 11,
            color: 'var(--warm)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          ⚠️ {t('externalSiteNotice')}
          <span style={{ color: 'var(--muted)', marginLeft: 4 }}>· {displayUrl}</span>
        </div>
      )}

      {/* iframe */}
      <div style={{ position: 'relative', height: 520, background: '#fff' }}>
        {srcDoc ? (
          <iframe
            ref={iframeRef}
            srcDoc={srcDoc}
            sandbox={srcdocSandbox}
            title={app.title}
            style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
            loading="lazy"
          />
        ) : app.live_url ? (
          <>
            {/* 로딩 스켈레톤 — iframe 로드 전 표시 */}
            {!iframeLoaded && (
              <div
                aria-live="polite"
                aria-label={t('loadingLabel')}
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 2,
                  background: 'var(--bg2)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 16,
                }}
              >
                {/* 펄스 스켈레톤 바 */}
                <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="lp-skeleton" style={{ height: 18, width: '60%', borderRadius: 8 }} />
                  <div className="lp-skeleton" style={{ height: 14, width: '80%', borderRadius: 8 }} />
                  <div className="lp-skeleton" style={{ height: 14, width: '50%', borderRadius: 8 }} />
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                  {t('loadingLabel')}
                </div>
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={app.live_url}
              sandbox={externalSandbox}
              referrerPolicy="no-referrer"
              title={app.title}
              style={{
                width: '100%',
                height: '100%',
                border: 0,
                display: 'block',
                opacity: iframeLoaded ? 1 : 0,
                transition: 'opacity .3s',
              }}
              loading="lazy"
              onLoad={handleLoad}
              onError={() => setEmbedFailed(true)}
            />
          </>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--muted)',
              fontSize: 14,
              background: 'var(--bg2)',
            }}
          >
            실행 URL이 없습니다.
          </div>
        )}
      </div>

      {/* 임베드 실패 수동 신고 버튼 (외부 URL 경로) */}
      {hasExternalUrl && (
        <div
          style={{
            padding: '8px 14px',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={() => setEmbedFailed(true)}
            style={{
              background: 'transparent',
              border: '1px solid var(--line)',
              color: 'var(--muted)',
              fontSize: 11,
              padding: '4px 10px',
              borderRadius: 7,
              cursor: 'pointer',
            }}
          >
            임베드 안 되면 →
          </button>
        </div>
      )}
    </div>
  );
}

export default function AppRunner({ app, srcDoc }: Props) {
  const isNative = app.app_type === 'native';

  if (isNative) {
    return <NativeDemoView app={app} />;
  }

  return <WebAppView app={app} srcDoc={srcDoc} />;
}
