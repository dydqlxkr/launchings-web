-- =============================================================
-- 0006_feature_requests.sql — 앱 기능 요청 테이블
-- =============================================================
-- 적용 방법: Supabase Dashboard > SQL Editor에서 이 파일 전체를 실행하세요.
-- idempotent: CREATE TABLE IF NOT EXISTS / DROP POLICY IF EXISTS 등
-- =============================================================

-- ─────────────────────────────────────────────
-- 1. feature_requests 테이블
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feature_requests (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id     uuid NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  author_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body       text NOT NULL CHECK (char_length(body) >= 4 AND char_length(body) <= 200),
  vote_count int  NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feature_requests_app ON public.feature_requests (app_id, vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_feature_requests_author ON public.feature_requests (author_id);

-- ─────────────────────────────────────────────
-- 2. feature_request_votes 테이블
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feature_request_votes (
  request_id uuid NOT NULL REFERENCES public.feature_requests(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (request_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_feature_request_votes_user ON public.feature_request_votes (user_id);

-- ─────────────────────────────────────────────
-- 3. RLS 활성화
-- ─────────────────────────────────────────────
ALTER TABLE public.feature_requests       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_request_votes  ENABLE ROW LEVEL SECURITY;

-- ── feature_requests RLS ────────────────────
DROP POLICY IF EXISTS "feature_requests_select_all"   ON public.feature_requests;
DROP POLICY IF EXISTS "feature_requests_insert_own"   ON public.feature_requests;
DROP POLICY IF EXISTS "feature_requests_delete_own"   ON public.feature_requests;

-- 읽기: 공개
CREATE POLICY "feature_requests_select_all"
  ON public.feature_requests FOR SELECT USING (true);

-- 작성: 로그인 사용자, 본인 author_id
CREATE POLICY "feature_requests_insert_own"
  ON public.feature_requests FOR INSERT
  WITH CHECK (author_id = auth.uid());

-- 삭제: 본인만
CREATE POLICY "feature_requests_delete_own"
  ON public.feature_requests FOR DELETE
  USING (author_id = auth.uid());

-- ── feature_request_votes RLS ───────────────
DROP POLICY IF EXISTS "feature_request_votes_select_all"  ON public.feature_request_votes;
DROP POLICY IF EXISTS "feature_request_votes_insert_own"  ON public.feature_request_votes;
DROP POLICY IF EXISTS "feature_request_votes_delete_own"  ON public.feature_request_votes;

-- 읽기: 공개
CREATE POLICY "feature_request_votes_select_all"
  ON public.feature_request_votes FOR SELECT USING (true);

-- 투표: 본인 user_id
CREATE POLICY "feature_request_votes_insert_own"
  ON public.feature_request_votes FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 취소: 본인만
CREATE POLICY "feature_request_votes_delete_own"
  ON public.feature_request_votes FOR DELETE
  USING (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- 4. 원자적 RPC: toggle_feature_vote
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.toggle_feature_vote(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id  uuid;
  v_voted    boolean;
  v_count    int;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  -- 이미 투표했는지 확인
  IF EXISTS (
    SELECT 1
    FROM public.feature_request_votes
    WHERE request_id = p_request_id AND user_id = v_user_id
  ) THEN
    -- 취소
    DELETE FROM public.feature_request_votes
    WHERE request_id = p_request_id AND user_id = v_user_id;

    UPDATE public.feature_requests
    SET vote_count = GREATEST(vote_count - 1, 0)
    WHERE id = p_request_id;

    v_voted := false;
  ELSE
    -- 투표
    INSERT INTO public.feature_request_votes (request_id, user_id)
    VALUES (p_request_id, v_user_id)
    ON CONFLICT DO NOTHING;

    UPDATE public.feature_requests
    SET vote_count = vote_count + 1
    WHERE id = p_request_id;

    v_voted := true;
  END IF;

  SELECT vote_count INTO v_count
  FROM public.feature_requests
  WHERE id = p_request_id;

  RETURN jsonb_build_object('voted', v_voted, 'vote_count', v_count);
END;
$$;

-- =============================================================
-- 완료
-- =============================================================
-- 이전 마이그레이션(0001~0005)이 먼저 실행되어 있어야 합니다.
-- =============================================================
