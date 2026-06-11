'use client';

/**
 * 로그인 모달 — 이메일/비밀번호 + 구글 OAuth.
 * 탭: [로그인 | 회원가입]
 * 구글 미설정 시 이메일/비밀번호 로그인은 정상 동작.
 * 로그인 탭: 비밀번호 찾기 링크 → 이메일 입력 → 재설정 메일 전송.
 * 회원가입 탭: 사이트 아이디(handle) 입력 (3~20자 영문/숫자/-/_).
 *             handle 입력 시 400ms 디바운스 실시간 중복 확인.
 */

import { useState, useTransition, useEffect, useRef, useId } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { signInWithPassword, signUpWithPassword, requestPasswordReset } from '@/lib/actions/auth';
import { checkHandleAvailable } from '@/lib/actions/profile';
import { createClient } from '@/lib/supabase/client';
import Modal from './Modal';

/**
 * reason: 로그인 모달을 띄우는 컨텍스트. 해당 문구를 모달 상단에 표시.
 * - 'upvote': "로그인하면 이 앱을 추천할 수 있어요"
 * - 'bookmark': "로그인하면 이 앱을 북마크할 수 있어요"
 * - undefined: 기본 문구 없음
 */
type LoginReason = 'upvote' | 'bookmark';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reason?: LoginReason;
}

type Tab = 'login' | 'signup';
// 로그인 탭 내 모드: 일반 로그인 / 비밀번호 찾기
type LoginMode = 'normal' | 'forgot';

/** handle 실시간 체크 상태 */
type HandleStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'available' }
  | { state: 'unavailable'; reason: string };

const DEBOUNCE_MS = 400;

const REASON_MESSAGES: Record<LoginReason, string> = {
  upvote: '로그인하면 이 앱을 추천할 수 있어요',
  bookmark: '로그인하면 이 앱을 북마크할 수 있어요',
};

export default function LoginModal({ isOpen, onClose, reason }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('login');
  const [loginMode, setLoginMode] = useState<LoginMode>('normal');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [handle, setHandle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [googleInfo, setGoogleInfo] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [handleConflict, setHandleConflict] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [handleStatus, setHandleStatus] = useState<HandleStatus>({ state: 'idle' });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleDescId = useId();

  // 디바운스 handle 실시간 체크 (회원가입 탭에서만)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // 회원가입 탭이 아니거나 입력값 없으면 idle (비동기로 처리해 cascading render 방지)
    if (tab !== 'signup' || !handle) {
      debounceRef.current = setTimeout(() => {
        setHandleStatus({ state: 'idle' });
      }, 0);
      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }

    debounceRef.current = setTimeout(async () => {
      setHandleStatus({ state: 'checking' });
      const result = await checkHandleAvailable(handle);
      if (result.available) {
        setHandleStatus({ state: 'available' });
      } else {
        setHandleStatus({ state: 'unavailable', reason: result.reason ?? '사용할 수 없는 아이디예요.' });
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [handle, tab]);

  function resetForm() {
    setEmail('');
    setPassword('');
    setPasswordConfirm('');
    setHandle('');
    setError(null);
    setGoogleInfo(null);
    setConfirmSent(false);
    setConfirmEmail('');
    setForgotSent(false);
    setForgotEmail('');
    setHandleConflict(false);
    setHandleStatus({ state: 'idle' });
    setLoginMode('normal');
  }

  function handleTabChange(newTab: Tab) {
    setTab(newTab);
    setError(null);
    setLoginMode('normal');
    setHandleConflict(false);
    setHandleStatus({ state: 'idle' });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (loginMode === 'forgot') {
      // 비밀번호 찾기 전송
      const fd = new FormData();
      fd.set('email', email);
      startTransition(async () => {
        const result = await requestPasswordReset(fd);
        if (result.error) {
          setError(result.error);
          return;
        }
        setForgotSent(true);
        setForgotEmail(email);
      });
      return;
    }

    const fd = new FormData();
    fd.set('email', email);
    fd.set('password', password);
    if (tab === 'signup') {
      fd.set('passwordConfirm', passwordConfirm);
      fd.set('handle', handle);
    }

    startTransition(async () => {
      const result =
        tab === 'login'
          ? await signInWithPassword(fd)
          : await signUpWithPassword(fd);

      if (result.error) {
        setError(result.error);
        return;
      }

      if ('confirmSent' in result && result.confirmSent) {
        setConfirmSent(true);
        setConfirmEmail(email);
        return;
      }

      // handle 중복 — 가입은 성공했으나 handle 재설정 필요
      if ('handleConflict' in result && result.handleConflict) {
        setHandleConflict(true);
        setHandle('');
        setError(t('signup.handleConflict'));
        return;
      }

      // 로그인/가입 성공 — 서버 컴포넌트 갱신으로 세션 반영
      onClose();
      router.refresh();
    });
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    setError(null);
    setGoogleInfo(null);
    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (oauthError) {
        // 구글 OAuth 미설정 — 사용자에게 친절한 안내 메시지 표시
        setGoogleInfo(t('googleAuthPending'));
        setGoogleLoading(false);
      }
      // 성공 시 브라우저가 Google 동의화면으로 이동하므로 로딩 상태 유지
    } catch {
      setGoogleInfo(t('googleAuthPending'));
      setGoogleLoading(false);
    }
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--muted)',
    display: 'block',
    marginBottom: 5,
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { resetForm(); onClose(); }} labelId="login-modal-title" maxWidth={400}>
      <div style={{ padding: '32px 28px', position: 'relative' }}>
        {/* 닫기 버튼 */}
        <button
          onClick={() => { resetForm(); onClose(); }}
          style={{
            position: 'absolute',
            top: 14,
            right: 16,
            background: 'none',
            border: 'none',
            color: 'var(--muted)',
            fontSize: 20,
            cursor: 'pointer',
            lineHeight: 1,
          }}
          aria-label="닫기"
        >
          ×
        </button>

        {/* 로고 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: 'linear-gradient(135deg,var(--brand),var(--brand2))',
              boxShadow: '0 0 14px var(--brand)',
              display: 'inline-block',
            }}
          />
          <span id="login-modal-title" style={{ fontWeight: 800, fontSize: 16 }}>런칭스</span>
        </div>

        {/* 컨텍스트 문구 — reason이 있을 때만 표시 (confirmSent/forgotSent 화면에선 숨김) */}
        {reason && !confirmSent && !forgotSent && (
          <div
            style={{
              background: 'rgba(108,140,255,.08)',
              border: '1px solid rgba(108,140,255,.25)',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 13,
              color: 'var(--brand)',
              fontWeight: 600,
              marginBottom: 16,
              lineHeight: 1.5,
            }}
          >
            {REASON_MESSAGES[reason]}
          </div>
        )}

        {/* 이메일 확인 화면 (이메일 확인 ON 가입 후) */}
        {confirmSent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📧</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
              이메일을 확인하세요
            </h2>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--ink)' }}>{confirmEmail}</strong>로<br />
              가입 확인 링크를 보냈습니다.<br />
              링크를 클릭하면 가입이 완료됩니다.
            </p>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, marginTop: 12 }}>
              {t('signup.confirmEmailHandleHint')}
            </p>
            <button
              onClick={() => { resetForm(); onClose(); }}
              style={{
                marginTop: 20,
                background: 'var(--chip)',
                border: '1px solid var(--line)',
                borderRadius: 10,
                padding: '10px 20px',
                fontSize: 14,
                color: 'var(--muted)',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              닫기
            </button>
          </div>
        ) : forgotSent ? (
          /* 비밀번호 찾기 메일 전송 완료 */
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📧</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
              {t('forgotPassword.sent')}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--ink)' }}>{forgotEmail}</strong>로<br />
              {t('forgotPassword.sentDesc')}
            </p>
            <button
              onClick={() => { setForgotSent(false); setLoginMode('normal'); setError(null); }}
              style={{
                marginTop: 20,
                background: 'var(--chip)',
                border: '1px solid var(--line)',
                borderRadius: 10,
                padding: '10px 20px',
                fontSize: 14,
                color: 'var(--muted)',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {t('forgotPassword.backToLogin')}
            </button>
          </div>
        ) : (
          <>
            {/* 탭 */}
            <div
              style={{
                display: 'flex',
                gap: 0,
                marginBottom: 22,
                background: 'var(--chip)',
                borderRadius: 10,
                padding: 3,
              }}
            >
              {(['login', 'signup'] as Tab[]).map((tabKey) => (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => handleTabChange(tabKey)}
                  style={{
                    flex: 1,
                    background: tab === tabKey
                      ? 'linear-gradient(135deg,rgba(108,140,255,.22),rgba(155,108,255,.22))'
                      : 'transparent',
                    border: tab === tabKey ? '1px solid var(--brand)' : '1px solid transparent',
                    borderRadius: 8,
                    padding: '8px 0',
                    fontSize: 13,
                    fontWeight: 700,
                    color: tab === tabKey ? '#fff' : 'var(--muted)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: '.12s',
                  }}
                >
                  {tabKey === 'login' ? '로그인' : '회원가입'}
                </button>
              ))}
            </div>

            {/* 구글 로그인 버튼 (비밀번호 찾기 모드가 아닐 때만) */}
            {loginMode === 'normal' && (
              <>
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={googleLoading || isPending}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,.06)',
                    border: '1px solid var(--line)',
                    borderRadius: 10,
                    padding: '11px 14px',
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--ink)',
                    cursor: googleLoading ? 'wait' : 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    marginBottom: 16,
                    transition: 'border-color .12s',
                  }}
                >
                  {/* Google 로고 SVG */}
                  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    <path fill="none" d="M0 0h48v48H0z"/>
                  </svg>
                  {googleLoading ? '연결 중...' : 'Google로 계속하기'}
                </button>

                {/* 구글 로그인 안내 메시지 (OAuth 미설정 시) */}
                {googleInfo && (
                  <p
                    style={{
                      color: 'var(--warm)',
                      fontSize: 13,
                      marginTop: -8,
                      marginBottom: 8,
                      padding: '8px 12px',
                      background: 'rgba(255,180,84,.08)',
                      border: '1px solid rgba(255,180,84,.25)',
                      borderRadius: 8,
                      lineHeight: 1.5,
                    }}
                  >
                    {googleInfo}
                  </p>
                )}

                {/* 구분선 */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>또는 이메일로</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
                </div>
              </>
            )}

            {/* 비밀번호 찾기 모드 헤더 */}
            {loginMode === 'forgot' && (
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>
                  {t('forgotPassword.title')}
                </h2>
                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
                  {t('forgotPassword.desc')}
                </p>
              </div>
            )}

            {/* 이메일/비밀번호 폼 */}
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  type="email"
                  name="email"
                  placeholder={loginMode === 'forgot' ? t('forgotPassword.emailPlaceholder') : '이메일 주소'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="lp-input"
                />

                {/* 비밀번호 필드 — 비밀번호 찾기 모드에서는 숨김 */}
                {loginMode === 'normal' && (
                  <>
                    <input
                      type="password"
                      name="password"
                      placeholder="비밀번호 (8자 이상)"
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                      className="lp-input"
                    />
                    {tab === 'signup' && (
                      <input
                        type="password"
                        name="passwordConfirm"
                        placeholder="비밀번호 확인"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        required
                        autoComplete="new-password"
                        className="lp-input"
                      />
                    )}

                    {/* 사이트 아이디(handle) 입력 — 회원가입 탭에서만 */}
                    {tab === 'signup' && (
                      <div>
                        <label htmlFor="signup-handle" style={labelStyle}>
                          {t('signup.handleLabel')}
                        </label>
                        <input
                          id="signup-handle"
                          type="text"
                          name="handle"
                          placeholder={t('signup.handlePlaceholder')}
                          value={handle}
                          onChange={(e) => {
                            setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''));
                            setHandleConflict(false);
                            if (error === t('signup.handleConflict')) setError(null);
                          }}
                          minLength={3}
                          maxLength={20}
                          pattern="[a-z0-9_-]{3,20}"
                          autoComplete="username"
                          aria-invalid={handleStatus.state === 'unavailable' || handleConflict}
                          aria-describedby={handleDescId}
                          className="lp-input"
                          style={{
                            borderColor:
                              handleConflict || handleStatus.state === 'unavailable'
                                ? '#ff6b6b'
                                : handleStatus.state === 'available'
                                  ? 'var(--accent)'
                                  : 'var(--line)',
                          }}
                        />
                        {/* handle 실시간 피드백 */}
                        <div id={handleDescId} style={{ marginTop: 5 }}>
                          {handleStatus.state === 'checking' && (
                            <p style={{ fontSize: 12, color: 'var(--muted-strong)', marginBottom: 0 }}>
                              확인 중...
                            </p>
                          )}
                          {handleStatus.state === 'available' && (
                            <p style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 0 }}>
                              사용 가능한 아이디예요 ✓
                            </p>
                          )}
                          {handleStatus.state === 'unavailable' && (
                            <p style={{ fontSize: 12, color: '#ff6b6b', marginBottom: 0 }} role="alert">
                              {handleStatus.reason}
                            </p>
                          )}
                          {(handleStatus.state === 'idle' || handleStatus.state === 'checking') && (
                            <p style={{ fontSize: 12, color: 'var(--muted-strong)', marginBottom: 0, marginTop: handleStatus.state === 'checking' ? 2 : 0 }}>
                              {t('signup.handleHint')}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {error && (
                <p style={{ color: '#ff6b6b', fontSize: 13, marginTop: 10, marginBottom: 0 }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={
                  isPending ||
                  !email ||
                  (loginMode === 'normal' && !password)
                }
                style={{
                  width: '100%',
                  background:
                    isPending || !email || (loginMode === 'normal' && !password)
                      ? 'var(--chip)'
                      : 'linear-gradient(135deg,var(--brand),var(--brand2))',
                  border: 'none',
                  borderRadius: 10,
                  padding: '12px 0',
                  fontSize: 14,
                  fontWeight: 700,
                  color: isPending || !email || (loginMode === 'normal' && !password) ? 'var(--muted)' : '#fff',
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  transition: 'opacity .12s',
                  marginTop: 14,
                }}
              >
                {isPending
                  ? loginMode === 'forgot'
                    ? t('forgotPassword.sending')
                    : tab === 'login' ? '로그인 중...' : '가입 중...'
                  : loginMode === 'forgot'
                    ? t('forgotPassword.send')
                    : tab === 'login' ? '로그인' : '회원가입'}
              </button>

              {/* 비밀번호 찾기 링크 / 돌아가기 링크 */}
              {tab === 'login' && (
                <div style={{ textAlign: 'center', marginTop: 12 }}>
                  {loginMode === 'normal' ? (
                    <button
                      type="button"
                      onClick={() => { setLoginMode('forgot'); setError(null); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--muted)',
                        fontSize: 13,
                        cursor: 'pointer',
                        padding: 0,
                        fontFamily: 'inherit',
                        textDecoration: 'underline',
                      }}
                    >
                      {t('forgotPassword.link')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setLoginMode('normal'); setError(null); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--muted)',
                        fontSize: 13,
                        cursor: 'pointer',
                        padding: 0,
                        fontFamily: 'inherit',
                        textDecoration: 'underline',
                      }}
                    >
                      {t('forgotPassword.backToLogin')}
                    </button>
                  )}
                </div>
              )}
            </form>
          </>
        )}
      </div>
    </Modal>
  );
}
