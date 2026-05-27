import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Profile, AppWithRelations } from '@/lib/types';
import AvatarCircle from './AvatarCircle';

interface Props {
  profile: Profile;
  apps: AppWithRelations[];
}

export default function MakerCard({ profile, apps }: Props) {
  const t = useTranslations('makerCard');

  const totalVotes = apps.reduce((sum, a) => sum + a.vote_count, 0);
  const flagApp = apps[0]; // 대표 앱

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: 18,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform .18s, border-color .18s, box-shadow .18s',
        cursor: 'pointer',
      }}
      className="hover:-translate-y-1 hover:border-[var(--brand)] hover:shadow-[0_12px_40px_rgba(0,0,0,.4)]"
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <AvatarCircle profile={profile} size={52} fontSize={22} />
        <div>
          <div
            style={{
              fontWeight: 800,
              fontSize: 16.5,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {profile.display_name}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 12.5 }}>
            {t('products', { count: apps.length })}
          </div>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <div
          style={{
            color: '#cfd6e4',
            fontSize: 13.6,
            lineHeight: 1.5,
            margin: '13px 0',
            flex: 1,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {profile.bio}
        </div>
      )}

      {/* Flag app */}
      {flagApp && (
        <Link
          href={`/ko/apps/${flagApp.slug}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--bg2)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            padding: 10,
            marginBottom: 14,
          }}
          className="hover:border-[var(--brand)] transition-colors"
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              flexShrink: 0,
              background: flagApp.thumbnail_gradient
                ? `linear-gradient(${flagApp.thumbnail_gradient})`
                : 'var(--chip)',
            }}
          >
            {flagApp.thumbnail_emoji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>{flagApp.title}</div>
            <div style={{ fontSize: 11.5, color: 'var(--brand)', fontWeight: 700 }}>
              {flagApp.app_type === 'native' ? '↗ 라이브 데모 보기' : '▶ 바로 실행해보기'}
            </div>
          </div>
        </Link>
      )}

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginTop: 'auto',
        }}
      >
        <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--muted)' }}>
          <span>
            <strong style={{ color: 'var(--ink)', fontSize: 13.5 }}>{apps.length}</strong>{' '}
            {t('products')}
          </span>
          <span>
            <strong style={{ color: 'var(--ink)', fontSize: 13.5 }}>
              {(totalVotes / 1000).toFixed(1)}k
            </strong>{' '}
            {t('votes')}
          </span>
        </div>
        <Link
          href={`/ko/makers/${profile.handle}`}
          style={{
            background: 'linear-gradient(135deg,var(--brand),var(--brand2))',
            color: '#fff',
            border: 0,
            borderRadius: 9,
            padding: '8px 13px',
            fontSize: 12.5,
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            display: 'inline-block',
          }}
        >
          {t('viewProfile')}
        </Link>
      </div>
    </div>
  );
}
