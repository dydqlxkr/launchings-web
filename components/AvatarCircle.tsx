/**
 * 메이커 아바타 — avatar_url이 있으면 원형 이미지, 없으면 gradient+initial.
 */

import Image from 'next/image';
import type { Profile } from '@/lib/types';

interface Props {
  profile: Profile;
  size?: number;
  fontSize?: number;
}

export default function AvatarCircle({ profile, size = 52, fontSize = 22 }: Props) {
  if (profile.avatar_url) {
    return (
      <div
        aria-label={profile.display_name}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        <Image
          src={profile.avatar_url}
          alt={profile.display_name}
          width={size}
          height={size}
          sizes={`${size}px`}
          style={{
            objectFit: 'cover',
            display: 'block',
          }}
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={profile.display_name}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: profile.avatar_gradient
          ? `linear-gradient(${profile.avatar_gradient})`
          : 'linear-gradient(135deg, var(--brand), var(--brand2))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize,
        fontWeight: 800,
        color: '#fff',
        flexShrink: 0,
      }}
    >
      <span aria-hidden="true">
        {profile.avatar_initial ?? profile.display_name[0]}
      </span>
    </div>
  );
}
