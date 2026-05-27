import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { AppWithRelations } from '@/lib/types';
import AvatarCircle from './AvatarCircle';
import UpvoteButton from './UpvoteButton';
import CompareToggle from './CompareToggle';

interface Props {
  app: AppWithRelations;
  isLoggedIn?: boolean;
}

export default function AppCard({ app, isLoggedIn = false }: Props) {
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
          }}
        >
          {app.thumbnail_emoji}

          {/* Type badge */}
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
              📦 {t('native')}
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
          <div
            style={{
              fontWeight: 700,
              fontSize: 16,
              marginBottom: 4,
              color: 'var(--ink)',
            }}
          >
            {app.title}
          </div>
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

          {/* Upvote */}
          <UpvoteButton appId={app.id} initialCount={app.vote_count} isLoggedIn={isLoggedIn} />
        </div>

        {/* Bottom row: try link + compare toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
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
          <CompareToggle appId={app.id} />
        </div>
      </div>
    </div>
  );
}
