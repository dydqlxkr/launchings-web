'use client';

/**
 * 프로필 설정 폼 — 클라이언트 컴포넌트.
 * display_name, handle, bio, website_url 편집.
 */

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { updateProfile } from '@/lib/actions/profile';

interface Props {
  initialDisplayName: string;
  initialHandle: string;
  initialBio: string | null;
  initialWebsiteUrl: string | null;
}

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

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--muted)',
  display: 'block',
  marginBottom: 6,
};

export default function SettingsForm({
  initialDisplayName,
  initialHandle,
  initialBio,
  initialWebsiteUrl,
}: Props) {
  const t = useTranslations('settings');
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [handle, setHandle] = useState(initialHandle);
  const [bio, setBio] = useState(initialBio ?? '');
  const [websiteUrl, setWebsiteUrl] = useState(initialWebsiteUrl ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await updateProfile({
        display_name: displayName,
        handle,
        bio: bio || undefined,
        website_url: websiteUrl || undefined,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setSaved(true);
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* 이름 */}
        <div>
          <label style={labelStyle}>{t('displayName')}</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => { setDisplayName(e.target.value); setSaved(false); }}
            placeholder={t('displayNamePlaceholder')}
            required
            maxLength={60}
            style={inputStyle}
          />
        </div>

        {/* handle */}
        <div>
          <label style={labelStyle}>{t('handle')}</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={handle}
              onChange={(e) => {
                setHandle(e.target.value.toLowerCase());
                setSaved(false);
              }}
              placeholder={t('handlePlaceholder')}
              required
              minLength={3}
              maxLength={20}
              pattern="[a-z0-9_-]{3,20}"
              style={inputStyle}
            />
          </div>
          <p
            style={{
              fontSize: 12,
              color: 'var(--muted)',
              marginTop: 6,
              marginBottom: 0,
            }}
          >
            {t('handleHint')}
            <strong style={{ color: 'var(--brand)' }}>{handle || '...'}</strong>
          </p>
        </div>

        {/* 소개 */}
        <div>
          <label style={labelStyle}>{t('bio')}</label>
          <textarea
            value={bio}
            onChange={(e) => { setBio(e.target.value); setSaved(false); }}
            placeholder={t('bioPlaceholder')}
            maxLength={500}
            rows={3}
            style={{
              ...inputStyle,
              resize: 'vertical',
              minHeight: 80,
            }}
          />
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, marginBottom: 0 }}>
            {bio.length} / 500
          </p>
        </div>

        {/* 웹사이트 */}
        <div>
          <label style={labelStyle}>{t('websiteUrl')}</label>
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => { setWebsiteUrl(e.target.value); setSaved(false); }}
            placeholder={t('websiteUrlPlaceholder')}
            maxLength={200}
            style={inputStyle}
          />
        </div>
      </div>

      {/* 에러 */}
      {error && (
        <p
          style={{
            color: '#ff6b6b',
            fontSize: 13,
            marginTop: 16,
            marginBottom: 0,
            padding: '10px 14px',
            background: 'rgba(255,107,107,.08)',
            border: '1px solid rgba(255,107,107,.25)',
            borderRadius: 8,
          }}
        >
          {error}
        </p>
      )}

      {/* 저장 성공 */}
      {saved && !error && (
        <p
          style={{
            color: 'var(--accent)',
            fontSize: 13,
            marginTop: 16,
            marginBottom: 0,
            padding: '10px 14px',
            background: 'rgba(46,230,166,.08)',
            border: '1px solid rgba(46,230,166,.25)',
            borderRadius: 8,
          }}
        >
          {t('saved')}
        </p>
      )}

      {/* 저장 버튼 */}
      <button
        type="submit"
        disabled={isPending || !displayName || !handle}
        style={{
          marginTop: 24,
          width: '100%',
          background:
            isPending || !displayName || !handle
              ? 'var(--chip)'
              : 'linear-gradient(135deg,var(--brand),var(--brand2))',
          border: 'none',
          borderRadius: 10,
          padding: '13px 0',
          fontSize: 14,
          fontWeight: 700,
          color: isPending || !displayName || !handle ? 'var(--muted)' : '#fff',
          cursor: isPending ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          transition: 'opacity .12s',
        }}
      >
        {isPending ? t('saving') : t('save')}
      </button>
    </form>
  );
}
