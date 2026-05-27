-- =============================================================
-- 0005_storage_bucket.sql
-- app-images Storage 버킷 + RLS 정책 복구 (0001에서 누락된 경우 재적용)
-- 멱등(idempotent) — 여러 번 실행해도 안전.
-- Supabase Dashboard → SQL Editor 에 붙여넣고 Run.
-- =============================================================

-- 1) 버킷 생성 (이미 있으면 무시)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'app-images',
  'app-images',
  true,                            -- 공개 읽기
  5242880,                         -- 5MB 상한
  ARRAY['image/jpeg','image/png','image/gif','image/webp','image/svg+xml']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2) RLS 정책 재적용
DROP POLICY IF EXISTS "app_images_select_public"  ON storage.objects;
DROP POLICY IF EXISTS "app_images_insert_auth"    ON storage.objects;
DROP POLICY IF EXISTS "app_images_update_own"     ON storage.objects;
DROP POLICY IF EXISTS "app_images_delete_own"     ON storage.objects;

-- 공개 읽기
CREATE POLICY "app_images_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'app-images');

-- 인증 사용자 업로드 — 경로 첫 폴더가 본인 uid 여야 함 (예: <uid>/thumbnails/..)
CREATE POLICY "app_images_insert_auth"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'app-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 본인 파일만 수정
CREATE POLICY "app_images_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'app-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 본인 파일만 삭제
CREATE POLICY "app_images_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'app-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
