-- =============================================================
-- 0002_reports_unique.sql — 중복 신고 방지 unique 제약 추가
-- =============================================================
-- 같은 사용자가 같은 앱을 중복 신고하지 못하도록 unique 제약 추가.
-- reporter_id가 NOT NULL인 행에만 적용 (익명 신고는 중복 허용).
-- ADD COLUMN 없음, 기존 데이터 보존.
-- =============================================================

-- unique 제약: reporter_id + app_id 조합 (reporter_id가 null이 아닌 경우)
-- partial unique index 사용 (NULL은 unique 제약에서 제외됨 — 표준 SQL 동작)
CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_unique_reporter_app
  ON public.reports (reporter_id, app_id)
  WHERE reporter_id IS NOT NULL;

-- =============================================================
-- 완료
-- =============================================================
-- 적용 방법: Supabase Dashboard > SQL Editor에서 이 파일 전체를 실행하세요.
-- =============================================================
