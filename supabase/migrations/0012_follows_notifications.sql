-- =============================================================
-- 0012_follows_notifications.sql — 팔로우 + 알림 테이블
-- Supabase SQL Editor에 전체를 붙여넣어 실행하세요.
-- idempotent: CREATE TABLE IF NOT EXISTS, DROP POLICY IF EXISTS
-- =============================================================

-- ─────────────────────────────────────────────
-- 1. follows 테이블
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower  ON public.follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows (following_id);

-- ─────────────────────────────────────────────
-- 2. follows RLS
-- ─────────────────────────────────────────────
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- SELECT: 팔로워/팔로잉 수 표시용 — 공개
DROP POLICY IF EXISTS "follows_select_all" ON public.follows;
CREATE POLICY "follows_select_all"
  ON public.follows FOR SELECT USING (true);

-- INSERT: 본인(follower_id = auth.uid())만
DROP POLICY IF EXISTS "follows_insert_own" ON public.follows;
CREATE POLICY "follows_insert_own"
  ON public.follows FOR INSERT
  WITH CHECK (follower_id = auth.uid());

-- DELETE: 본인만 팔로우 취소
DROP POLICY IF EXISTS "follows_delete_own" ON public.follows;
CREATE POLICY "follows_delete_own"
  ON public.follows FOR DELETE
  USING (follower_id = auth.uid());

-- ─────────────────────────────────────────────
-- 3. notifications 테이블
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       text NOT NULL,
  actor_id   uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  app_id     uuid NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  message    text,
  is_read    boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications (user_id, is_read) WHERE is_read = false;

-- ─────────────────────────────────────────────
-- 4. notifications RLS
-- ─────────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- SELECT: 본인 알림만 읽기
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

-- UPDATE(is_read): 본인만
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- INSERT: 트리거(SECURITY DEFINER)에서만 삽입 — 일반 사용자는 INSERT 불가
-- (정책을 넣지 않으면 RLS가 막으므로, 트리거가 SECURITY DEFINER로 RLS 우회)

-- ─────────────────────────────────────────────
-- 5. 트리거 함수: apps INSERT 시 팔로워에게 알림 생성
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_followers_on_new_app()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- status = 'published'인 앱이 등록될 때만 동작
  IF NEW.status <> 'published' THEN
    RETURN NEW;
  END IF;

  -- 앱 author를 팔로우하는 모든 follower에게 알림 생성
  -- author 본인에게는 생성 안 함 (follower_id <> NEW.author_id는 follows.CHECK로 이미 보장되지만 명시적으로 필터)
  INSERT INTO public.notifications (user_id, type, actor_id, app_id, message, is_read, created_at)
  SELECT
    f.follower_id,
    'new_app',
    NEW.author_id,
    NEW.id,
    NULL,  -- message는 앱/저자 정보로 클라이언트에서 렌더링
    false,
    now()
  FROM public.follows f
  WHERE f.following_id = NEW.author_id
    AND f.follower_id <> NEW.author_id;

  RETURN NEW;
END;
$$;

-- 트리거 등록 (이미 있으면 재생성)
DROP TRIGGER IF EXISTS on_app_published ON public.apps;
CREATE TRIGGER on_app_published
  AFTER INSERT ON public.apps
  FOR EACH ROW
  EXECUTE PROCEDURE public.notify_followers_on_new_app();

-- =============================================================
-- 완료
-- =============================================================
-- 다음 단계:
-- 1. Supabase Dashboard > SQL Editor에서 이 파일 전체를 실행하세요.
-- 2. follows, notifications 테이블과 on_app_published 트리거가 생성됩니다.
-- =============================================================
