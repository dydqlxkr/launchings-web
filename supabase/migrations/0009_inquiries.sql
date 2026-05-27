-- =============================================================
-- 0009_inquiries.sql — 문의하기 테이블
-- =============================================================
-- 실행 방법: Supabase Dashboard > SQL Editor 에서 전체를 붙여넣어 실행
-- idempotent: CREATE TABLE IF NOT EXISTS
-- =============================================================

-- ─────────────────────────────────────────────
-- 1. inquiries 테이블
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inquiries (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text,
  email      text,
  message    text        NOT NULL CHECK (char_length(message) >= 1 AND char_length(message) <= 2000),
  user_id    uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_created ON public.inquiries (created_at DESC);

-- ─────────────────────────────────────────────
-- 2. RLS
-- ─────────────────────────────────────────────
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inquiries_insert_anyone" ON public.inquiries;
DROP POLICY IF EXISTS "inquiries_select_admin"  ON public.inquiries;

-- INSERT: 누구나 (익명 포함)
CREATE POLICY "inquiries_insert_anyone"
  ON public.inquiries FOR INSERT
  WITH CHECK (true);

-- SELECT: 관리자만 (profiles.is_admin = true)
CREATE POLICY "inquiries_select_admin"
  ON public.inquiries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- =============================================================
-- 완료
-- =============================================================
-- 적용 후 관리자는 Supabase Dashboard > Table Editor > inquiries 에서
-- 접수된 문의를 확인할 수 있습니다.
-- =============================================================
