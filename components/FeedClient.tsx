'use client';

/**
 * FeedClient — "런칭스 릴스" 세로 데모 피드.
 *
 * 콘셉트 목업(런칭스_세로데모피드_콘셉트목업.html)의 레이아웃(폰 프레임 + 우측 액션 레일 +
 * 하단 정보 오버레이 + 진행 인디케이터 + 스크롤 힌트)을 코드베이스 컨벤션에 맞게 이식.
 *
 * 성능 — iframe/영상 지연 마운트:
 *   IntersectionObserver로 현재 활성 슬라이드(activeIndex)를 추적하고,
 *   활성 슬라이드 ±1(전/현재/후)만 실제 iframe(웹 데모·영상)을 마운트한다.
 *   그 외 슬라이드는 그라디언트+이모지 플레이스홀더로 대체 — 앱 N개 = iframe N개
 *   동시 로드를 방지한다. 스크린샷 이미지(next/image)는 가벼우므로 항상 렌더.
 *
 * 콘텐츠 우선순위(앱별 1회 계산, AppRunner의 NativeDemoView 우선순위와 동일):
 *   ① live_url 웹 데모(native/webapp 공통, isSafeHttpUrl 통과 시)
 *   ② demo_video_url 임베드(유튜브/Vimeo)
 *   ③ 첫 스크린샷 이미지
 *   ④ 이모지 + 그라디언트
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { AppWithRelations } from '@/lib/types';
import { isSafeHttpUrl } from '@/lib/validations';
import { getEmbedUrl } from '@/lib/videoEmbed';
import { useSession } from './useSession';
import AvatarCircle from './AvatarCircle';
import UpvoteButton from './UpvoteButton';
import BookmarkButton from './BookmarkButton';

interface Props {
  apps: AppWithRelations[];
  /** app_id → 리뷰 수 */
  reviewCounts: Record<string, number>;
  /** app_id → 첫 스크린샷 공개 URL (없으면 null) */
  firstScreenshotUrls: Record<string, string | null>;
}

/** Navbar 렌더 높이(컨테이너 62px + 하단 보더 1px) — 피드 영역은 그 아래 나머지를 채운다 */
const NAV_HEIGHT_PX = 63;
/** 첫 진입 스크롤 힌트가 자동으로 사라지는 시간(ms) */
const HINT_HIDE_MS = 4000;
/** 폰 프레임 안 스크린샷 alt/사이즈 등에 사용하는 고정 폭 */
const PHONE_IMAGE_SIZES = '(max-width: 640px) 64vw, 300px';

const railButtonBase: React.CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: '50%',
  background: 'rgba(255,255,255,.08)',
  border: '1px solid var(--line)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 20,
  color: 'var(--ink)',
  flexShrink: 0,
};

const ctaButtonStyle: React.CSSProperties = {
  marginTop: 4,
  background: 'linear-gradient(135deg,var(--brand),var(--brand2))',
  color: '#fff',
  border: 'none',
  borderRadius: 999,
  padding: '12px 16px',
  fontSize: 13,
  fontWeight: 800,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  textDecoration: 'none',
  display: 'inline-block',
  textAlign: 'center',
};

function PlaceholderFill({ emoji, gradient }: { emoji: string | null; gradient: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: `linear-gradient(${gradient})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 44,
      }}
    >
      <span aria-hidden="true">{emoji}</span>
    </div>
  );
}

interface SlideProps {
  app: AppWithRelations;
  index: number;
  isActive: boolean;
  isLoggedIn: boolean;
  reviewCount: number;
  screenshotUrl: string | null;
  registerRef: (el: HTMLDivElement | null) => void;
}

function FeedAppSlide({
  app,
  index,
  isActive,
  isLoggedIn,
  reviewCount,
  screenshotUrl,
  registerRef,
}: SlideProps) {
  const t = useTranslations('feed');
  const isNative = app.app_type === 'native';
  const gradient = app.thumbnail_gradient ?? '135deg, #1e2734, #2a3a5a';

  const hasWebDemo = isSafeHttpUrl(app.live_url);
  const embedUrl = getEmbedUrl(app.demo_video_url);

  const contentType: 'webdemo' | 'video' | 'screenshot' | 'emoji' = hasWebDemo
    ? 'webdemo'
    : embedUrl
      ? 'video'
      : screenshotUrl
        ? 'screenshot'
        : 'emoji';

  const badgeLabel = hasWebDemo
    ? t('webDemoBadge')
    : embedUrl
      ? t('videoBadge')
      : !isNative
        ? t('liveBadge')
        : null;
  const badgeBg = hasWebDemo || (!embedUrl && !isNative) ? 'var(--accent)' : 'var(--warm)';

  // CTA 버튼 — webapp: 바로 써보기(새 탭) / native: 스토어(android 우선) 또는 상세 페이지
  let ctaHref: string;
  let ctaLabel: string;
  let ctaExternal: boolean;
  if (!isNative && hasWebDemo) {
    ctaHref = app.live_url as string;
    ctaLabel = t('ctaTryNow');
    ctaExternal = true;
  } else if (isNative) {
    const storeUrl =
      app.store_url_android && isSafeHttpUrl(app.store_url_android)
        ? app.store_url_android
        : app.store_url_ios && isSafeHttpUrl(app.store_url_ios)
          ? app.store_url_ios
          : null;
    if (storeUrl) {
      ctaHref = storeUrl;
      ctaLabel = t('ctaGetStore');
      ctaExternal = true;
    } else {
      ctaHref = `/ko/apps/${app.slug}`;
      ctaLabel = t('ctaViewDetail');
      ctaExternal = false;
    }
  } else {
    ctaHref = `/ko/apps/${app.slug}`;
    ctaLabel = t('ctaViewDetail');
    ctaExternal = false;
  }

  return (
    <section
      ref={registerRef}
      data-index={index}
      aria-label={app.title}
      style={{
        height: '100%',
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        position: 'relative',
        padding: '20px 16px',
        flexWrap: 'wrap',
      }}
    >
      {/* 폰 프레임 */}
      <div
        style={{
          position: 'relative',
          width: 'min(300px, 64vw)',
          aspectRatio: '9 / 17.5',
          maxHeight: '76vh',
          borderRadius: 38,
          border: '8px solid #20242e',
          background: '#0a0c11',
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,.6)',
          flexShrink: 0,
        }}
      >
        {/* 노치 */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 90,
            height: 20,
            background: '#20242e',
            borderRadius: '0 0 12px 12px',
            zIndex: 3,
          }}
        />

        {/* 상태 배지 */}
        {badgeLabel && (
          <span
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              zIndex: 4,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '.04em',
              color: '#0b0d12',
              background: badgeBg,
              padding: '4px 9px',
              borderRadius: 7,
            }}
          >
            {badgeLabel}
          </span>
        )}

        {/* 스크린 콘텐츠 */}
        <div style={{ position: 'absolute', inset: 0 }}>
          {contentType === 'webdemo' &&
            (isActive ? (
              <iframe
                src={app.live_url as string}
                title={app.title}
                sandbox="allow-scripts allow-forms allow-popups"
                referrerPolicy="no-referrer"
                loading="lazy"
                style={{ width: '100%', height: '100%', border: 0, display: 'block', background: '#fff' }}
              />
            ) : (
              <PlaceholderFill emoji={app.thumbnail_emoji} gradient={gradient} />
            ))}

          {contentType === 'video' &&
            (isActive ? (
              <iframe
                src={embedUrl as string}
                title={app.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                loading="lazy"
                style={{ width: '100%', height: '100%', border: 0, display: 'block', background: '#000' }}
              />
            ) : (
              <PlaceholderFill emoji={app.thumbnail_emoji} gradient={gradient} />
            ))}

          {contentType === 'screenshot' && screenshotUrl && (
            <Image
              src={screenshotUrl}
              alt={t('screenshotAlt', { title: app.title })}
              fill
              style={{ objectFit: 'cover' }}
              sizes={PHONE_IMAGE_SIZES}
            />
          )}

          {contentType === 'emoji' && (
            <PlaceholderFill emoji={app.thumbnail_emoji} gradient={gradient} />
          )}
        </div>

        {/* 하단 정보 오버레이 */}
        <div
          style={{
            position: 'absolute',
            left: 14,
            right: 14,
            bottom: 14,
            zIndex: 5,
            maxWidth: '82%',
            textShadow: '0 2px 12px rgba(0,0,0,.8)',
          }}
        >
          <Link
            href={`/ko/apps/${app.slug}`}
            style={{
              display: 'block',
              fontSize: 16,
              fontWeight: 800,
              color: '#fff',
              marginBottom: 5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <span aria-hidden="true">{app.thumbnail_emoji}</span> {app.title}
          </Link>
          {(app.tagline ?? app.description) && (
            <div
              style={{
                fontSize: 12.5,
                color: 'rgba(255,255,255,.85)',
                lineHeight: 1.5,
                marginBottom: 8,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {app.tagline ?? app.description}
            </div>
          )}
          {app.author && (
            <Link
              href={`/ko/makers/${app.author.handle}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11.5,
                color: 'rgba(255,255,255,.75)',
              }}
            >
              <AvatarCircle profile={app.author} size={20} fontSize={10} />
              <span>{app.author.display_name}</span>
            </Link>
          )}
        </div>
      </div>

      {/* 우측 액션 레일 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', flexShrink: 0 }}>
        <UpvoteButton
          appId={app.id}
          initialCount={app.vote_count}
          isLoggedIn={isLoggedIn}
          variant="rail"
        />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <BookmarkButton appId={app.id} isLoggedIn={isLoggedIn} variant="rail" />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
            {t('bookmarkLabel')}
          </span>
        </div>

        <Link
          href={`/ko/apps/${app.slug}#reviews`}
          aria-label={t('reviewsAria', { n: reviewCount })}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
        >
          <span style={railButtonBase} aria-hidden="true">
            💬
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{reviewCount}</span>
        </Link>

        {ctaExternal ? (
          <a href={ctaHref} target="_blank" rel="noopener noreferrer" style={ctaButtonStyle}>
            {ctaLabel}
          </a>
        ) : (
          <Link href={ctaHref} style={ctaButtonStyle}>
            {ctaLabel}
          </Link>
        )}
      </div>
    </section>
  );
}

function FeedFinalSlide({
  index,
  registerRef,
}: {
  index: number;
  registerRef: (el: HTMLDivElement | null) => void;
}) {
  const t = useTranslations('feed');

  return (
    <section
      ref={registerRef}
      data-index={index}
      aria-label={t('finalCta')}
      style={{
        height: '100%',
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ fontSize: 44, marginBottom: 18 }} aria-hidden="true">
          {t('finalEmoji')}
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.4, marginBottom: 12, whiteSpace: 'pre-line' }}>
          {t('finalTitle')}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 28, whiteSpace: 'pre-line' }}>
          {t('finalDesc')}
        </p>
        <Link href="/ko/submit" className="lp-btn lp-btn-primary" style={{ fontSize: 15 }}>
          {t('finalCta')}
        </Link>
      </div>
    </section>
  );
}

export default function FeedClient({ apps, reviewCounts, firstScreenshotUrls }: Props) {
  const t = useTranslations('feed');
  const { isLoggedIn } = useSession();

  const totalSlides = apps.length + 1;
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  // 힌트 소멸 여부 — HINT_HIDE_MS 경과 또는 사용자가 실제로 스크롤(슬라이드 전환)하면 true
  const [hintDismissed, setHintDismissed] = useState(false);

  // 첫 진입 힌트 — 수초 후 자동 소멸 타이머
  useEffect(() => {
    if (totalSlides <= 1) return;
    const timer = setTimeout(() => setHintDismissed(true), HINT_HIDE_MS);
    return () => clearTimeout(timer);
  }, [totalSlides]);

  // 활성 슬라이드 추적 — iframe/영상 지연 마운트(±1)에 사용. 슬라이드 전환 시 힌트도 즉시 소멸.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.index);
            if (!Number.isNaN(idx)) {
              setActiveIndex(idx);
              if (idx !== 0) setHintDismissed(true);
            }
          }
        });
      },
      { root: container, threshold: 0.6 }
    );

    slideRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [totalSlides]);

  // 키보드 ↑↓ 지원
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      const container = containerRef.current;
      if (!container) return;
      e.preventDefault();
      const dir = e.key === 'ArrowDown' ? 1 : -1;
      container.scrollBy({ top: dir * container.clientHeight, behavior: 'smooth' });
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const scrollToIndex = useCallback((i: number) => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({ top: i * container.clientHeight, behavior: 'smooth' });
  }, []);

  const dots = useMemo(() => Array.from({ length: totalSlides }, (_, i) => i), [totalSlides]);

  return (
    <div
      style={{
        height: `calc(100dvh - ${NAV_HEIGHT_PX}px)`,
        position: 'relative',
        background: 'var(--bg)',
      }}
    >
      <div
        ref={containerRef}
        className="hide-scrollbar"
        style={{
          height: '100%',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
        }}
      >
        {apps.map((app, i) => (
          <FeedAppSlide
            key={app.id}
            app={app}
            index={i}
            isActive={Math.abs(activeIndex - i) <= 1}
            isLoggedIn={isLoggedIn}
            reviewCount={reviewCounts[app.id] ?? 0}
            screenshotUrl={firstScreenshotUrls[app.id] ?? null}
            registerRef={(el) => {
              slideRefs.current[i] = el;
            }}
          />
        ))}

        <FeedFinalSlide
          index={apps.length}
          registerRef={(el) => {
            slideRefs.current[apps.length] = el;
          }}
        />
      </div>

      {/* 진행 인디케이터 */}
      {totalSlides > 1 && (
        <div
          role="group"
          aria-label={t('progressAria', { current: activeIndex + 1, total: totalSlides })}
          style={{
            position: 'absolute',
            right: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            zIndex: 20,
          }}
        >
          {dots.map((i) => (
            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              aria-label={t('goToSlideAria', { n: i + 1 })}
              aria-current={activeIndex === i}
              style={{
                width: 5,
                height: activeIndex === i ? 18 : 5,
                borderRadius: 99,
                background: activeIndex === i ? 'var(--brand)' : 'rgba(255,255,255,.2)',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'all .2s',
              }}
            />
          ))}
        </div>
      )}

      {/* 첫 진입 스크롤 힌트 */}
      {totalSlides > 1 && !hintDismissed && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: 18,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
            fontSize: 12,
            color: 'var(--muted)',
            background: 'rgba(20,24,33,.85)',
            border: '1px solid var(--line)',
            padding: '7px 14px',
            borderRadius: 99,
            pointerEvents: 'none',
            transition: 'opacity .3s',
          }}
        >
          {t('scrollHint')}
        </div>
      )}
    </div>
  );
}
