'use client';

/**
 * Navbar — Phase 2: 로그인 상태에 따라 UI 변경.
 *
 * - 모든 화면: 햄버거(44×44) → 드롭다운 메뉴 (aria-expanded, ESC, 바깥 클릭 닫기)
 * - 우측 끝: 로그인/아바타(현행 유지)
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useEffect, useRef, useCallback } from 'react';
import { signOut } from '@/lib/actions/auth';
import LoginModal from './LoginModal';

interface NavUser {
  id: string;
  email?: string | null;
  handle?: string | null;
  displayName?: string | null;
}

interface Props {
  user?: NavUser | null;
  unreadNotifications?: number;
}

const NAV_LINKS = [
  { href: '/ko/apps', labelKey: 'browse' as const },
  { href: '/ko/submit', labelKey: 'submit' as const },
  { href: '/ko/contact', labelKey: 'contact' as const },
];

export default function Navbar({ user, unreadNotifications = 0 }: Props) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [showLogin, setShowLogin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // ESC로 모바일 메뉴 닫기
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && mobileOpen) {
      setMobileOpen(false);
      hamburgerRef.current?.focus();
    }
  }, [mobileOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // (드롭다운 방식으로 변경됨 — body 스크롤 잠금 불필요)

  // 모바일 메뉴 바깥 클릭 닫기
  useEffect(() => {
    if (!mobileOpen) return;
    function handleOutside(e: MouseEvent) {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node) &&
        hamburgerRef.current &&
        !hamburgerRef.current.contains(e.target as Node)
      ) {
        setMobileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [mobileOpen]);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/');
  }

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
        <div className="lp-container" style={{ display: 'flex', alignItems: 'center', gap: 16, height: 62 }}>
          {/* 햄버거 버튼 래퍼 — position:relative로 드롭다운 기준점 */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              ref={hamburgerRef}
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? '메뉴 닫기' : '메뉴 열기'}
              aria-controls="mobile-nav-menu"
              style={{
                width: 44,
                height: 44,
                background: 'none',
                border: '1px solid var(--line)',
                borderRadius: 10,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 5,
              }}
            >
              {/* 햄버거 아이콘 */}
              <span
                style={{
                  display: 'block',
                  width: 18,
                  height: 2,
                  background: 'var(--ink)',
                  borderRadius: 2,
                  transition: 'transform .2s, opacity .2s',
                  transform: mobileOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none',
                }}
              />
              <span
                style={{
                  display: 'block',
                  width: 18,
                  height: 2,
                  background: 'var(--ink)',
                  borderRadius: 2,
                  transition: 'opacity .2s',
                  opacity: mobileOpen ? 0 : 1,
                }}
              />
              <span
                style={{
                  display: 'block',
                  width: 18,
                  height: 2,
                  background: 'var(--ink)',
                  borderRadius: 2,
                  transition: 'transform .2s, opacity .2s',
                  transform: mobileOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none',
                }}
              />
            </button>

            {/* 햄버거 드롭다운 메뉴 — 햄버거 아이콘 바로 아래 정렬 */}
            {mobileOpen && (
              <div
                ref={mobileMenuRef}
                id="mobile-nav-menu"
                role="navigation"
                aria-label="모바일 내비게이션"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  width: 'min(260px, calc(100vw - 20px))',
                  zIndex: 200,
                  background: 'var(--card)',
                  border: '1px solid var(--line)',
                  borderRadius: 12,
                  boxShadow: 'var(--shadow-pop)',
                  padding: 8,
                  animation: 'mobileMenuFadeIn .15s ease',
                }}
              >
                <style>{`
                  @keyframes mobileMenuFadeIn {
                    from { opacity: 0; transform: translateY(-6px); }
                    to   { opacity: 1; transform: translateY(0); }
                  }
                  @media (prefers-reduced-motion: reduce) {
                    @keyframes mobileMenuFadeIn { from { opacity: 1; } to { opacity: 1; } }
                  }
                `}</style>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {NAV_LINKS.map(({ href, labelKey }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      style={{
                        display: 'block',
                        fontSize: 14,
                        fontWeight: 600,
                        color: isActive(href) ? 'var(--brand)' : 'var(--ink)',
                        padding: '9px 10px',
                        borderRadius: 8,
                        textDecoration: 'none',
                        background: isActive(href) ? 'rgba(108,140,255,.08)' : 'transparent',
                      }}
                    >
                      {t(labelKey)}
                    </Link>
                  ))}

                  {user ? (
                    <>
                      <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '4px 0' }} />
                      <Link
                        href={user.handle ? `/ko/makers/${user.handle}` : '/ko/settings'}
                        onClick={() => setMobileOpen(false)}
                        style={{
                          display: 'block',
                          fontSize: 14,
                          fontWeight: 600,
                          color: 'var(--ink)',
                          padding: '9px 10px',
                          borderRadius: 8,
                          textDecoration: 'none',
                        }}
                      >
                        {t('myProfile')}
                      </Link>
                      <Link
                        href="/ko/notifications"
                        onClick={() => setMobileOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 14,
                          fontWeight: 600,
                          color: 'var(--ink)',
                          padding: '9px 10px',
                          borderRadius: 8,
                          textDecoration: 'none',
                        }}
                      >
                        {t('notifications')}
                        {unreadNotifications > 0 && (
                          <span
                            style={{
                              background: 'var(--brand)',
                              color: '#fff',
                              fontSize: 11,
                              fontWeight: 800,
                              borderRadius: 10,
                              padding: '1px 6px',
                              lineHeight: '16px',
                            }}
                          >
                            {unreadNotifications > 99 ? '99+' : unreadNotifications}
                          </span>
                        )}
                      </Link>
                      <Link
                        href="/ko/my-apps"
                        onClick={() => setMobileOpen(false)}
                        style={{
                          display: 'block',
                          fontSize: 14,
                          fontWeight: 600,
                          color: 'var(--ink)',
                          padding: '9px 10px',
                          borderRadius: 8,
                          textDecoration: 'none',
                        }}
                      >
                        {t('myApps')}
                      </Link>
                      <Link
                        href="/ko/bookmarks"
                        onClick={() => setMobileOpen(false)}
                        style={{
                          display: 'block',
                          fontSize: 14,
                          fontWeight: 600,
                          color: 'var(--ink)',
                          padding: '9px 10px',
                          borderRadius: 8,
                          textDecoration: 'none',
                        }}
                      >
                        {t('myBookmarks')}
                      </Link>
                      <Link
                        href="/ko/settings"
                        onClick={() => setMobileOpen(false)}
                        style={{
                          display: 'block',
                          fontSize: 14,
                          fontWeight: 600,
                          color: 'var(--ink)',
                          padding: '9px 10px',
                          borderRadius: 8,
                          textDecoration: 'none',
                        }}
                      >
                        {t('profileSettings')}
                      </Link>
                      <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '4px 0' }} />
                      <form action={signOut}>
                        <button
                          type="submit"
                          style={{
                            width: '100%',
                            background: 'none',
                            border: 'none',
                            color: '#ff6b6b',
                            fontSize: 14,
                            fontWeight: 600,
                            padding: '9px 10px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontFamily: 'inherit',
                            borderRadius: 8,
                          }}
                        >
                          {t('logout')}
                        </button>
                      </form>
                    </>
                  ) : (
                    <>
                      <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '4px 0' }} />
                      <button
                        onClick={() => { setMobileOpen(false); setShowLogin(true); }}
                        style={{
                          width: '100%',
                          background: 'linear-gradient(135deg,var(--brand),var(--brand2))',
                          border: 'none',
                          borderRadius: 8,
                          padding: '9px 10px',
                          fontSize: 14,
                          fontWeight: 700,
                          color: '#fff',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          textAlign: 'left',
                        }}
                      >
                        {t('login')}
                      </button>
                    </>
                  )}
                </nav>
              </div>
            )}
          </div>

          {/* Logo */}
          <Link
            href="/ko"
            className="font-extrabold text-[20px] tracking-tight flex items-center gap-2"
            style={{ flexShrink: 0 }}
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

          {/* 오른쪽 영역 — 로그인/프로필 */}
          <div className="ml-auto flex gap-3 items-center">
            {/* 알림 벨 아이콘 — 로그인 시만 표시 */}
            {user && (
              <Link
                href="/ko/notifications"
                aria-label={t('notifications')}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  border: '1px solid var(--line)',
                  background: 'none',
                  color: 'var(--ink)',
                  textDecoration: 'none',
                  flexShrink: 0,
                }}
              >
                {/* Bell SVG */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadNotifications > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -2,
                      right: -2,
                      background: '#ff4757',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 800,
                      borderRadius: 10,
                      minWidth: 16,
                      height: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 3px',
                      lineHeight: 1,
                    }}
                  >
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </span>
                )}
              </Link>
            )}

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
                  aria-expanded={showUserMenu}
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
                      boxShadow: 'var(--shadow-pop)',
                    }}
                    onMouseLeave={() => setShowUserMenu(false)}
                  >
                    {/* 프로필 정보 헤더 */}
                    <div style={{ padding: '6px 10px', maxWidth: 180 }}>
                      {user.displayName && (
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: 'var(--ink)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {user.displayName}
                        </div>
                      )}
                      {user.handle && (
                        <div
                          style={{
                            fontSize: 12,
                            color: 'var(--muted)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          @{user.handle}
                        </div>
                      )}
                      {!user.displayName && !user.handle && (
                        <div
                          style={{
                            fontSize: 12,
                            color: 'var(--muted)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {user.email}
                        </div>
                      )}
                    </div>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '6px 0' }} />
                    <Link
                      href={user.handle ? `/ko/makers/${user.handle}` : '/ko/settings'}
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
                      {t('myProfile')}
                    </Link>
                    <Link
                      href="/ko/notifications"
                      onClick={() => setShowUserMenu(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        color: 'var(--ink)',
                        fontSize: 13,
                        fontWeight: 600,
                        padding: '7px 10px',
                        textDecoration: 'none',
                        borderRadius: 8,
                      }}
                    >
                      {t('notifications')}
                      {unreadNotifications > 0 && (
                        <span
                          style={{
                            background: '#ff4757',
                            color: '#fff',
                            fontSize: 10,
                            fontWeight: 800,
                            borderRadius: 10,
                            padding: '1px 5px',
                            lineHeight: '15px',
                          }}
                        >
                          {unreadNotifications > 99 ? '99+' : unreadNotifications}
                        </span>
                      )}
                    </Link>
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
                      href="/ko/my-apps"
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
                      {t('myApps')}
                    </Link>
                    <Link
                      href="/ko/bookmarks"
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
                      {t('myBookmarks')}
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
                        {t('logout')}
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
                {t('login')}
              </button>
            )}
          </div>
        </div>
      </nav>

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}
