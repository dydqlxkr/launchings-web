/**
 * Storage의 thumbnail_path → 공개 URL 변환 헬퍼.
 * 버킷 'app-images'는 public이므로 직접 경로 조합으로 URL을 생성한다.
 */
export function getThumbnailUrl(thumbnailPath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return `${supabaseUrl}/storage/v1/object/public/app-images/${thumbnailPath}`;
}
