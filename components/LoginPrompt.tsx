'use client';

/**
 * 비로그인 사용자에게 로그인 안내 카드를 보여주는 컴포넌트.
 * LoginModal을 내장하여 버튼 클릭 시 바로 모달 오픈.
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import LoginModal from './LoginModal';

export default function LoginPrompt() {
  const t = useTranslations('submit');
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '60px 24px',
        }}
      >
        {/* 자물쇠 아이콘 */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg,rgba(108,140,255,.18),rgba(155,108,255,.18))',
            border: '1px solid rgba(108,140,255,.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            marginBottom: 20,
          }}
          aria-hidden="true"
        >
          🔒
        </div>

        <h2
          style={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: '-.4px',
            marginBottom: 10,
            color: 'var(--ink)',
          }}
        >
          {t('loginRequired')}
        </h2>

        <p
          style={{
            fontSize: 14,
            color: 'var(--muted)',
            lineHeight: 1.7,
            maxWidth: 320,
            marginBottom: 28,
          }}
        >
          {t('loginRequiredDesc')}
        </p>

        <button
          onClick={() => setShowLogin(true)}
          style={{
            background: 'linear-gradient(135deg,var(--brand),var(--brand2))',
            border: 'none',
            borderRadius: 12,
            padding: '13px 32px',
            fontSize: 15,
            fontWeight: 700,
            color: '#fff',
            cursor: 'pointer',
            fontFamily: 'inherit',
            boxShadow: '0 4px 20px rgba(108,140,255,.35)',
            transition: 'opacity .15s',
          }}
        >
          {t('loginButton')}
        </button>
      </div>

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}
