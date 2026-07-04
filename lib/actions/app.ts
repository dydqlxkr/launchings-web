'use server';

/**
 * 앱 삭제 / 수정 Server Actions.
 * 인증 + 소유자 검증 후 DB 조작.
 */

import { redirect } from 'next/navigation';
import { revalidatePath, revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/repo/supabase';
import { createClient } from '@/lib/supabase/server';
import { checkUrlSafety, threatTypeLabel } from '@/lib/safeBrowsing';
import { isSafeHttpUrl } from '@/lib/validations';
import { isEmbeddableVideoUrl } from '@/lib/videoEmbed';

// ─── 공유 헬퍼 ──────────────────────────────────────────────────────────────

function validateAppFields(data: {
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
    if (!isSafeHttpUrl(data.live_url)) {
      return 'Live URL은 https:// 또는 http://로 시작하는 올바른 URL이어야 합니다.';
    }
  } else if (data.app_type === 'native' && data.live_url) {
    // native의 live_url은 "웹 데모 URL"로 재활용 — 선택 입력이지만, 값이 있으면 동일하게 검증
    if (!isSafeHttpUrl(data.live_url)) {
      return '웹 데모 URL은 https:// 또는 http://로 시작하는 올바른 URL이어야 합니다.';
    }
  }
  return null;
}

// ─── deleteApp ──────────────────────────────────────────────────────────────

export type DeleteResult = { error: string } | { ok: true };

export async function deleteApp(appId: string): Promise<DeleteResult> {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: '로그인이 필요합니다.' };
  }

  // 소유자 확인
  const { data: app, error: fetchError } = await supabase
    .from('apps')
    .select('id, author_id, slug')
    .eq('id', appId)
    .maybeSingle();

  if (fetchError || !app) {
    return { error: '앱을 찾을 수 없습니다.' };
  }
  if (app.author_id !== user.id) {
    return { error: '삭제 권한이 없습니다.' };
  }

  // CASCADE로 연관 행(app_categories / app_stacks / app_screenshots / votes / reports) 자동 삭제.
  const { error: deleteError } = await supabase
    .from('apps')
    .delete()
    .eq('id', appId)
    .eq('author_id', user.id); // RLS 이중 방어

  if (deleteError) {
    console.error('[deleteApp] error:', deleteError.message);
    return { error: '삭제에 실패했습니다. 다시 시도해 주세요.' };
  }

  // 캐시 무효화 — 태그 기반(즉시 만료) + 경로 기반 병행
  revalidateTag(CACHE_TAGS.apps, { expire: 0 });
  revalidatePath('/ko');
  revalidatePath('/ko/my-apps');
  revalidatePath(`/ko/apps/${app.slug}`);

  return { ok: true };
}

// ─── updateApp ──────────────────────────────────────────────────────────────

export type UpdateResult =
  | { slug: string; error?: undefined }
  | { error: string; slug?: undefined };

export async function updateApp(
  appId: string,
  formData: FormData
): Promise<UpdateResult> {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: '로그인이 필요합니다.' };
  }

  // 소유자 확인 (slug 포함 조회 — 성공 후 redirect에 필요)
  const { data: existing, error: fetchError } = await supabase
    .from('apps')
    .select('id, author_id, slug')
    .eq('id', appId)
    .maybeSingle();

  if (fetchError || !existing) {
    return { error: '앱을 찾을 수 없습니다.' };
  }
  if (existing.author_id !== user.id) {
    return { error: '수정 권한이 없습니다.' };
  }

  // 폼 필드 추출
  const title = (formData.get('title') as string)?.trim() ?? '';
  const tagline = (formData.get('tagline') as string)?.trim() || null;
  const description = (formData.get('description') as string)?.trim() ?? '';
  const app_type = (formData.get('app_type') as string) ?? 'webapp';
  const live_url = (formData.get('live_url') as string)?.trim() || null;
  const store_url_ios = (formData.get('store_url_ios') as string)?.trim() || null;
  const store_url_android = (formData.get('store_url_android') as string)?.trim() || null;
  const demo_video_url_raw = (formData.get('demo_video_url') as string)?.trim() || null;
  const thumbnail_path = (formData.get('thumbnail_path') as string)?.trim() || null;
  const categoriesRaw = formData.get('categories') as string;
  const stacksRaw = formData.get('stacks') as string;
  const screenshotsRaw = formData.get('screenshot_paths') as string;

  // 유효성 검사 (submit.ts와 동일 로직)
  const validationError = validateAppFields({
    title,
    description,
    live_url: live_url ?? '',
    app_type,
  });
  if (validationError) {
    return { error: validationError };
  }

  if (store_url_ios && !isSafeHttpUrl(store_url_ios)) {
    return { error: 'App Store URL은 https:// 또는 http://로 시작하는 올바른 URL이어야 합니다.' };
  }
  if (store_url_android && !isSafeHttpUrl(store_url_android)) {
    return { error: 'Google Play URL은 https:// 또는 http://로 시작하는 올바른 URL이어야 합니다.' };
  }

  // 데모 영상 URL 검증 — 비었으면 null, 값 있으면 YouTube/Vimeo 임베드 가능 URL인지 확인
  let demo_video_url: string | null = null;
  if (demo_video_url_raw) {
    if (!isSafeHttpUrl(demo_video_url_raw)) {
      return { error: '데모 영상 URL은 https:// 또는 http://로 시작하는 올바른 URL이어야 합니다.' };
    }
    if (!isEmbeddableVideoUrl(demo_video_url_raw)) {
      return { error: '데모 영상은 유튜브(youtube.com, youtu.be, Shorts) 또는 Vimeo 링크만 지원합니다.' };
    }
    demo_video_url = demo_video_url_raw;
  }

  // Google Safe Browsing 검사
  if (live_url) {
    const safeResult = await checkUrlSafety(live_url);
    if (safeResult.threat) {
      const typeLabel = safeResult.type ? threatTypeLabel(safeResult.type) : '보안 위협';
      return {
        error: `등록하려는 URL이 보안 위협(${typeLabel})으로 감지되었습니다. 다른 URL을 사용하거나, 해당 도메인의 보안 문제를 해결한 후 다시 시도해 주세요.`,
      };
    }
  }

  // 이미지 경로 소유권 검증 (submit.ts M-1과 동일 보안)
  const ownPrefix = `${user.id}/`;
  const validatedThumbnailPath =
    thumbnail_path && thumbnail_path.startsWith(ownPrefix) ? thumbnail_path : null;
  if (thumbnail_path && !validatedThumbnailPath) {
    return { error: '썸네일 경로가 올바르지 않습니다.' };
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
  const screenshotPaths: string[] = allScreenshotPaths.filter((p) =>
    p.startsWith(ownPrefix)
  );

  // apps UPDATE (slug는 유지 — 링크 깨짐 방지)
  const { error: updateError } = await supabase
    .from('apps')
    .update({
      title,
      tagline: tagline || null,
      description,
      app_type,
      live_url,
      store_url_ios,
      store_url_android,
      demo_video_url,
      thumbnail_path: validatedThumbnailPath,
      updated_at: new Date().toISOString(),
    })
    .eq('id', appId)
    .eq('author_id', user.id); // RLS 이중 방어

  if (updateError) {
    console.error('[updateApp] update error:', updateError.message);
    return { error: '수정에 실패했습니다. 다시 시도해 주세요.' };
  }

  // 카테고리: 기존 삭제 → 새로 삽입
  await supabase.from('app_categories').delete().eq('app_id', appId);
  if (categories.length > 0) {
    await supabase.from('app_categories').insert(
      categories.map((slug: string) => ({
        app_id: appId,
        category_slug: slug,
      }))
    );
  }

  // 스택: 기존 삭제 → 새로 삽입
  await supabase.from('app_stacks').delete().eq('app_id', appId);
  if (stacks.length > 0) {
    await supabase.from('app_stacks').insert(
      stacks.map((stack: string) => ({
        app_id: appId,
        stack,
      }))
    );
  }

  // 스크린샷: 기존 삭제 → 새로 삽입 (최대 6장)
  await supabase.from('app_screenshots').delete().eq('app_id', appId);
  if (screenshotPaths.length > 0) {
    const limited = screenshotPaths.slice(0, 6);
    await supabase.from('app_screenshots').insert(
      limited.map((path: string, i: number) => ({
        app_id: appId,
        storage_path: path,
        sort_order: i,
      }))
    );
  }

  // 캐시 무효화 — 태그 기반(즉시 만료) + 경로 기반 병행
  revalidateTag(CACHE_TAGS.apps, { expire: 0 });
  revalidatePath('/ko');
  revalidatePath('/ko/my-apps');
  revalidatePath(`/ko/apps/${existing.slug}`);

  redirect(`/ko/apps/${existing.slug}`);
}
