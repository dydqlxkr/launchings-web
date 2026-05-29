'use server';

/**
 * 앱 등록 Server Action.
 * 로그인 필수. author_id = auth.uid() RLS 강제.
 * 이미지는 클라이언트에서 Supabase Storage로 직접 업로드 후
 * 경로(path)만 이 Action에 전달.
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { checkUrlSafety, threatTypeLabel } from '@/lib/safeBrowsing';
import { isSafeHttpUrl, isPublicHttpUrl } from '@/lib/validations';
import { rateLimitSubmitApp, RATE_LIMIT_ERROR } from '@/lib/rateLimit';

// 슬러그 생성 헬퍼 — ASCII(영문 소문자/숫자/하이픈)만 허용
function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')  // 비-ASCII(한글 등) 제거, 영문/숫자/공백/하이픈만 유지
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  // 결과가 비면 타임스탬프 폴백
  return slug || `app-${Date.now().toString(36)}`;
}

// 유효성 검사
function validateSubmit(data: {
  title: string;
  description: string;
  live_url: string;
  app_type: string;
}): string | null {
  if (!data.title || data.title.trim().length < 2) {
    return '제목을 2자 이상 입력해 주세요.';
  }
  if (data.title.trim().length > 60) {
    return '제목은 60자 이하로 입력해 주세요.';
  }
  if (!data.description || data.description.trim().length < 10) {
    return '설명을 10자 이상 입력해 주세요.';
  }
  if (data.description.trim().length > 4000) {
    return '설명은 4000자 이하로 입력해 주세요.';
  }
  if (data.app_type === 'webapp' || data.app_type === 'link') {
    if (!data.live_url) {
      return 'Live URL을 입력해 주세요.';
    }
    if (!isPublicHttpUrl(data.live_url)) {
      return 'Live URL은 외부에서 접속 가능한 공개 https:// 또는 http:// 주소여야 합니다. (localhost·사설 IP는 사용할 수 없어요)';
    }
  }
  return null;
}

export type SubmitResult =
  | { slug: string; error?: undefined }
  | { error: string; slug?: undefined };

export async function submitApp(formData: FormData): Promise<SubmitResult> {
  const rl = await rateLimitSubmitApp();
  if (!rl.ok) return { error: RATE_LIMIT_ERROR };

  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: '로그인이 필요합니다.' };
  }

  const title = (formData.get('title') as string)?.trim() ?? '';
  const tagline = (formData.get('tagline') as string)?.trim() ?? null;
  const description = (formData.get('description') as string)?.trim() ?? '';
  const app_type = (formData.get('app_type') as string) ?? 'webapp';
  const live_url = (formData.get('live_url') as string)?.trim() || null;
  const store_url_ios = (formData.get('store_url_ios') as string)?.trim() || null;
  const store_url_android = (formData.get('store_url_android') as string)?.trim() || null;
  const thumbnail_path = (formData.get('thumbnail_path') as string)?.trim() || null;
  const categoriesRaw = formData.get('categories') as string;
  const stacksRaw = formData.get('stacks') as string;
  const screenshotsRaw = formData.get('screenshot_paths') as string;

  // 유효성 검사
  const validationError = validateSubmit({ title, description, live_url: live_url ?? '', app_type });
  if (validationError) {
    return { error: validationError };
  }

  // store_url_ios / store_url_android 스킴 검증 (C-1)
  if (store_url_ios && !isSafeHttpUrl(store_url_ios)) {
    return { error: 'App Store URL은 https:// 또는 http://로 시작하는 올바른 URL이어야 합니다.' };
  }
  if (store_url_android && !isSafeHttpUrl(store_url_android)) {
    return { error: 'Google Play URL은 https:// 또는 http://로 시작하는 올바른 URL이어야 합니다.' };
  }

  // Google Safe Browsing URL 검사 (live_url이 있는 경우)
  if (live_url) {
    const safeResult = await checkUrlSafety(live_url);
    if (safeResult.threat) {
      const typeLabel = safeResult.type ? threatTypeLabel(safeResult.type) : '보안 위협';
      return {
        error: `등록하려는 URL이 보안 위협(${typeLabel})으로 감지되었습니다. 다른 URL을 사용하거나, 해당 도메인의 보안 문제를 해결한 후 다시 시도해 주세요.`,
      };
    }
  }

  const categories: string[] = categoriesRaw
    ? JSON.parse(categoriesRaw).filter(Boolean)
    : [];
  const stacks: string[] = stacksRaw
    ? JSON.parse(stacksRaw).filter(Boolean)
    : [];
  const allScreenshotPaths: string[] = screenshotsRaw
    ? JSON.parse(screenshotsRaw).filter(Boolean)
    : [];

  // M-1: 이미지 경로 소유권 검증 — 경로가 반드시 "{user.id}/"로 시작해야 함.
  // Storage RLS가 업로드는 막지만, 등록 시점에 임의 경로 주입을 추가 방어.
  const ownPrefix = `${user.id}/`;
  const validatedThumbnailPath =
    thumbnail_path && thumbnail_path.startsWith(ownPrefix) ? thumbnail_path : null;
  if (thumbnail_path && !validatedThumbnailPath) {
    return { error: '썸네일 경로가 올바르지 않습니다.' };
  }
  const screenshotPaths: string[] = allScreenshotPaths.filter((p) => p.startsWith(ownPrefix));

  // 슬러그 생성 (중복 시 suffix 추가) — slugify가 비어있으면 내부에서 폴백 반환
  let slug = slugify(title);

  // 중복 슬러그 확인
  const { data: existing } = await supabase
    .from('apps')
    .select('slug')
    .eq('slug', slug)
    .maybeSingle();

  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  // profiles row 확인 (트리거가 생성했어야 하지만 없을 수도 있음)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    // 프로필이 없으면 생성 (트리거가 간헐적으로 실패한 경우 방어)
    const handle = `user_${user.id.slice(0, 8)}`;
    await supabase.from('profiles').insert({
      id: user.id,
      handle,
      display_name: user.email?.split('@')[0] ?? handle,
    });
  }

  // apps INSERT (RLS: author_id = auth.uid() 강제)
  const { data: app, error: appError } = await supabase
    .from('apps')
    .insert({
      author_id: user.id,
      slug,
      title,
      tagline: tagline || null,
      description,
      app_type,
      live_url,
      store_url_ios,
      store_url_android,
      thumbnail_path: validatedThumbnailPath,
      embed_status: 'unknown',
      status: 'published',
    })
    .select('id, slug')
    .single();

  if (appError || !app) {
    console.error('[Submit] app insert error:', appError?.message);
    return { error: '앱 등록에 실패했습니다. 다시 시도해 주세요.' };
  }

  // app_categories INSERT
  if (categories.length > 0) {
    await supabase.from('app_categories').insert(
      categories.map((slug: string) => ({
        app_id: app.id,
        category_slug: slug,
      }))
    );
  }

  // app_stacks INSERT
  if (stacks.length > 0) {
    await supabase.from('app_stacks').insert(
      stacks.map((stack: string) => ({
        app_id: app.id,
        stack,
      }))
    );
  }

  // app_screenshots INSERT (최대 6장)
  if (screenshotPaths.length > 0) {
    const limited = screenshotPaths.slice(0, 6);
    await supabase.from('app_screenshots').insert(
      limited.map((path: string, i: number) => ({
        app_id: app.id,
        storage_path: path,
        sort_order: i,
      }))
    );
  }

  // 캐시 무효화
  revalidatePath('/ko');

  redirect(`/ko/apps/${app.slug}`);
}
