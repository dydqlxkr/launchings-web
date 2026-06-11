-- =============================================================
-- verify_publish_readiness.sql — 공개 전 DB 검증 스크립트
-- Supabase Dashboard > SQL Editor 에 전체를 붙여넣어 실행하세요.
-- 각 섹션을 개별로 실행해도 됩니다.
-- =============================================================


-- ─────────────────────────────────────────────────────────────
-- (a) RLS가 꺼진 테이블 목록
--     기대 결과: 0행 (public 스키마의 모든 테이블에 RLS 활성화)
-- ─────────────────────────────────────────────────────────────
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;
-- 결과가 0행이면 모든 테이블의 RLS가 켜진 것입니다.
-- 행이 있으면 해당 테이블에 ALTER TABLE <table> ENABLE ROW LEVEL SECURITY; 실행 필요.


-- ─────────────────────────────────────────────────────────────
-- (b) 테이블별 RLS 정책 목록
--     기대 결과: 각 테이블에 필요한 정책들이 모두 존재
-- ─────────────────────────────────────────────────────────────
SELECT
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;


-- ─────────────────────────────────────────────────────────────
-- (c) 0008_remove_seed.sql 적용 여부 — 시드 데이터 잔존 확인
--     기대 결과: 두 쿼리 모두 0행 (시드 데이터가 삭제된 상태)
-- ─────────────────────────────────────────────────────────────

-- 시드 앱 잔존 여부 (0008에서 삭제 대상이었던 slug들)
SELECT id, slug, title
FROM public.apps
WHERE slug IN (
  'memoflow',
  'promptpilot',
  'harujaemu',
  'paletteai',
  'standupbot',
  'pixelquest',
  'codesnap',
  'habitloop',
  'mindmapai'
);
-- 기대 결과: 0행 (시드 앱 없음)

-- 시드 프로필 잔존 여부 (0008에서 삭제 대상이었던 handle들)
SELECT id, handle, display_name
FROM public.profiles
WHERE handle IN (
  'jihun',
  'soyeon',
  'minjae',
  'haneul',
  'jaewon'
);
-- 기대 결과: 0행 (시드 프로필 없음)


-- ─────────────────────────────────────────────────────────────
-- (d) reports INSERT 정책에 reporter_id 체크가 포함됐는지 확인
--     0013_reports_reporter_check.sql 적용 후 기대 결과:
--       with_check 컬럼에 "reporter_id = auth.uid()" 가 포함된 행 1개
-- ─────────────────────────────────────────────────────────────
SELECT
  tablename,
  policyname,
  cmd,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'reports'
  AND cmd = 'INSERT';
-- 기대 결과:
--   policyname : reports_insert_auth
--   with_check : (auth.uid() IS NOT NULL) AND (reporter_id = auth.uid())
--   (0013 마이그레이션 미적용 시 with_check에 reporter_id 조건이 없음)

-- =============================================================
-- 완료
-- =============================================================
