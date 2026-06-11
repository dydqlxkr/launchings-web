-- =============================================================
-- 0013_reports_reporter_check.sql — reports INSERT 정책 강화
-- Supabase SQL Editor에 전체를 붙여넣어 실행하세요.
-- idempotent: DROP POLICY IF EXISTS → CREATE POLICY
-- =============================================================
-- 변경 이유:
--   0001_init.sql 의 reports_insert_auth 정책은
--   "auth.uid() IS NOT NULL" 만 검사하므로,
--   로그인 사용자가 reporter_id에 타인의 uid를 넣을 수 있음.
--   reporter_id = auth.uid() 조건을 추가해 본인만 삽입 가능하도록 강화.
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 기존 INSERT 정책 제거 후 재생성 (reporter_id 체크 추가)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "reports_insert_auth" ON public.reports;

CREATE POLICY "reports_insert_auth"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND reporter_id = auth.uid());

-- =============================================================
-- 완료
-- =============================================================
