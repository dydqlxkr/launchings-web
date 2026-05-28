'use client';

/**
 * 프로필 설정 폼 — 클라이언트 컴포넌트.
 * display_name, handle, bio, website_url, avatar_url 편집.
 * handle 입력 시 400ms 디바운스 실시간 중복 확인.
 */

import { useState, useTransition, useEffect, useRef, useId } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { updateProfile, checkHandleAvailable } from '@/lib/actions/profile';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';

const AVATAR_MAX_MB = 2;
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

interface Props {
  initialDisplayName: string;
  initialHandle: string;
  initialBio: string | null;
  initialWebsiteUrl: string | null;
  initialAvatarUrl: string | null;
  userId: string;
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

/** handle 실시간 체크 상태 */
type HandleStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'available' }
  | { state: 'unavailable'; reason: string };

const DEBOUNCE_MS = 400;

export default function SettingsForm({
  initialDisplayName,
  initialHandle,
  initialBio,
  initialWebsiteUrl,
  initialAvatarUrl,
  userId,
}: Props) {
  const t = useTranslations('settings');
  const toast = useToast();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [handle, setHandle] = useState(initialHandle);
  const [bio, setBio] = useState(initialBio ?? '');
  const [websiteUrl, setWebsiteUrl] = useState(initialWebsiteUrl ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [handleStatus, setHandleStatus] = useState<HandleStatus>({ state: 'idle' });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleDescId = useId();

  // 아바타 상태
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialAvatarUrl);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // 디바운스 handle 실시간 체크
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // 초기값과 동일하거나 비어있으면 idle 상태로 전환 (비동기로 처리해 cascading render 방지)
    if (handle === initialHandle || !handle) {
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
  }, [handle, initialHandle]);

  async function handleAvatarChange(file: File) {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setError(t('avatar.invalidType'));
      return;
    }
    if (file.size > AVATAR_MAX_MB * 1024 * 1024) {
      setError(t('avatar.tooLarge', { mb: AVATAR_MAX_MB }));
      return;
    }

    setUploadingAvatar(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${userId}/avatar/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('app-images')
        .upload(path, file, { upsert: true });

      if (uploadError) {
        setError(t('avatar.uploadFailed') + ': ' + uploadError.message);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('app-images')
        .getPublicUrl(path);

      const publicUrl = urlData.publicUrl;
      setAvatarUrl(publicUrl);
      setAvatarPreview(URL.createObjectURL(file));
      setAvatarChanged(true);
    } finally {
      setUploadingAvatar(false);
    }
  }

  function handleRemoveAvatar() {
    setAvatarUrl(null);
    setAvatarPreview(null);
    setAvatarChanged(true);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    // handle 체크 중이거나 사용 불가면 제출 차단
    if (handleStatus.state === 'checking') {
      setError('사용자 ID 확인 중입니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    if (handleStatus.state === 'unavailable') {
      setError(handleStatus.reason);
      return;
    }

    startTransition(async () => {
      const result = await updateProfile({
        display_name: displayName,
        handle,
        bio: bio || undefined,
        website_url: websiteUrl || undefined,
        ...(avatarChanged ? { avatar_url: avatarUrl } : {}),
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setSaved(true);
      setHandleStatus({ state: 'idle' });
      setAvatarChanged(false);
      toast.show(t('saved'), 'success');
      // 서버 컴포넌트(네비바 아바타·메이커 카드)가 변경된 프로필을 다시 읽도록 갱신
      router.refresh();
    });
  }

  const isHandleInvalid = handleStatus.state === 'unavailable';

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* 아바타 */}
        <div>
          <label style={labelStyle}>{t('avatar.label')}</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* 미리보기 */}
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                overflow: 'hidden',
                flexShrink: 0,
                background: avatarPreview
                  ? 'transparent'
                  : 'linear-gradient(135deg, var(--brand), var(--brand2))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--line)',
              }}
            >
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt={t('avatar.previewAlt')}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <span style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>
                  {displayName ? displayName[0].toUpperCase() : '?'}
                </span>
              )}
            </div>

            {/* 버튼 영역 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label
                style={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  background: 'var(--chip)',
                  border: '1px solid var(--line)',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: uploadingAvatar ? 'var(--muted)' : 'var(--ink)',
                  cursor: uploadingAvatar ? 'not-allowed' : 'pointer',
                  userSelect: 'none',
                }}
              >
                {uploadingAvatar ? t('avatar.uploading') : t('avatar.changeButton')}
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  disabled={uploadingAvatar}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarChange(file);
                    e.target.value = '';
                  }}
                  style={{ display: 'none' }}
                />
              </label>

              {avatarPreview && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={uploadingAvatar}
                  style={{
                    padding: '8px 16px',
                    background: 'transparent',
                    border: '1px solid var(--line)',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--muted)',
                    cursor: uploadingAvatar ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {t('avatar.removeButton')}
                </button>
              )}
            </div>
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, marginBottom: 0 }}>
            {t('avatar.hint', { mb: AVATAR_MAX_MB })}
          </p>
        </div>

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
          <label htmlFor="settings-handle" style={labelStyle}>{t('handle')}</label>
          <div style={{ position: 'relative' }}>
            <input
              id="settings-handle"
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
              aria-invalid={isHandleInvalid}
              aria-describedby={handleDescId}
              style={{
                ...inputStyle,
                borderColor: isHandleInvalid
                  ? 'var(--red)'
                  : handleStatus.state === 'available'
                    ? 'var(--accent)'
                    : 'var(--line)',
              }}
            />
          </div>
          {/* 상태별 handle 피드백 */}
          <div id={handleDescId}>
            {handleStatus.state === 'checking' && (
              <p style={{ fontSize: 12, color: 'var(--muted-strong)', marginTop: 6, marginBottom: 0 }}>
                확인 중...
              </p>
            )}
            {handleStatus.state === 'available' && (
              <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 6, marginBottom: 0 }}>
                {t('handleAvailable')} ✓
              </p>
            )}
            {handleStatus.state === 'unavailable' && (
              <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 6, marginBottom: 0 }} role="alert">
                {handleStatus.reason}
              </p>
            )}
            {(handleStatus.state === 'idle' || handleStatus.state === 'checking') && (
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--muted-strong)',
                  marginTop: handleStatus.state === 'checking' ? 2 : 6,
                  marginBottom: 0,
                }}
              >
                {t('handleHint')}
                <strong style={{ color: 'var(--brand)' }}>{handle || '...'}</strong>
              </p>
            )}
          </div>
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
        disabled={
          isPending ||
          uploadingAvatar ||
          !displayName ||
          !handle ||
          handleStatus.state === 'checking' ||
          handleStatus.state === 'unavailable'
        }
        style={{
          marginTop: 24,
          width: '100%',
          background:
            isPending ||
            uploadingAvatar ||
            !displayName ||
            !handle ||
            handleStatus.state === 'checking' ||
            handleStatus.state === 'unavailable'
              ? 'var(--chip)'
              : 'linear-gradient(135deg,var(--brand),var(--brand2))',
          border: 'none',
          borderRadius: 10,
          padding: '13px 0',
          fontSize: 14,
          fontWeight: 700,
          color:
            isPending ||
            uploadingAvatar ||
            !displayName ||
            !handle ||
            handleStatus.state === 'checking' ||
            handleStatus.state === 'unavailable'
              ? 'var(--muted)'
              : '#fff',
          cursor:
            isPending || uploadingAvatar || handleStatus.state === 'checking' ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          transition: 'opacity .12s',
        }}
      >
        {isPending ? t('saving') : t('save')}
      </button>
    </form>
  );
}
