import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { AppWithRelations } from '@/lib/types';
import { getThumbnailUrl } from '@/lib/thumbnailUrl';
import AvatarCircle from './AvatarCircle';
import UpvoteButton from './UpvoteButton';
import BookmarkButton from './BookmarkButton';
import CompareToggle from './CompareToggle';
import ViewCount from './ViewCount';

interface Props {
  app: AppWithRelations;
  isLoggedIn?: boolean;
  initialBookmarked?: boolean;
}

export default function AppCard({ app, isLoggedIn = false, initialBookmarked = false }: Props) {
  const t = useTranslations('appCard');

  const isNative = app.app_type === 'native';

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: 16,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform .18s, border-color .18s, box-shadow .18s',
      }}
      className="hover:-translate-y-1 hover:border-[var(--brand)] hover:shadow-[0_12px_40px_rgba(0,0,0,.4)]"
    >
      {/* Thumbnail */}
      <Link href={`/ko/apps/${app.slug}`} className="block">
        <div
          role="img"
          aria-label={`${app.title} 썸네일`}
          style={{
            height: 128,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 44,
            background: app.thumbnail_gradient
              ? `linear-gradient(${app.thumbnail_gradient})`
              : 'var(--card2)',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {app.thumbnail_path ? (
            <Image
              src={getThumbnailUrl(app.thumbnail_path)}
              alt={`${app.title} 썸네일`}
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, 400px"
            />
          ) : (
            <span aria-hidden="true">{app.thumbnail_emoji}</span>
          )}

          {/* Type badge — LIVE 배지 유지 */}
          {isNative ? (
            <span
              style={{
                position: 'absolute',
                top: 10,
                left: 10,
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 9px',
                borderRadius: 7,
                background: 'rgba(0,0,0,.45)',
                backdropFilter: 'blur(4px)',
                color: 'var(--warm)',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span aria-hidden="true">📦</span> {t('native')}
            </span>
          ) : (
            <span
              style={{
                position: 'absolute',
                top: 10,
                left: 10,
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 9px',
                borderRadius: 7,
                background: 'rgba(0,0,0,.45)',
                backdropFilter: 'blur(4px)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  display: 'inline-block',
                }}
              />
              {t('webapp')}
            </span>
          )}
        </div>
      </Link>

      {/* Body */}
      <div
        style={{
          padding: '15px 16px 16px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Link href={`/ko/apps/${app.slug}`}>
          {/* 제목: 1줄 클램프 (다국어 긴 제목 대비) */}
          <div
            style={{
              fontWeight: 700,
              fontSize: 16,
              marginBottom: 4,
              color: 'var(--ink)',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {app.title}
          </div>
          {/* 설명: 2줄 클램프 유지 */}
          <div
            style={{
              color: 'var(--muted)',
              fontSize: 13.2,
              lineHeight: 1.5,
              flex: 1,
              marginBottom: 13,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {app.tagline ?? app.description}
          </div>
        </Link>

        {/* Footer row: maker + upvote */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Maker link */}
          {app.author && (
            <Link
              href={`/ko/makers/${app.author.handle}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                color: 'var(--muted)',
              }}
              className="hover:text-[var(--brand)] transition-colors"
            >
              <AvatarCircle profile={app.author} size={24} fontSize={12} />
              <span>{app.author.display_name}</span>
            </Link>
          )}

          {/* Upvote + Bookmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <UpvoteButton appId={app.id} initialCount={app.vote_count} isLoggedIn={isLoggedIn} />
            <BookmarkButton appId={app.id} initialBookmarked={initialBookmarked} isLoggedIn={isLoggedIn} size="sm" />
          </div>
        </div>

        {/* Bottom row: detail link + view count + compare toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: 11,
            gap: 8,
          }}
        >
          <Link
            href={`/ko/apps/${app.slug}`}
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: 'var(--brand)',
              flexShrink: 0,
            }}
          >
            {isNative ? t('tryDemo') : t('tryNow')}
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            {/* 조회수 */}
            <ViewCount count={app.view_count} />
            {/* 비교 담기: 아이콘 중심 소형 버튼으로 시각 비중 낮춤 */}
            <CompareToggle appId={app.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
