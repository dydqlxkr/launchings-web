-- =============================================================
-- 0011_bookmarks_views.sql — 북마크 테이블 + 조회수 RPC
-- Supabase SQL Editor에 전체를 붙여넣어 실행하세요.
-- idempotent
-- =============================================================

-- ─────────────────────────────────────────────
-- 1. bookmarks 테이블
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bookmarks (
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  app_id     uuid NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, app_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.bookmarks (user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_app  ON public.bookmarks (app_id);

-- ─────────────────────────────────────────────
-- 2. RLS 활성화
-- ─────────────────────────────────────────────
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- SELECT: 본인만 자신의 북마크 조회
DROP POLICY IF EXISTS "bookmarks_select_own" ON public.bookmarks;
CREATE POLICY "bookmarks_select_own"
  ON public.bookmarks FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: 본인만 자신의 user_id로 삽입
DROP POLICY IF EXISTS "bookmarks_insert_own" ON public.bookmarks;
CREATE POLICY "bookmarks_insert_own"
  ON public.bookmarks FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- DELETE: 본인만
DROP POLICY IF EXISTS "bookmarks_delete_own" ON public.bookmarks;
CREATE POLICY "bookmarks_delete_own"
  ON public.bookmarks FOR DELETE
  USING (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- 3. RPC: increment_app_view (조회수 증가)
-- SECURITY DEFINER로 RLS 우회 — UPDATE만 수행
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_app_view(p_app_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.apps
  SET view_count = view_count + 1
  WHERE id = p_app_id;
END;
$$;

-- =============================================================
-- 완료
-- =============================================================
