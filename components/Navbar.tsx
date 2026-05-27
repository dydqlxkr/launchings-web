'use client';

/**
 * Navbar — Phase 2: 로그인 상태에 따라 UI 변경.
 * Phase UX1: 데스크톱 텍스트 링크 + 모바일 햄버거 메뉴.
 *
 * - 데스크톱(≥768px): 로고 우측 "둘러보기" · "제품 등록" 텍스트 링크 + 현재 경로 활성표시
 * - 모바일(<768px): 햄버거(44×44) → 풀스크린 메뉴 (aria-expanded, ESC, 바깥 클릭 닫기)
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
}

interface Props {
  user?: NavUser | null;
}

const NAV_LINKS = [
  { href: '/ko/apps', labelKey: 'browse' as const },
  { href: '/ko/submit', labelKey: 'submit' as const },
];

export default function Navbar({ user }: Props) {
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

  // 모바일 메뉴 열릴 때 바디 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

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

  const navLinkStyle = (href: string): React.CSSProperties => ({
    fontSize: 14,
    fontWeight: 600,
    color: isActive(href) ? 'var(--ink)' : 'var(--muted)',
    textDecoration: 'none',
    padding: '4px 2px',
    position: 'relative',
    borderBottom: isActive(href) ? '2px solid var(--brand)' : '2px solid transparent',
    transition: 'color .15s, border-color .15s',
    whiteSpace: 'nowrap',
  });

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
          {/* 모바일 햄버거 버튼 (<768px) — 가장 왼쪽 */}
          <button
            ref={hamburgerRef}
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-controls="mobile-nav-menu"
            className="md:hidden"
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
              flexShrink: 0,
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

          {/* 데스크톱 내비 링크 (≥768px) */}
          <div
            className="hidden md:flex"
            style={{
              gap: 20,
              alignItems: 'center',
            }}
          >
            {NAV_LINKS.map(({ href, labelKey }) => (
              <Link key={href} href={href} style={navLinkStyle(href)}>
                {t(labelKey)}
              </Link>
            ))}
          </div>

          {/* 오른쪽 영역 — 로그인/프로필 */}
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

      {/* 모바일 슬라이드 메뉴 */}
      {mobileOpen && (
        <div
          ref={mobileMenuRef}
          id="mobile-nav-menu"
          role="navigation"
          aria-label="모바일 내비게이션"
          style={{
            position: 'fixed',
            top: 62,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 49,
            background: 'var(--bg)',
            borderTop: '1px solid var(--line)',
            overflowY: 'auto',
            padding: '24px 24px 40px',
          }}
        >
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {NAV_LINKS.map(({ href, labelKey }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'block',
                  fontSize: 18,
                  fontWeight: 700,
                  color: isActive(href) ? 'var(--brand)' : 'var(--ink)',
                  padding: '14px 4px',
                  borderBottom: '1px solid var(--line)',
                  textDecoration: 'none',
                }}
              >
                {t(labelKey)}
              </Link>
            ))}

            {user ? (
              <>
                <Link
                  href={`/ko/makers/${user.id}`}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'block',
                    fontSize: 18,
                    fontWeight: 700,
                    color: 'var(--ink)',
                    padding: '14px 4px',
                    borderBottom: '1px solid var(--line)',
                    textDecoration: 'none',
                  }}
                >
                  {t('myProfile')}
                </Link>
                <Link
                  href="/ko/my-apps"
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'block',
                    fontSize: 18,
                    fontWeight: 700,
                    color: 'var(--ink)',
                    padding: '14px 4px',
                    borderBottom: '1px solid var(--line)',
                    textDecoration: 'none',
                  }}
                >
                  {t('myApps')}
                </Link>
                <Link
                  href="/ko/settings"
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'block',
                    fontSize: 18,
                    fontWeight: 700,
                    color: 'var(--ink)',
                    padding: '14px 4px',
                    borderBottom: '1px solid var(--line)',
                    textDecoration: 'none',
                  }}
                >
                  {t('profileSettings')}
                </Link>
                <form action={signOut} style={{ marginTop: 4 }}>
                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      color: '#ff6b6b',
                      fontSize: 18,
                      fontWeight: 700,
                      padding: '14px 4px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      borderBottom: '1px solid var(--line)',
                    }}
                  >
                    {t('logout')}
                  </button>
                </form>
              </>
            ) : (
              <button
                onClick={() => { setMobileOpen(false); setShowLogin(true); }}
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: 20,
                  background: 'linear-gradient(135deg,var(--brand),var(--brand2))',
                  border: 'none',
                  borderRadius: 12,
                  padding: '14px 24px',
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#fff',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'center',
                }}
              >
                {t('login')}
              </button>
            )}
          </nav>
        </div>
      )}

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}
