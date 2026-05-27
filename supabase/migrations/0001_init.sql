-- =============================================================
-- 0001_init.sql — 런칭스 v1 초기 스키마
-- =============================================================
-- Supabase SQL Editor에 전체를 붙여넣어 실행하세요.
-- idempotent: CREATE TABLE IF NOT EXISTS / ON CONFLICT DO NOTHING
-- =============================================================

-- ─────────────────────────────────────────────
-- 1. profiles (1:1 with auth.users)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle        text UNIQUE NOT NULL,
  display_name  text NOT NULL DEFAULT '',
  bio           text CHECK (char_length(bio) <= 500),
  avatar_url    text,
  website_url   text,
  is_admin      boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- 2. categories (시드 고정)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  slug       text PRIMARY KEY,
  label_ko   text NOT NULL,
  label_en   text NOT NULL,
  emoji      text NOT NULL DEFAULT '',
  sort_order int  NOT NULL DEFAULT 99
);

-- ─────────────────────────────────────────────
-- 3. apps
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.apps (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id          uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slug               text UNIQUE NOT NULL,
  title              text NOT NULL CHECK (char_length(title) <= 60),
  tagline            text CHECK (char_length(tagline) <= 80),
  description        text NOT NULL CHECK (char_length(description) <= 4000),
  app_type           text NOT NULL DEFAULT 'webapp'
                       CHECK (app_type IN ('webapp', 'native', 'link')),
  live_url           text,
  store_url_ios      text,
  store_url_android  text,
  demo_video_url     text,
  thumbnail_path     text,
  thumbnail_emoji    text,
  thumbnail_gradient text,
  embed_status       text NOT NULL DEFAULT 'unknown'
                       CHECK (embed_status IN ('unknown', 'embeddable', 'blocked')),
  status             text NOT NULL DEFAULT 'published'
                       CHECK (status IN ('draft', 'published', 'hidden', 'removed')),
  vote_count         int  NOT NULL DEFAULT 0,
  view_count         int  NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_apps_status_votes ON public.apps (status, vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_apps_status_created ON public.apps (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_apps_author ON public.apps (author_id);

-- ─────────────────────────────────────────────
-- 4. app_categories (M:N 조인)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.app_categories (
  app_id        uuid REFERENCES public.apps(id) ON DELETE CASCADE,
  category_slug text REFERENCES public.categories(slug) ON DELETE CASCADE,
  PRIMARY KEY (app_id, category_slug)
);

-- ─────────────────────────────────────────────
-- 5. app_stacks
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.app_stacks (
  app_id uuid REFERENCES public.apps(id) ON DELETE CASCADE,
  stack  text NOT NULL,
  PRIMARY KEY (app_id, stack)
);

-- ─────────────────────────────────────────────
-- 6. app_screenshots
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.app_screenshots (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id       uuid NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  sort_order   int  NOT NULL DEFAULT 0
);

-- ─────────────────────────────────────────────
-- 7. votes (업보트 — 핵심 무결성)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.votes (
  app_id     uuid REFERENCES public.apps(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (app_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_user ON public.votes (user_id);

-- ─────────────────────────────────────────────
-- 8. reports (신고)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id      uuid NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  reporter_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason      text NOT NULL
                CHECK (reason IN ('spam','malware','stolen','inappropriate','broken','other')),
  detail      text,
  status      text NOT NULL DEFAULT 'open'
                CHECK (status IN ('open','reviewed','actioned','dismissed')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_app ON public.reports (app_id);

-- =============================================================
-- 9. 트리거: auth.users 생성 시 profiles 자동 INSERT
-- =============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_handle text;
  final_handle text;
  suffix int := 0;
BEGIN
  -- handle: 이메일 @ 앞부분을 slug화 (영문/숫자/하이픈만, 최대 30자)
  base_handle := lower(
    regexp_replace(
      split_part(coalesce(NEW.email, 'user'), '@', 1),
      '[^a-z0-9\-]', '', 'g'
    )
  );
  -- 너무 짧으면 user_xxx 사용
  IF char_length(base_handle) < 3 THEN
    base_handle := 'user_' || substr(NEW.id::text, 1, 8);
  END IF;
  base_handle := substr(base_handle, 1, 30);
  final_handle := base_handle;

  -- 중복 handle 처리
  LOOP
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE handle = final_handle);
    suffix := suffix + 1;
    final_handle := base_handle || suffix::text;
  END LOOP;

  INSERT INTO public.profiles (id, handle, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    final_handle,
    coalesce(NEW.raw_user_meta_data->>'full_name', final_handle),
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 트리거 등록 (이미 있으면 재생성)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =============================================================
-- 10. RPC: toggle_vote (원자적 업보트 토글)
-- =============================================================
CREATE OR REPLACE FUNCTION public.toggle_vote(p_app_id uuid)
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
  IF EXISTS (SELECT 1 FROM public.votes WHERE app_id = p_app_id AND user_id = v_user_id) THEN
    -- 취소
    DELETE FROM public.votes WHERE app_id = p_app_id AND user_id = v_user_id;
    UPDATE public.apps SET vote_count = GREATEST(vote_count - 1, 0), updated_at = now()
      WHERE id = p_app_id;
    v_voted := false;
  ELSE
    -- 투표
    INSERT INTO public.votes (app_id, user_id) VALUES (p_app_id, v_user_id)
      ON CONFLICT DO NOTHING;
    UPDATE public.apps SET vote_count = vote_count + 1, updated_at = now()
      WHERE id = p_app_id;
    v_voted := true;
  END IF;

  SELECT vote_count INTO v_count FROM public.apps WHERE id = p_app_id;

  RETURN jsonb_build_object('voted', v_voted, 'vote_count', v_count);
END;
$$;

-- =============================================================
-- 11. RLS 활성화
-- =============================================================
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apps          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_stacks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports       ENABLE ROW LEVEL SECURITY;

-- ── profiles RLS ────────────────────────────
DROP POLICY IF EXISTS "profiles_select_all"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"  ON public.profiles;

CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ── categories RLS ──────────────────────────
DROP POLICY IF EXISTS "categories_select_all" ON public.categories;
CREATE POLICY "categories_select_all"
  ON public.categories FOR SELECT USING (true);

-- ── apps RLS ────────────────────────────────
DROP POLICY IF EXISTS "apps_select_published"  ON public.apps;
DROP POLICY IF EXISTS "apps_select_own"        ON public.apps;
DROP POLICY IF EXISTS "apps_insert_own"        ON public.apps;
DROP POLICY IF EXISTS "apps_update_own"        ON public.apps;
DROP POLICY IF EXISTS "apps_delete_own"        ON public.apps;

-- published는 누구나 읽기
CREATE POLICY "apps_select_published"
  ON public.apps FOR SELECT
  USING (status = 'published');

-- 본인은 자기 앱 전부 읽기 (draft 포함)
CREATE POLICY "apps_select_own"
  ON public.apps FOR SELECT
  USING (author_id = auth.uid());

-- INSERT: 본인 author_id만
CREATE POLICY "apps_insert_own"
  ON public.apps FOR INSERT
  WITH CHECK (author_id = auth.uid());

-- UPDATE: 본인만
CREATE POLICY "apps_update_own"
  ON public.apps FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- DELETE: 본인만
CREATE POLICY "apps_delete_own"
  ON public.apps FOR DELETE
  USING (author_id = auth.uid());

-- ── app_categories RLS ──────────────────────
DROP POLICY IF EXISTS "app_categories_select_all" ON public.app_categories;
DROP POLICY IF EXISTS "app_categories_insert_own" ON public.app_categories;
DROP POLICY IF EXISTS "app_categories_delete_own" ON public.app_categories;

CREATE POLICY "app_categories_select_all"
  ON public.app_categories FOR SELECT USING (true);

CREATE POLICY "app_categories_insert_own"
  ON public.app_categories FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.apps WHERE id = app_id AND author_id = auth.uid())
  );

CREATE POLICY "app_categories_delete_own"
  ON public.app_categories FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.apps WHERE id = app_id AND author_id = auth.uid())
  );

-- ── app_stacks RLS ──────────────────────────
DROP POLICY IF EXISTS "app_stacks_select_all" ON public.app_stacks;
DROP POLICY IF EXISTS "app_stacks_insert_own" ON public.app_stacks;
DROP POLICY IF EXISTS "app_stacks_delete_own" ON public.app_stacks;

CREATE POLICY "app_stacks_select_all"
  ON public.app_stacks FOR SELECT USING (true);

CREATE POLICY "app_stacks_insert_own"
  ON public.app_stacks FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.apps WHERE id = app_id AND author_id = auth.uid())
  );

CREATE POLICY "app_stacks_delete_own"
  ON public.app_stacks FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.apps WHERE id = app_id AND author_id = auth.uid())
  );

-- ── app_screenshots RLS ─────────────────────
DROP POLICY IF EXISTS "app_screenshots_select_all" ON public.app_screenshots;
DROP POLICY IF EXISTS "app_screenshots_insert_own" ON public.app_screenshots;
DROP POLICY IF EXISTS "app_screenshots_delete_own" ON public.app_screenshots;

CREATE POLICY "app_screenshots_select_all"
  ON public.app_screenshots FOR SELECT USING (true);

CREATE POLICY "app_screenshots_insert_own"
  ON public.app_screenshots FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.apps WHERE id = app_id AND author_id = auth.uid())
  );

CREATE POLICY "app_screenshots_delete_own"
  ON public.app_screenshots FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.apps WHERE id = app_id AND author_id = auth.uid())
  );

-- ── votes RLS ───────────────────────────────
DROP POLICY IF EXISTS "votes_select_all"   ON public.votes;
DROP POLICY IF EXISTS "votes_insert_own"   ON public.votes;
DROP POLICY IF EXISTS "votes_delete_own"   ON public.votes;

CREATE POLICY "votes_select_all"
  ON public.votes FOR SELECT USING (true);

CREATE POLICY "votes_insert_own"
  ON public.votes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "votes_delete_own"
  ON public.votes FOR DELETE
  USING (user_id = auth.uid());

-- ── reports RLS ─────────────────────────────
DROP POLICY IF EXISTS "reports_insert_auth"  ON public.reports;
DROP POLICY IF EXISTS "reports_select_admin" ON public.reports;
DROP POLICY IF EXISTS "reports_update_admin" ON public.reports;

CREATE POLICY "reports_insert_auth"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- admin만 읽기/처리 (profiles.is_admin 기준)
CREATE POLICY "reports_select_admin"
  ON public.reports FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "reports_update_admin"
  ON public.reports FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- =============================================================
-- 12. Storage: app-images 버킷
-- =============================================================
-- 버킷 생성 (이미 있으면 무시)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'app-images',
  'app-images',
  true,                            -- public read
  5242880,                         -- 5MB 상한 (Storage 레벨 방어)
  ARRAY['image/jpeg','image/png','image/gif','image/webp','image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS 정책
DROP POLICY IF EXISTS "app_images_select_public"  ON storage.objects;
DROP POLICY IF EXISTS "app_images_insert_auth"    ON storage.objects;
DROP POLICY IF EXISTS "app_images_update_own"     ON storage.objects;
DROP POLICY IF EXISTS "app_images_delete_own"     ON storage.objects;

-- 공개 읽기
CREATE POLICY "app_images_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'app-images');

-- 인증 사용자 업로드 — 경로에 자신의 uid가 포함되어야 함
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

-- =============================================================
-- 13. 시드 데이터 — categories
-- =============================================================
INSERT INTO public.categories (slug, label_ko, label_en, emoji, sort_order) VALUES
  ('ai',          'AI / LLM',  'AI / LLM',     '🤖', 1),
  ('productivity','생산성',     'Productivity', '⚡', 2),
  ('design',      '디자인',     'Design',       '🎨', 3),
  ('game',        '게임',       'Game',         '🎮', 4),
  ('mobile',      '모바일',     'Mobile',       '📱', 5),
  ('other',       '실험실',     'Lab',          '🧪', 6)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================
-- 14. 시드 데이터 — profiles (가상 uuid, owner NULL 없이)
-- 실제 auth.users가 없으므로 시드 프로필은 auth.users INSERT 없이
-- 직접 삽입. RLS 정책상 SELECT는 공개이므로 표시됨.
-- =============================================================

-- 시드 profiles (auth.users에 대응하는 실제 계정 없음 — 표시용)
-- NOTE: auth.users FK가 있으므로 auth.users에도 삽입 필요.
-- Supabase에서 auth.users에 직접 INSERT는 비권장이므로,
-- 여기서는 profiles의 FK를 임시로 우회해서 시드만 넣는 방법으로
-- auth.users 없이 시드 profiles를 삽입하려면 FK를 잠깐 deferred로 해야 합니다.
-- 가장 간단한 방법: auth.users 삽입 후 profiles 삽입.
-- 아래는 Supabase admin API로 사전에 계정을 만들었다고 가정하고
-- owner NULL 허용 방식 대신, seed를 apps 시드와 분리하는 접근.

-- 대안: FK를 일시 비활성화 후 시드 삽입
SET session_replication_role = 'replica';

INSERT INTO public.profiles (id, handle, display_name, bio, avatar_url, website_url, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'jihun',   '김지훈',
   '회의·메모를 자동화하는 AI 프로덕트를 혼자 기획부터 출시까지 만듭니다.',
   null, null, '2024-03-01T00:00:00Z', now()),
  ('00000000-0000-0000-0000-000000000002', 'soyeon',  'Soyeon',
   '비개발자도 쓰는 LLM 도구를 디자인하고 직접 구현합니다.',
   null, null, '2024-07-01T00:00:00Z', now()),
  ('00000000-0000-0000-0000-000000000003', 'minjae',  '박민재',
   '사진 한 장으로 끝나는 모바일 앱을 만듭니다. 앱스토어 출시 7회.',
   null, null, '2024-01-01T00:00:00Z', now()),
  ('00000000-0000-0000-0000-000000000004', 'haneul',  '이하늘',
   '디자인과 코드 사이를 메우는 도구를 만듭니다. 인터랙션이 강점.',
   null, null, '2023-11-01T00:00:00Z', now()),
  ('00000000-0000-0000-0000-000000000005', 'jaewon',  'Jaewon',
   '팀의 반복 업무를 없애는 자동화·봇을 만듭니다.',
   null, null, '2024-05-01T00:00:00Z', now())
ON CONFLICT (id) DO NOTHING;

-- ── apps 시드 ────────────────────────────────
INSERT INTO public.apps
  (id, author_id, slug, title, tagline, description,
   app_type, live_url, store_url_ios, store_url_android, demo_video_url,
   thumbnail_path, thumbnail_emoji, thumbnail_gradient,
   embed_status, status, vote_count, view_count, created_at, updated_at)
VALUES
  ('00000000-1000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'memoflow', 'MemoFlow',
   'AI가 회의 메모를 읽고 할 일을 자동으로 정리해주는 노트 앱',
   'AI가 회의 메모를 읽고 할 일을 자동으로 정리해주는 노트 앱. 회의 후 메모를 붙여넣으면 AI가 액션 아이템을 자동 추출합니다.',
   'webapp', 'https://memoflow.launchings.app', null, null, null,
   null, '🗒️', '135deg, #1e2a4a, #3a2a5a',
   'embeddable', 'published', 842, 4200,
   '2025-03-01T00:00:00Z', '2025-05-01T00:00:00Z'),

  ('00000000-1000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000002',
   'promptpilot', 'PromptPilot',
   '초보자도 좋은 AI 프롬프트를 만들도록 도와주는 어시스턴트',
   '초보자도 좋은 AI 프롬프트를 만들도록 도와주는 어시스턴트. 역할·목표·톤을 입력하면 최적화된 프롬프트를 즉시 생성합니다.',
   'webapp', 'https://promptpilot.launchings.app', null, null, null,
   null, '🤖', '135deg, #13332c, #1e4a3a',
   'embeddable', 'published', 713, 3500,
   '2025-07-01T00:00:00Z', '2025-09-01T00:00:00Z'),

  ('00000000-1000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000003',
   'harujaemu', '하루재무',
   '영수증 사진만 찍으면 AI가 가계부를 써주는 모바일 앱',
   '영수증 사진만 찍으면 AI가 가계부를 써주는 모바일 앱. OCR과 AI로 지출을 자동 분류하고 월별 리포트를 제공합니다.',
   'native', null,
   'https://apps.apple.com/app/harujaemu',
   'https://play.google.com/store/apps/harujaemu',
   'https://youtube.com/watch?v=demo-harujaemu',
   null, '📱', '135deg, #3a2418, #5a3320',
   'blocked', 'published', 689, 3100,
   '2025-06-01T00:00:00Z', '2025-10-01T00:00:00Z'),

  ('00000000-1000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000004',
   'paletteai', 'PaletteAI',
   '한 줄 설명만 쓰면 브랜드 컬러 팔레트를 뽑아주는 도구',
   '한 줄 설명만 쓰면 브랜드 컬러 팔레트를 뽑아주는 디자인 도구. 분위기를 입력하면 조화로운 5색 팔레트를 즉시 생성합니다.',
   'webapp', 'https://paletteai.launchings.app', null, null, null,
   null, '🎨', '135deg, #2a1e3a, #4a2a4a',
   'embeddable', 'published', 521, 2600,
   '2025-10-01T00:00:00Z', '2025-11-01T00:00:00Z'),

  ('00000000-1000-0000-0000-000000000005',
   '00000000-0000-0000-0000-000000000005',
   'standupbot', 'StandupBot',
   '슬랙에 매일 아침 팀 스탠드업을 자동 진행하는 봇',
   '슬랙에 매일 아침 팀 스탠드업을 자동 진행하는 봇. 일정 시간에 질문을 보내고 답변을 취합해 팀 채널에 요약합니다.',
   'webapp', 'https://standupbot.launchings.app', null, null, null,
   null, '⚡', '135deg, #18303a, #205a5a',
   'embeddable', 'published', 498, 2400,
   '2025-04-01T00:00:00Z', '2025-08-01T00:00:00Z'),

  ('00000000-1000-0000-0000-000000000006',
   '00000000-0000-0000-0000-000000000004',
   'pixelquest', 'PixelQuest',
   '매일 새 스테이지가 생성되는 브라우저 반응속도 게임',
   '매일 새 스테이지가 생성되는 브라우저 반응속도 게임. 숫자를 순서대로 최대한 빠르게 눌러 기록을 경쟁합니다.',
   'webapp', 'https://pixelquest.launchings.app', null, null, null,
   null, '🎮', '135deg, #3a182a, #5a2040',
   'embeddable', 'published', 455, 2100,
   '2025-11-01T00:00:00Z', '2025-12-01T00:00:00Z'),

  ('00000000-1000-0000-0000-000000000007',
   '00000000-0000-0000-0000-000000000002',
   'codesnap', 'CodeSnap',
   '코드를 예쁜 이미지로 만들어 SNS에 공유하는 도구',
   '코드를 예쁜 이미지로 만들어 SNS에 공유하는 도구. 다양한 테마와 언어 하이라이팅을 지원합니다.',
   'webapp', 'https://codesnap.launchings.app', null, null, null,
   null, '📸', '135deg, #1a2440, #2a3a6a',
   'embeddable', 'published', 392, 1900,
   '2025-02-01T00:00:00Z', '2025-04-01T00:00:00Z'),

  ('00000000-1000-0000-0000-000000000008',
   '00000000-0000-0000-0000-000000000003',
   'habitloop', 'HabitLoop',
   '습관을 게임처럼 만들어주는 트래커. AI 코칭 포함',
   '습관을 게임처럼 만들어주는 트래커. AI 코칭 포함. 매일 습관을 기록하면 게임 요소로 동기부여를 높이고 AI가 맞춤 피드백을 제공합니다.',
   'native', null,
   'https://apps.apple.com/app/habitloop',
   'https://play.google.com/store/apps/habitloop',
   'https://youtube.com/watch?v=demo-habitloop',
   null, '🔁', '135deg, #143828, #1e5a3a',
   'blocked', 'published', 341, 1700,
   '2025-09-01T00:00:00Z', '2025-12-01T00:00:00Z'),

  ('00000000-1000-0000-0000-000000000009',
   '00000000-0000-0000-0000-000000000001',
   'mindmapai', 'MindMapAI',
   '한 문장을 넣으면 마인드맵을 자동 생성하는 사고 정리 도구',
   '한 문장을 넣으면 마인드맵을 자동 생성하는 사고 정리 도구. AI가 개념을 분해하고 관계를 시각화합니다.',
   'webapp', 'https://mindmapai.launchings.app', null, null, null,
   null, '🧠', '135deg, #2a1a3a, #4a2a5a',
   'embeddable', 'published', 298, 1400,
   '2025-12-01T00:00:00Z', '2026-01-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ── app_categories 시드 ──────────────────────
INSERT INTO public.app_categories (app_id, category_slug) VALUES
  ('00000000-1000-0000-0000-000000000001', 'ai'),
  ('00000000-1000-0000-0000-000000000001', 'productivity'),
  ('00000000-1000-0000-0000-000000000002', 'ai'),
  ('00000000-1000-0000-0000-000000000002', 'productivity'),
  ('00000000-1000-0000-0000-000000000003', 'ai'),
  ('00000000-1000-0000-0000-000000000003', 'mobile'),
  ('00000000-1000-0000-0000-000000000004', 'design'),
  ('00000000-1000-0000-0000-000000000004', 'ai'),
  ('00000000-1000-0000-0000-000000000005', 'productivity'),
  ('00000000-1000-0000-0000-000000000006', 'game'),
  ('00000000-1000-0000-0000-000000000007', 'design'),
  ('00000000-1000-0000-0000-000000000007', 'productivity'),
  ('00000000-1000-0000-0000-000000000008', 'ai'),
  ('00000000-1000-0000-0000-000000000008', 'mobile'),
  ('00000000-1000-0000-0000-000000000008', 'productivity'),
  ('00000000-1000-0000-0000-000000000009', 'ai'),
  ('00000000-1000-0000-0000-000000000009', 'productivity')
ON CONFLICT DO NOTHING;

-- ── app_stacks 시드 ──────────────────────────
INSERT INTO public.app_stacks (app_id, stack) VALUES
  ('00000000-1000-0000-0000-000000000001', 'React'),
  ('00000000-1000-0000-0000-000000000001', 'GPT-4o'),
  ('00000000-1000-0000-0000-000000000001', 'Whisper'),
  ('00000000-1000-0000-0000-000000000002', 'Next.js'),
  ('00000000-1000-0000-0000-000000000002', 'Claude'),
  ('00000000-1000-0000-0000-000000000002', 'Tailwind'),
  ('00000000-1000-0000-0000-000000000003', 'Flutter'),
  ('00000000-1000-0000-0000-000000000003', 'Gemini Vision'),
  ('00000000-1000-0000-0000-000000000003', 'SQLite'),
  ('00000000-1000-0000-0000-000000000004', 'Vue'),
  ('00000000-1000-0000-0000-000000000004', 'Canvas'),
  ('00000000-1000-0000-0000-000000000005', 'Node'),
  ('00000000-1000-0000-0000-000000000005', 'Slack API'),
  ('00000000-1000-0000-0000-000000000005', 'Cron'),
  ('00000000-1000-0000-0000-000000000006', 'Canvas'),
  ('00000000-1000-0000-0000-000000000006', 'JavaScript'),
  ('00000000-1000-0000-0000-000000000006', 'PWA'),
  ('00000000-1000-0000-0000-000000000007', 'React'),
  ('00000000-1000-0000-0000-000000000007', 'html2canvas'),
  ('00000000-1000-0000-0000-000000000008', 'Flutter'),
  ('00000000-1000-0000-0000-000000000008', 'Firebase'),
  ('00000000-1000-0000-0000-000000000009', 'Svelte'),
  ('00000000-1000-0000-0000-000000000009', 'D3'),
  ('00000000-1000-0000-0000-000000000009', 'GPT')
ON CONFLICT DO NOTHING;

-- FK 다시 활성화
SET session_replication_role = 'origin';

-- =============================================================
-- 완료
-- =============================================================
-- 다음 단계:
-- 1. Supabase Dashboard > Authentication > Email > "Enable Email provider" 확인
-- 2. Authentication > URL Configuration에 Site URL, Redirect URL 설정
-- 3. Storage > Buckets에 'app-images' 버킷이 생성됐는지 확인
-- =============================================================
