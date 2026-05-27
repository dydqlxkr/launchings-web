/**
 * 메이커 아바타 — Phase 1에서는 gradient+initial 방식,
 * Phase 2에서 avatar_url이 있으면 next/image로 전환.
 */

import type { Profile } from '@/lib/types';

interface Props {
  profile: Profile;
  size?: number;
  fontSize?: number;
}

export default function AvatarCircle({ profile, size = 52, fontSize = 22 }: Props) {
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
