/**
 * Storage의 thumbnail_path → 공개 URL 변환 헬퍼.
 * 버킷 'app-images'는 public이므로 직접 경로 조합으로 URL을 생성한다.
 */
export function getThumbnailUrl(thumbnailPath: string): string {
  return storagePublicUrl(thumbnailPath);
}

/**
 * app-images 버킷의 임의 storage_path → 공개 URL 변환 헬퍼.
 * (스크린샷 등 썸네일 외 파일에도 사용)
 */
export function storagePublicUrl(storagePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return `${supabaseUrl}/storage/v1/object/public/app-images/${storagePath}`;
}
