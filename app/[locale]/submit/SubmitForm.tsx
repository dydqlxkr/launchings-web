'use client';

/**
 * 앱 등록 폼 — 클라이언트 컴포넌트.
 * 이미지 업로드: 클라이언트에서 Supabase Storage에 직접 업로드 후 경로를 폼에 첨부.
 * 나머지 데이터: Server Action(submitApp)으로 전송.
 *
 * 용량 제한:
 * - 썸네일 1장 ≤ 2MB
 * - 스크린샷 ≤ 6장, 각 ≤ 3MB
 */

import { useState, useTransition, useRef, useMemo } from 'react';
import Link from 'next/link';
import { submitApp } from '@/lib/actions/submit';
import { updateApp } from '@/lib/actions/app';
import { createClient } from '@/lib/supabase/client';
import type { Category } from '@/lib/types';
import { detectStacks } from '@/lib/stackKeywords';

const THUMBNAIL_MAX_MB = 2;
const SCREENSHOT_MAX_MB = 3;
const SCREENSHOT_MAX_COUNT = 6;

// L-7: 허용 이미지 MIME 타입 (클라이언트 사전 검증)
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]);

function isAllowedImageType(file: File): boolean {
  return ALLOWED_IMAGE_TYPES.has(file.type);
}

export interface SubmitFormInitialData {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  app_type: 'webapp' | 'native' | 'link';
  live_url: string;
  store_url_ios: string;
  store_url_android: string;
  demo_video_url: string;
  thumbnail_path: string | null;
  /** Storage 경로 배열 — edit 모드에서 기존 스크린샷 보존에 사용 */
  screenshot_paths: string[];
  /** 스크린샷 공개 URL 배열 — 미리보기용 */
  screenshot_preview_urls: string[];
  categories: string[];
  stacks: string[];
}

interface Props {
  categories: Category[];
  userId: string;
  mode?: 'create' | 'edit';
  initialData?: SubmitFormInitialData;
}

export default function SubmitForm({
  categories,
  userId,
  mode = 'create',
  initialData,
}: Props) {
  const isEdit = mode === 'edit';

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // 필드 ref — scrollIntoView용
  const liveUrlRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  // 카테고리 다중 선택
  const [selectedCats, setSelectedCats] = useState<string[]>(
    initialData?.categories ?? []
  );

  // 제목·설명 — 스택 자동 추천을 위해 제어
  const [titleValue, setTitleValue] = useState(initialData?.title ?? '');
  const [descValue, setDescValue] = useState(initialData?.description ?? '');

  // 기술 스택 태그 입력
  const [stacks, setStacks] = useState<string[]>(initialData?.stacks ?? []);
  const [stackInput, setStackInput] = useState('');
  const stackInputRef = useRef<HTMLInputElement>(null);

  // 이미지 업로드 상태
  const [thumbnailPath, setThumbnailPath] = useState<string | null>(
    initialData?.thumbnail_path ?? null
  );
  // edit 모드일 때 기존 썸네일 URL 미리보기
  const existingThumbnailUrl =
    isEdit && initialData?.thumbnail_path
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/app-images/${initialData.thumbnail_path}`
      : null;
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    existingThumbnailUrl
  );
  // edit 모드: 기존 스크린샷 경로/미리보기 URL로 프리필 (보존)
  const [screenshotPaths, setScreenshotPaths] = useState<string[]>(
    initialData?.screenshot_paths ?? []
  );
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>(
    initialData?.screenshot_preview_urls ?? []
  );
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);

  // 앱 타입
  const [appType, setAppType] = useState<'webapp' | 'native' | 'link'>(
    initialData?.app_type ?? 'webapp'
  );

  // 동의 체크박스 (edit 모드에서는 이미 동의한 것으로 간주 — 기존 제품)
  const [agreed, setAgreed] = useState(isEdit);

  // 제목+설명 텍스트에서 감지된 추천 스택 (이미 추가된 것 제외)
  const suggestedStacks = useMemo(
    () => detectStacks(`${titleValue} ${descValue}`, stacks),
    [titleValue, descValue, stacks]
  );

  function addSuggestedStack(tag: string) {
    if (!stacks.includes(tag) && stacks.length < 10) {
      setStacks((prev) => [...prev, tag]);
    }
  }

  function toggleCat(slug: string) {
    setSelectedCats((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]
    );
  }

  function addStack(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && stackInput.trim()) {
      e.preventDefault();
      const tag = stackInput.trim().replace(/,$/, '');
      if (tag && !stacks.includes(tag) && stacks.length < 10) {
        setStacks((prev) => [...prev, tag]);
      }
      setStackInput('');
    }
  }

  function removeStack(tag: string) {
    setStacks((prev) => prev.filter((s) => s !== tag));
  }

  async function uploadThumbnail(file: File) {
    // L-7: MIME 타입 클라이언트 사전 검증
    if (!isAllowedImageType(file)) {
      setError('지원하지 않는 파일 형식입니다. JPEG, PNG, GIF, WebP, SVG 이미지만 업로드할 수 있습니다.');
      return;
    }
    if (file.size > THUMBNAIL_MAX_MB * 1024 * 1024) {
      setError(`썸네일은 ${THUMBNAIL_MAX_MB}MB 이하만 업로드할 수 있습니다.`);
      return;
    }
    setUploadingThumb(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${userId}/thumbnails/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('app-images')
        .upload(path, file, { upsert: true });

      if (uploadError) {
        setError('썸네일 업로드에 실패했습니다: ' + uploadError.message);
        return;
      }

      setThumbnailPath(path);
      setThumbnailPreview(URL.createObjectURL(file));
    } finally {
      setUploadingThumb(false);
    }
  }

  async function uploadScreenshot(file: File) {
    if (screenshotPaths.length >= SCREENSHOT_MAX_COUNT) {
      setError(`스크린샷은 최대 ${SCREENSHOT_MAX_COUNT}장까지 업로드할 수 있습니다.`);
      return;
    }
    // L-7: MIME 타입 클라이언트 사전 검증
    if (!isAllowedImageType(file)) {
      setError('지원하지 않는 파일 형식입니다. JPEG, PNG, GIF, WebP, SVG 이미지만 업로드할 수 있습니다.');
      return;
    }
    if (file.size > SCREENSHOT_MAX_MB * 1024 * 1024) {
      setError(`스크린샷은 ${SCREENSHOT_MAX_MB}MB 이하만 업로드할 수 있습니다.`);
      return;
    }
    setUploadingScreenshot(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() ?? 'png';
      const path = `${userId}/screenshots/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('app-images')
        .upload(path, file, { upsert: true });

      if (uploadError) {
        setError('스크린샷 업로드에 실패했습니다: ' + uploadError.message);
        return;
      }

      setScreenshotPaths((prev) => [...prev, path]);
      setScreenshotPreviews((prev) => [...prev, URL.createObjectURL(file)]);
    } finally {
      setUploadingScreenshot(false);
    }
  }

  function removeScreenshot(idx: number) {
    setScreenshotPaths((prev) => prev.filter((_, i) => i !== idx));
    setScreenshotPreviews((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!agreed) {
      setError('이용약관에 동의해야 제품을 등록할 수 있습니다.');
      return;
    }

    // 클라이언트 사전 검증
    const formEl = e.currentTarget;
    const titleVal = (formEl.elements.namedItem('title') as HTMLInputElement)?.value?.trim() ?? '';
    const descVal = (formEl.elements.namedItem('description') as HTMLTextAreaElement)?.value?.trim() ?? '';
    const liveUrlVal = (formEl.elements.namedItem('live_url') as HTMLInputElement)?.value?.trim() ?? '';

    const newFieldErrors: Record<string, string> = {};

    if (!titleVal || titleVal.length < 2) {
      newFieldErrors.title = '제목을 2자 이상 입력해 주세요.';
    } else if (titleVal.length > 60) {
      newFieldErrors.title = '제목은 60자 이하로 입력해 주세요.';
    }

    if (!descVal || descVal.length < 10) {
      newFieldErrors.description = '설명을 10자 이상 입력해 주세요.';
    } else if (descVal.length > 4000) {
      newFieldErrors.description = '설명은 4000자 이하로 입력해 주세요.';
    }

    if ((appType === 'webapp' || appType === 'link') && !liveUrlVal) {
      newFieldErrors.live_url = 'Live URL을 입력해 주세요.';
    }

    if (selectedCats.length === 0) {
      newFieldErrors.categories = '카테고리를 1개 이상 선택해 주세요.';
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      // 첫 에러 필드로 스크롤
      if (newFieldErrors.live_url && liveUrlRef.current) {
        liveUrlRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        liveUrlRef.current.focus();
      } else if (newFieldErrors.categories && categoryRef.current) {
        categoryRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (newFieldErrors.title) {
        const titleEl = formEl.elements.namedItem('title') as HTMLInputElement | null;
        titleEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        titleEl?.focus();
      } else if (newFieldErrors.description) {
        const descEl = formEl.elements.namedItem('description') as HTMLTextAreaElement | null;
        descEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        descEl?.focus();
      }
      return;
    }

    const fd = new FormData(e.currentTarget);
    fd.set('categories', JSON.stringify(selectedCats));
    fd.set('stacks', JSON.stringify(stacks));
    fd.set('thumbnail_path', thumbnailPath ?? '');
    fd.set('screenshot_paths', JSON.stringify(screenshotPaths));
    fd.set('app_type', appType);

    startTransition(async () => {
      if (isEdit && initialData) {
        const result = await updateApp(initialData.id, fd);
        if (result?.error) {
          setError(result.error);
          setTimeout(() => {
            errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 0);
        }
        // 성공 시 updateApp이 redirect를 호출
      } else {
        const result = await submitApp(fd);
        if (result?.error) {
          setError(result.error);
          setTimeout(() => {
            errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 0);
        }
        // 성공 시 submitApp이 redirect를 호출
      }
    });
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--muted)',
    marginBottom: 6,
    marginTop: 20,
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 앱 타입 */}
      <label style={labelStyle}>앱 유형 *</label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(
          [
            { k: 'webapp', label: '웹앱 (브라우저에서 실행)' },
            { k: 'native', label: '네이티브 (iOS/Android)' },
            { k: 'link', label: '외부 링크' },
          ] as { k: 'webapp' | 'native' | 'link'; label: string }[]
        ).map(({ k, label }) => (
          <button
            key={k}
            type="button"
            onClick={() => setAppType(k)}
            style={{
              background:
                appType === k
                  ? 'linear-gradient(135deg,rgba(108,140,255,.28),rgba(155,108,255,.28))'
                  : 'var(--chip)',
              border: `1px solid ${appType === k ? 'var(--brand)' : 'var(--line)'}`,
              color: appType === k ? '#fff' : 'var(--muted)',
              fontSize: 13,
              fontWeight: 600,
              padding: '8px 16px',
              borderRadius: 9,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: '.12s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 제목 */}
      <label style={labelStyle} htmlFor="title">
        제목 * (최대 60자)
      </label>
      <input
        id="title"
        name="title"
        type="text"
        required
        maxLength={60}
        placeholder="MemoFlow"
        value={titleValue}
        onChange={(e) => setTitleValue(e.target.value)}
        className="lp-input"
        style={fieldErrors.title ? { border: '1px solid #ff6b6b' } : undefined}
      />
      {fieldErrors.title && (
        <p style={{ fontSize: 12, color: '#ff6b6b', marginTop: 4 }}>
          {fieldErrors.title}
        </p>
      )}

      {/* 한줄 소개 */}
      <label style={labelStyle} htmlFor="tagline">
        한줄 소개 (최대 80자)
      </label>
      <input
        id="tagline"
        name="tagline"
        type="text"
        maxLength={80}
        placeholder="AI가 회의 메모를 읽고 할 일을 자동 정리해주는 앱"
        defaultValue={initialData?.tagline ?? ''}
        className="lp-input"
      />

      {/* 설명 */}
      <label style={labelStyle} htmlFor="description">
        설명 * (최대 4000자)
      </label>
      <textarea
        id="description"
        name="description"
        required
        maxLength={4000}
        placeholder="제품을 소개해 주세요. 어떤 문제를 해결하나요? 주요 기능은 무엇인가요?"
        rows={5}
        value={descValue}
        onChange={(e) => setDescValue(e.target.value)}
        className="lp-input"
        style={{
          resize: 'vertical',
          minHeight: 120,
          ...(fieldErrors.description ? { border: '1px solid #ff6b6b' } : {}),
        }}
      />
      {fieldErrors.description && (
        <p style={{ fontSize: 12, color: '#ff6b6b', marginTop: 4 }}>
          {fieldErrors.description}
        </p>
      )}

      {/* Live URL — webapp/link는 필수, native는 "웹 데모 URL"(선택)로 재활용 */}
      {(appType === 'webapp' || appType === 'link' || appType === 'native') && (
        <>
          <label style={labelStyle} htmlFor="live_url">
            {appType === 'native' ? '웹 데모 URL (선택)' : 'Live URL * (https://...)'}
          </label>
          <input
            id="live_url"
            name="live_url"
            type="url"
            required={appType !== 'native'}
            ref={liveUrlRef}
            placeholder={
              appType === 'native' ? 'https://my-app.vercel.app' : 'https://my-app.com'
            }
            defaultValue={initialData?.live_url ?? ''}
            className="lp-input"
            style={fieldErrors.live_url ? { border: '1px solid #ff6b6b' } : undefined}
          />
          {appType === 'native' && (
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
              Flutter 웹 빌드 등을 Vercel·GitHub Pages 같은 무료 호스팅에 올리면 상세 페이지 폰 화면에서 바로 실행돼요.
            </div>
          )}
          {fieldErrors.live_url && (
            <p style={{ fontSize: 12, color: '#ff6b6b', marginTop: 4 }}>
              {fieldErrors.live_url}
            </p>
          )}
        </>
      )}

      {/* 스토어 URL (native) */}
      {appType === 'native' && (
        <>
          <label style={labelStyle} htmlFor="store_url_ios">
            App Store URL
          </label>
          <input
            id="store_url_ios"
            name="store_url_ios"
            type="url"
            placeholder="https://apps.apple.com/..."
            defaultValue={initialData?.store_url_ios ?? ''}
            className="lp-input"
          />
          <label style={labelStyle} htmlFor="store_url_android">
            Google Play URL
          </label>
          <input
            id="store_url_android"
            name="store_url_android"
            type="url"
            placeholder="https://play.google.com/store/apps/..."
            defaultValue={initialData?.store_url_android ?? ''}
            className="lp-input"
            style={{ marginTop: 8 }}
          />
        </>
      )}

      {/* 데모 영상 URL (네이티브 앱에서 폰 프레임에 임베드) */}
      <label style={labelStyle} htmlFor="demo_video_url">
        데모 영상 URL (선택 · 유튜브/Vimeo)
      </label>
      <input
        id="demo_video_url"
        name="demo_video_url"
        type="url"
        placeholder="https://www.youtube.com/watch?v=... 또는 https://vimeo.com/..."
        defaultValue={initialData?.demo_video_url ?? ''}
        className="lp-input"
      />
      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
        유튜브(youtube.com, youtu.be, Shorts) 또는 Vimeo 링크만 지원합니다. 네이티브 앱의 경우 폰 프레임 안에서 재생됩니다.
      </div>

      {/* 카테고리 다중 선택 */}
      <label style={labelStyle}>카테고리 * (1개 이상 선택)</label>
      <div ref={categoryRef} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {categories.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => toggleCat(c.slug)}
            style={{
              background: selectedCats.includes(c.slug)
                ? 'linear-gradient(135deg,rgba(108,140,255,.28),rgba(155,108,255,.28))'
                : 'var(--chip)',
              border: `1px solid ${selectedCats.includes(c.slug) ? 'var(--brand)' : 'var(--line)'}`,
              color: selectedCats.includes(c.slug) ? '#fff' : 'var(--muted)',
              fontSize: 13,
              fontWeight: 600,
              padding: '7px 14px',
              borderRadius: 999,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: '.12s',
            }}
          >
            {c.emoji} {c.label_ko}
          </button>
        ))}
      </div>
      {fieldErrors.categories && (
        <p style={{ fontSize: 12, color: '#ff6b6b', marginTop: 4 }}>
          {fieldErrors.categories}
        </p>
      )}

      {/* 기술 스택 */}
      <label style={labelStyle}>기술 스택 (Enter 또는 쉼표로 추가, 최대 10개)</label>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          background: 'rgba(255,255,255,.05)',
          border: '1px solid var(--line)',
          borderRadius: 10,
          padding: '10px 12px',
          minHeight: 46,
          cursor: 'text',
        }}
        onClick={() => stackInputRef.current?.focus()}
      >
        {stacks.map((s) => (
          <span
            key={s}
            style={{
              background: 'var(--chip)',
              border: '1px solid var(--line)',
              borderRadius: 7,
              padding: '3px 8px',
              fontSize: 12,
              color: 'var(--muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {s}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeStack(s);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                padding: 0,
                fontSize: 13,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={stackInputRef}
          type="text"
          value={stackInput}
          onChange={(e) => setStackInput(e.target.value)}
          onKeyDown={addStack}
          placeholder={stacks.length === 0 ? 'React, Node.js, GPT-4...' : ''}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--ink)',
            fontSize: 13,
            fontFamily: 'inherit',
            flex: 1,
            minWidth: 80,
          }}
        />
      </div>

      {/* 추천 스택 칩 */}
      {suggestedStacks.length > 0 && (
        <div
          style={{
            marginTop: 10,
            padding: '10px 12px',
            background: 'rgba(108,140,255,.06)',
            border: '1px solid rgba(108,140,255,.18)',
            borderRadius: 10,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--brand)',
              marginBottom: 8,
              letterSpacing: '.04em',
              textTransform: 'uppercase',
            }}
          >
            추천 스택 — 클릭해서 추가
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {suggestedStacks.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addSuggestedStack(tag)}
                style={{
                  background: 'rgba(108,140,255,.14)',
                  border: '1px solid rgba(108,140,255,.35)',
                  borderRadius: 7,
                  padding: '4px 10px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#a8b8ff',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'background .1s, border-color .1s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 썸네일 업로드 */}
      <label style={labelStyle}>
        썸네일 이미지 (최대 {THUMBNAIL_MAX_MB}MB, 권장 1200×630)
      </label>
      <div
        style={{
          border: '2px dashed var(--line)',
          borderRadius: 12,
          padding: 20,
          textAlign: 'center',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        {thumbnailPreview ? (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnailPreview}
              alt="썸네일 미리보기"
              style={{
                maxWidth: '100%',
                maxHeight: 180,
                borderRadius: 8,
                display: 'block',
              }}
            />
            <button
              type="button"
              onClick={() => {
                setThumbnailPath(null);
                setThumbnailPreview(null);
              }}
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                background: 'rgba(0,0,0,.6)',
                border: 'none',
                borderRadius: '50%',
                color: '#fff',
                width: 24,
                height: 24,
                cursor: 'pointer',
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🖼️</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              {uploadingThumb ? '업로드 중...' : '클릭하거나 파일을 드래그해서 업로드'}
            </div>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          disabled={uploadingThumb}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadThumbnail(file);
            e.target.value = '';
          }}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            cursor: 'pointer',
          }}
        />
      </div>

      {/* 스크린샷 업로드 */}
      <label style={labelStyle}>
        스크린샷 (최대 {SCREENSHOT_MAX_COUNT}장, 각 {SCREENSHOT_MAX_MB}MB 이하)
      </label>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {screenshotPreviews.map((preview, idx) => (
          <div
            key={idx}
            style={{
              position: 'relative',
              width: 120,
              height: 80,
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt={`스크린샷 ${idx + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <button
              type="button"
              onClick={() => removeScreenshot(idx)}
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                background: 'rgba(0,0,0,.6)',
                border: 'none',
                borderRadius: '50%',
                color: '#fff',
                width: 20,
                height: 20,
                cursor: 'pointer',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>
        ))}

        {screenshotPaths.length < SCREENSHOT_MAX_COUNT && (
          <label
            style={{
              width: 120,
              height: 80,
              border: '2px dashed var(--line)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: uploadingScreenshot ? 'not-allowed' : 'pointer',
              color: 'var(--muted)',
              fontSize: 24,
              flexShrink: 0,
            }}
          >
            {uploadingScreenshot ? '...' : '+'}
            <input
              type="file"
              accept="image/*"
              disabled={uploadingScreenshot}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadScreenshot(file);
                e.target.value = '';
              }}
              style={{ display: 'none' }}
            />
          </label>
        )}
      </div>

      {/* 에러 */}
      {error && (
        <div
          ref={errorRef}
          role="alert"
          style={{
            background: 'rgba(255,107,107,.12)',
            border: '1px solid rgba(255,107,107,.3)',
            borderRadius: 10,
            padding: '12px 16px',
            color: '#ff6b6b',
            fontSize: 14,
            marginTop: 20,
          }}
        >
          {error}
        </div>
      )}

      {/* 동의 체크박스 (등록 모드에서만 표시) */}
      {!isEdit && (
        <div
          style={{
            marginTop: 28,
            background: 'rgba(255,255,255,.03)',
            border: `1px solid ${agreed ? 'var(--brand)' : 'var(--line)'}`,
            borderRadius: 12,
            padding: '16px',
            transition: 'border-color .15s',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{
                width: 18,
                height: 18,
                marginTop: 2,
                accentColor: 'var(--brand)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 13,
                color: agreed ? 'var(--ink)' : 'var(--muted)',
                lineHeight: 1.6,
                transition: 'color .15s',
              }}
            >
              본인이 직접 만들었거나 게시할 권리가 있는 콘텐츠임을 확인하며,
              제3자 저작권을 침해하지 않음을 보증합니다. 또한{' '}
              <Link
                href="/ko/terms"
                target="_blank"
                style={{ color: 'var(--brand)', textDecoration: 'underline' }}
              >
                이용약관
              </Link>
              에 동의합니다. *
            </span>
          </label>
        </div>
      )}

      {/* 제출 */}
      <div style={{ marginTop: 16 }}>
        <button
          type="submit"
          disabled={isPending || uploadingThumb || uploadingScreenshot || !agreed}
          style={{
            background:
              isPending || !agreed
                ? 'var(--chip)'
                : 'linear-gradient(135deg,var(--brand),var(--brand2))',
            border: 'none',
            borderRadius: 12,
            padding: '13px 28px',
            fontSize: 15,
            fontWeight: 700,
            color: isPending || !agreed ? 'var(--muted)' : '#fff',
            cursor:
              isPending || uploadingThumb || uploadingScreenshot || !agreed
                ? 'not-allowed'
                : 'pointer',
            fontFamily: 'inherit',
            transition: 'background .15s, color .15s',
          }}
        >
          {isPending
            ? (isEdit ? '수정 중...' : '등록 중...')
            : (isEdit ? '수정 완료' : '제품 등록하기')}
        </button>

        {!isEdit && (
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12 }}>
            제출하면 즉시 공개됩니다.{' '}
            <Link href="/ko/privacy" target="_blank" style={{ color: 'var(--muted)', textDecoration: 'underline' }}>
              개인정보처리방침
            </Link>
            도 확인해 주세요.
          </p>
        )}
      </div>
    </form>
  );
}
