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
 *   - 외부 URL: sandbox="allow-scripts allow-forms allow-popups"
 *     (allow-same-origin 미부여, allow-popups-to-escape-sandbox 미부여, referrerpolicy="no-referrer")
 *   - 임베드 실패 감지: onLoad 후 blank 여부 → 폴백 버튼 표시
 *
 * 반응형 높이:
 *   - 데스크톱: 540px
 *   - 모바일: min(70vh, 540px) — CSS clamp 적용
 *
 * 전체화면:
 *   - 툴바 "전체화면" 버튼 → Fullscreen API requestFullscreen()
 *   - 미지원 브라우저: 화면 꽉 채우는 오버레이 fallback (position: fixed)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { AppWithRelations } from '@/lib/types';
import { isSafeHttpUrl } from '@/lib/validations';
import { getEmbedUrl } from '@/lib/videoEmbed';

interface Props {
  app: AppWithRelations;
  /** 사전계산된 srcdoc HTML (서버에서 주입). null이면 외부 URL 또는 native 경로. */
  srcDoc: string | null;
  /** app_screenshots 공개 URL 배열 (sort_order 순). 없으면 placeholder 표시. */
  screenshotUrls?: string[];
}

function NativeDemoView({ app, screenshotUrls = [] }: { app: AppWithRelations; screenshotUrls?: string[] }) {
  const t = useTranslations('appRunner');

  // 스크린샷 플레이스홀더: 실제 스크린샷이 없을 때만 그라디언트로 4개 생성
  const gradColors = app.thumbnail_gradient ?? '135deg, #1e2734, #2a3a5a';
  const placeholderShots = [0, 1, 2, 3];
  const hasRealScreenshots = screenshotUrls.length > 0;

  // 데모 영상 임베드 URL 계산 (null이면 영상 없음)
  const embedUrl = getEmbedUrl(app.demo_video_url);

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
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: embedUrl ? '#000' : `linear-gradient(${gradColors})`,
          }}
        >
          {embedUrl ? (
            /* 데모 영상 임베드 */
            <iframe
              src={embedUrl}
              title={t('playDemo')}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              style={{
                width: '100%',
                height: '100%',
                border: 0,
                display: 'block',
              }}
              loading="lazy"
            />
          ) : (
            /* 영상 없음 — 이모지/썸네일만 표시, 가짜 재생 버튼 없음 */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: 20,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 44 }}>{app.thumbnail_emoji}</div>
            </div>
          )}
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
          {hasRealScreenshots
            ? screenshotUrls.slice(0, 4).map((url, i) => (
                <div
                  key={url}
                  style={{
                    width: 44,
                    height: 76,
                    borderRadius: 8,
                    border: '1px solid var(--line)',
                    overflow: 'hidden',
                    position: 'relative',
                    flexShrink: 0,
                  }}
                >
                  <Image
                    src={url}
                    alt={t('screenshotAlt', { n: i + 1 })}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="44px"
                  />
                </div>
              ))
            : placeholderShots.map((i) => (
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

        {/* 스토어 버튼 — C-1 렌더 가드: 안전한 스킴(https/http)만 링크로 렌더 */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {app.store_url_ios && isSafeHttpUrl(app.store_url_ios) && (
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
          {app.store_url_android && isSafeHttpUrl(app.store_url_android) && (
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

/** 외부 URL iframe 로딩이 오래 걸릴 때 "새 탭" 안내를 띄우는 시간 (ms) */
const EMBED_TIMEOUT_MS = 9000;

/**
 * 전체화면 오버레이 fallback (Fullscreen API 미지원 시)
 * position: fixed로 뷰포트 전체 커버
 */
function FullscreenOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  // ESC 키 닫기
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 닫기 버튼 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '8px 12px',
          background: 'var(--card)',
          borderBottom: '1px solid var(--line)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onClose}
          aria-label="전체화면 닫기"
          style={{
            background: 'var(--chip)',
            border: '1px solid var(--line)',
            color: 'var(--ink)',
            borderRadius: 8,
            padding: '6px 12px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          ✕ 닫기
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>{children}</div>
    </div>
  );
}

/** iframe 로드 완료 후 상단 힌트 바 자동 페이드 아웃 시간 (ms) */
const HINT_FADE_MS = 5000;

function WebAppView({ app, srcDoc }: { app: AppWithRelations; srcDoc: string | null }) {
  const t = useTranslations('appRunner');
  const [embedFailed, setEmbedFailed] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [slowLoad, setSlowLoad] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [useOverlay, setUseOverlay] = useState(false);
  /** 로드 완료 후 힌트 바 표시 여부 (HINT_FADE_MS 후 자동 숨김) */
  const [showHintBar, setShowHintBar] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasExternalUrl = !srcDoc && !!app.live_url;

  // srcdoc(우리 코드)용 sandbox: allow-same-origin 허용 (우리 코드이므로 안전)
  const srcdocSandbox = 'allow-scripts allow-same-origin allow-modals';
  // 외부 URL용 sandbox: allow-same-origin 미부여, allow-popups-to-escape-sandbox 미부여 (M-3, ADR-0004)
  const externalSandbox = 'allow-scripts allow-forms allow-popups';

  // 외부 URL 경로: 로딩이 오래 걸리면 "새 탭" 안내만 표시(iframe은 계속 로딩 — 느린 사이트도 결국 임베드됨)
  useEffect(() => {
    if (!hasExternalUrl || iframeLoaded) return;

    timeoutRef.current = setTimeout(() => {
      if (!iframeLoaded) {
        setSlowLoad(true);
      }
    }, EMBED_TIMEOUT_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [hasExternalUrl, iframeLoaded]);

  // Fullscreen API 이벤트 동기화
  useEffect(() => {
    function onFullscreenChange() {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    }
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const handleToggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      // 전체화면 해제
      if (useOverlay) {
        setIsFullscreen(false);
        setUseOverlay(false);
      } else {
        try {
          await document.exitFullscreen();
        } catch {
          setIsFullscreen(false);
        }
      }
      return;
    }

    // 전체화면 진입
    const el = containerRef.current;
    if (el && el.requestFullscreen) {
      try {
        await el.requestFullscreen();
        setIsFullscreen(true);
        setUseOverlay(false);
      } catch {
        // Fullscreen API 실패 → 오버레이 fallback
        setIsFullscreen(true);
        setUseOverlay(true);
      }
    } else {
      // Fullscreen API 미지원
      setIsFullscreen(true);
      setUseOverlay(true);
    }
  }, [isFullscreen, useOverlay]);

  // 힌트 타이머 정리
  useEffect(() => {
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, []);

  function handleLoad() {
    if (!hasExternalUrl) return;
    setIframeLoaded(true);
    setSlowLoad(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // 로드 완료 후 힌트 바 표시 → HINT_FADE_MS 뒤 자동 숨김
    setShowHintBar(true);
    hintTimerRef.current = setTimeout(() => {
      setShowHintBar(false);
    }, HINT_FADE_MS);
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
          {app.live_url && isSafeHttpUrl(app.live_url) && (
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

  // iframe 영역 (전체화면/오버레이 여부에 상관없이 재사용)
  const iframeArea = (
    <div style={{ position: 'relative', height: '100%', background: '#fff' }}>
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
              {slowLoad && app.live_url && isSafeHttpUrl(app.live_url) && (
                <div style={{ textAlign: 'center', marginTop: 14 }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
                    로딩이 오래 걸리네요. 계속 기다리거나 새 탭에서 열어보세요.
                  </div>
                  <a
                    href={app.live_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: 'linear-gradient(135deg,var(--brand),var(--brand2))',
                      color: '#fff',
                      padding: '9px 18px',
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: 13,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      textDecoration: 'none',
                    }}
                  >
                    ↗ {t('openInTab')}
                  </a>
                </div>
              )}
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
  );

  const toolbar = (
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
      {/* 전체화면 토글 버튼 */}
      <button
        onClick={handleToggleFullscreen}
        aria-label={isFullscreen ? t('exitFullscreen') : t('enterFullscreen')}
        title={isFullscreen ? t('exitFullscreen') : t('enterFullscreen')}
        style={{
          background: 'transparent',
          border: '1px solid var(--line)',
          color: 'var(--muted)',
          borderRadius: 6,
          padding: '3px 8px',
          fontSize: 11,
          cursor: 'pointer',
          flexShrink: 0,
          lineHeight: 1.4,
          fontFamily: 'inherit',
          whiteSpace: 'nowrap',
        }}
      >
        {isFullscreen ? '⊡ ' : '⊞ '}
        {isFullscreen ? t('exitFullscreen') : t('enterFullscreen')}
      </button>
      {/* 새 탭에서 열기 — 임베드 차단 대비, 항상 표시 (C-1 렌더 가드) */}
      {app.live_url && isSafeHttpUrl(app.live_url) && (
        <a
          href={app.live_url}
          target="_blank"
          rel="noopener noreferrer"
          title={t('openInTab')}
          aria-label={t('openInTab')}
          style={{
            color: 'var(--muted)',
            fontSize: 11,
            textDecoration: 'none',
            flexShrink: 0,
            lineHeight: 1.4,
            border: '1px solid var(--line)',
            borderRadius: 6,
            padding: '3px 8px',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          ↗ {t('openInTab')}
        </a>
      )}
    </div>
  );

  const mainContent = (
    <>
      {toolbar}

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

      {/* 로드 완료 후 힌트 바 — 임베드 차단 시 사용자 안내, HINT_FADE_MS 후 자동 페이드 */}
      {hasExternalUrl && showHintBar && app.live_url && isSafeHttpUrl(app.live_url) && (
        <div
          style={{
            background: 'rgba(46,230,166,.07)',
            borderBottom: '1px solid rgba(46,230,166,.18)',
            padding: '5px 14px',
            fontSize: 11,
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'opacity .5s',
          }}
        >
          <span style={{ flex: 1 }}>화면이 안 보이면</span>
          <a
            href={app.live_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--accent)',
              fontWeight: 700,
              textDecoration: 'underline',
              whiteSpace: 'nowrap',
            }}
          >
            새 탭에서 열기 ↗
          </a>
        </div>
      )}

      {/* iframe — 반응형 높이: 모바일 min(70vh,540px), 데스크톱 540px */}
      <div
        style={{
          position: 'relative',
          height: 'clamp(300px, 70vh, 540px)',
          background: '#fff',
        }}
      >
        {iframeArea}
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
    </>
  );

  // 오버레이 fallback 전체화면
  if (isFullscreen && useOverlay) {
    return (
      <>
        <div
          ref={containerRef}
          style={{
            background: 'var(--card)',
            border: '1px solid var(--line)',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          {mainContent}
        </div>
        <FullscreenOverlay onClose={() => { setIsFullscreen(false); setUseOverlay(false); }}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* 오버레이 내 툴바는 간소화 */}
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
                flexShrink: 0,
              }}
            >
              <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 11 }}>
                {t('liveRunning')}
              </span>
              <div style={{ flex: 1, fontSize: 11, color: '#7f8aa0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayUrl}
              </div>
              {app.live_url && isSafeHttpUrl(app.live_url) && (
                <a href={app.live_url} target="_blank" rel="noopener noreferrer" aria-label={t('openInTab')} style={{ color: 'var(--muted)', fontSize: 14, textDecoration: 'none' }}>
                  ↗
                </a>
              )}
            </div>
            <div style={{ flex: 1, background: '#fff', overflow: 'hidden' }}>
              {iframeArea}
            </div>
          </div>
        </FullscreenOverlay>
      </>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      {mainContent}
    </div>
  );
}

export default function AppRunner({ app, srcDoc, screenshotUrls = [] }: Props) {
  const isNative = app.app_type === 'native';

  if (isNative) {
    return <NativeDemoView app={app} screenshotUrls={screenshotUrls} />;
  }

  return <WebAppView app={app} srcDoc={srcDoc} />;
}
