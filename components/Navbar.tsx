'use client';

/**
 * Navbar — Phase 2: 로그인 상태에 따라 UI 변경.
 * 서버 컴포넌트에서 user prop을 내려받아 렌더링.
 */

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { signOut } from '@/lib/actions/auth';
import LoginModal from './LoginModal';

interface NavUser {
  id: string;
  email?: string | null;
}

interface Props {
  user?: NavUser | null;
}

export default function Navbar({ user }: Props) {
  const t = useTranslations('nav');
  const [showLogin, setShowLogin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backdropFilter: 'blur(12px)',
          background: 'rgba(11,13,18,.72)',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div className="max-w-[1120px] mx-auto px-6 flex items-center gap-7 h-[62px]">
          {/* Logo */}
          <Link
            href="/ko"
            className="font-extrabold text-[20px] tracking-tight flex items-center gap-2"
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: 'linear-gradient(135deg,var(--brand),var(--brand2))',
                boxShadow: '0 0 14px var(--brand)',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            {t('brand')}
          </Link>

          {/* Right — 로그인/프로필만, 오른쪽 끝 */}
          <div className="ml-auto flex gap-3 items-center">
            {/* 로그인/프로필 */}
            {user ? (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowUserMenu((v) => !v)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg,var(--brand),var(--brand2))',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 800,
                    color: '#fff',
                    flexShrink: 0,
                  }}
                  aria-label="내 메뉴"
                >
                  {user.email?.charAt(0).toUpperCase() ?? 'U'}
                </button>

                {showUserMenu && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: 8,
                      background: 'var(--card)',
                      border: '1px solid var(--line)',
                      borderRadius: 12,
                      padding: 8,
                      minWidth: 160,
                      boxShadow: '0 8px 24px rgba(0,0,0,.3)',
                    }}
                    onMouseLeave={() => setShowUserMenu(false)}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--muted)',
                        padding: '6px 10px',
                        maxWidth: 160,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user.email}
                    </div>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '6px 0' }} />
                    <Link
                      href="/ko/submit"
                      onClick={() => setShowUserMenu(false)}
                      style={{
                        display: 'block',
                        color: 'var(--ink)',
                        fontSize: 13,
                        fontWeight: 600,
                        padding: '7px 10px',
                        textDecoration: 'none',
                        borderRadius: 8,
                      }}
                    >
                      {t('mySubmit')}
                    </Link>
                    <Link
                      href="/ko/settings"
                      onClick={() => setShowUserMenu(false)}
                      style={{
                        display: 'block',
                        color: 'var(--ink)',
                        fontSize: 13,
                        fontWeight: 600,
                        padding: '7px 10px',
                        textDecoration: 'none',
                        borderRadius: 8,
                      }}
                    >
                      {t('profileSettings')}
                    </Link>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '6px 0' }} />
                    <form action={signOut}>
                      <button
                        type="submit"
                        style={{
                          width: '100%',
                          background: 'none',
                          border: 'none',
                          color: '#ff6b6b',
                          fontSize: 13,
                          fontWeight: 600,
                          padding: '7px 10px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          borderRadius: 8,
                          fontFamily: 'inherit',
                        }}
                      >
                        로그아웃
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                style={{
                  background: 'linear-gradient(135deg,var(--brand),var(--brand2))',
                  border: 'none',
                  borderRadius: 10,
                  padding: '7px 16px',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#fff',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                로그인
              </button>
            )}
          </div>
        </div>
      </nav>

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}
