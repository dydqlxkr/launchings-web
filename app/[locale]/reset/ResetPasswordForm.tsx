'use client';

/**
 * 비밀번호 재설정 폼 — 클라이언트 컴포넌트.
 * recovery 세션이 있으면 새 비밀번호 입력 폼을 표시.
 * 세션이 없으면 링크 만료 안내.
 */

import { useState, useTransition, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { updatePassword } from '@/lib/actions/auth';
import { createClient } from '@/lib/supabase/client';

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,.05)',
  border: '1px solid var(--line)',
  borderRadius: 10,
  padding: '12px 14px',
  fontSize: 14,
  color: 'var(--ink)',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  outline: 'none',
};

export default function ResetPasswordForm() {
  const t = useTranslations('resetPassword');
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [hasSession, setHasSession] = useState<boolean | null>(null); // null = loading

  // 세션 확인 (recovery 세션이 있어야 비밀번호 변경 가능)
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
    });
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const fd = new FormData();
    fd.set('password', password);
    fd.set('passwordConfirm', passwordConfirm);

    startTransition(async () => {
      const result = await updatePassword(fd);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
    });
  }

  // 로딩 중
  if (hasSession === null) {
    return (
      <p style={{ color: 'var(--muted)', fontSize: 14, textAlign: 'center' }}>
        확인 중...
      </p>
    );
  }

  // 세션 없음 — 링크 만료 또는 잘못된 링크
  if (!hasSession) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔗</div>
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
          {t('invalidLink')}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20 }}>
          {t('invalidLinkDesc')}
        </p>
        <button
          onClick={() => router.push('/ko')}
          style={{
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
          {t('goHome')}
        </button>
      </div>
    );
  }

  // 성공
  if (success) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
          {t('success')}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20 }}>
          {t('successDesc')}
        </p>
        <button
          onClick={() => router.push('/ko')}
          style={{
            background: 'linear-gradient(135deg,var(--brand),var(--brand2))',
            border: 'none',
            borderRadius: 10,
            padding: '12px 24px',
            fontSize: 14,
            fontWeight: 700,
            color: '#fff',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {t('goHome')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="password"
          name="password"
          placeholder={t('newPassword')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          style={inputStyle}
        />
        <input
          type="password"
          name="passwordConfirm"
          placeholder={t('confirmPassword')}
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          style={inputStyle}
        />
      </div>

      {error && (
        <p style={{ color: '#ff6b6b', fontSize: 13, marginTop: 10, marginBottom: 0 }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || !password || !passwordConfirm}
        style={{
          width: '100%',
          background:
            isPending || !password || !passwordConfirm
              ? 'var(--chip)'
              : 'linear-gradient(135deg,var(--brand),var(--brand2))',
          border: 'none',
          borderRadius: 10,
          padding: '12px 0',
          fontSize: 14,
          fontWeight: 700,
          color: isPending || !password || !passwordConfirm ? 'var(--muted)' : '#fff',
          cursor: isPending ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          transition: 'opacity .12s',
          marginTop: 14,
        }}
      >
        {isPending ? t('submitting') : t('submit')}
      </button>
    </form>
  );
}
