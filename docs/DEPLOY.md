# Launchings 배포 가이드

도메인: **launchings.io**
스택: Next.js 16 + Supabase + Vercel

이 가이드는 비개발자도 단계별로 따라할 수 있도록 작성되었습니다.

---

## Step 1. GitHub 저장소 만들고 코드 올리기

1. [github.com](https://github.com) 에 로그인합니다.
2. 오른쪽 상단 **+** 버튼 → **New repository** 를 클릭합니다.
3. Repository name: `launchings-web` 입력 후 **Create repository** 클릭합니다.
4. 로컬 터미널에서 아래 명령어를 순서대로 실행합니다:

   ```bash
   cd /path/to/launchings-web
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/launchings-web.git
   git push -u origin main
   ```

   > `.env.local` 파일은 `.gitignore`에 포함되어 있어 자동으로 제외됩니다. 시크릿이 커밋되지 않는지 push 전에 `git status`로 확인하세요.

---

## Step 2. Vercel에서 프로젝트 import

1. [vercel.com](https://vercel.com) 에 로그인합니다 (GitHub 계정으로 연동 권장).
2. **Add New** → **Project** 클릭합니다.
3. **Import Git Repository** 에서 `launchings-web` 저장소를 선택합니다.
4. Framework Preset이 **Next.js** 로 자동 감지되는지 확인합니다.
5. (환경변수는 다음 Step에서 추가하므로) 일단 **Deploy** 를 클릭합니다.
   - 첫 배포는 환경변수 없이 로컬 시드 데이터로 동작합니다.

---

## Step 3. 환경변수 등록

1. Vercel 대시보드 → 해당 프로젝트 → **Settings** → **Environment Variables** 로 이동합니다.
2. 아래 변수들을 **Production** 환경에 추가합니다:

   | 변수명 | 값 | 설명 |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxxxxxxxxx.supabase.co` | Supabase 프로젝트 URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | Supabase anon key (공개 가능) |
   | `GOOGLE_SAFE_BROWSING_API_KEY` | (선택) | 앱 등록 시 URL 안전 검사용 |

   > Supabase 값은 **Supabase 대시보드 → Project Settings → API** 에서 복사합니다.
   > `service_role` 키는 절대 입력하지 않습니다.

3. 변수 추가 후 **Redeploy** 를 실행해 새 환경변수를 반영합니다.

---

## Step 4. 도메인 launchings.io 연결

### 4-1. Vercel에 도메인 추가

1. Vercel 프로젝트 → **Settings** → **Domains** 로 이동합니다.
2. `launchings.io` 입력 후 **Add** 클릭합니다.
3. Vercel이 안내하는 DNS 레코드를 메모합니다 (A 레코드 또는 CNAME).

### 4-2. 가비아 DNS 설정

1. [가비아](https://www.gabia.com) 로그인 → **My 가비아** → **도메인 관리** 로 이동합니다.
2. `launchings.io` 도메인 선택 → **DNS 설정** 클릭합니다.
3. Vercel이 안내한 레코드를 입력합니다:

   - **A 레코드** (루트 도메인 `@`):
     ```
     호스트: @
     타입:   A
     값:     76.76.21.21  (Vercel IP — Vercel 대시보드에서 확인)
     TTL:    600
     ```
   - **CNAME 레코드** (`www` 서브도메인):
     ```
     호스트: www
     타입:   CNAME
     값:     cname.vercel-dns.com
     TTL:    600
     ```

4. **저장** 후 DNS 전파를 기다립니다 (보통 10분~1시간, 최대 48시간).
5. Vercel 도메인 설정 화면에서 녹색 체크가 표시되면 완료입니다.

---

## Step 5. Supabase URL 설정 업데이트

배포 도메인이 확정되면 Supabase 인증 설정을 업데이트해야 합니다.

1. [Supabase 대시보드](https://supabase.com/dashboard) → 프로젝트 선택합니다.
2. 왼쪽 메뉴 **Authentication** → **URL Configuration** 클릭합니다.
3. 아래 값을 설정합니다:

   | 항목 | 값 |
   |---|---|
   | **Site URL** | `https://launchings.io` |
   | **Redirect URLs (추가)** | `https://launchings.io/auth/callback` |

4. **Save** 를 클릭합니다.

   > 기존의 `localhost:3000` 항목은 로컬 개발을 위해 남겨두어도 됩니다.

---

## Step 6. Google OAuth 리디렉션 URI 업데이트

Google 소셜 로그인을 사용하는 경우에만 진행합니다.

1. [Google Cloud Console](https://console.cloud.google.com/) → **API 및 서비스** → **사용자 인증 정보** 로 이동합니다.
2. 기존 OAuth 2.0 클라이언트 ID 를 클릭합니다.
3. **승인된 리디렉션 URI** 에 아래 URI를 추가합니다:

   ```
   https://launchings.io/auth/callback
   ```

   > 이미 Supabase의 `https://xxxx.supabase.co/auth/v1/callback` URI가 등록되어 있다면 그대로 둡니다. 런칭스 도메인의 콜백은 Supabase를 거쳐 처리됩니다.

4. **저장** 클릭합니다.

---

## Step 7. Supabase 마이그레이션 적용 확인

DB가 아직 설정되지 않았다면 아래 순서로 적용합니다.

1. Supabase 대시보드 → **SQL Editor** → **New query** 클릭합니다.
2. 아래 파일들을 순서대로 실행합니다:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_reviews.sql`
   - `supabase/migrations/0003_reports_fix.sql`
3. 각 파일 내용을 복사·붙여넣기 후 **RUN** 을 클릭합니다.
4. 하단에 `Success` 가 표시되면 완료입니다.

---

## 배포 완료 확인 체크리스트

배포 후 아래 항목을 브라우저에서 직접 확인하세요.

- [ ] `https://launchings.io` 접속 → 홈페이지 정상 로드
- [ ] `https://launchings.io/sitemap.xml` → 앱/메이커 URL 포함된 XML 표시
- [ ] `https://launchings.io/robots.txt` → `User-agent: *`, `Sitemap: ...` 표시
- [ ] 홈 OG 이미지: `https://launchings.io/opengraph-image` → 1200×630 이미지 표시
- [ ] 앱 상세 OG: 슬랙/카카오톡에 앱 URL 붙여넣기 → 앱 제목이 미리보기에 표시
- [ ] 로그인 버튼 → Google OAuth → 콜백 성공 → 로그인 상태 유지
- [ ] 제품 등록 폼 → 저장 → DB에 반영 확인

---

## Step 8. 레이트리밋 설정 (선택 — Upstash Redis)

레이트리밋은 **키가 없으면 자동으로 비활성화**됩니다. 앱은 키 없이도 완전히 정상 동작합니다.
키를 설정하면 로그인·회원가입·앱 등록 등 주요 액션에 IP 기반 제한이 활성화됩니다.

### 8-1. Upstash Redis 데이터베이스 생성

1. [console.upstash.com](https://console.upstash.com/) 에 접속해 GitHub 또는 Google 계정으로 가입합니다.
2. **Create Database** 를 클릭합니다.
3. 이름(예: `launchings-ratelimit`)을 입력하고 리전은 **ap-northeast-1 (Tokyo)** 를 선택합니다.
4. **Create** 를 클릭합니다.

### 8-2. REST URL / TOKEN 복사

1. 생성된 데이터베이스 페이지 → **REST API** 섹션으로 이동합니다.
2. 아래 두 값을 메모합니다:
   - `UPSTASH_REDIS_REST_URL` — `https://YOUR_DB_NAME.upstash.io` 형태
   - `UPSTASH_REDIS_REST_TOKEN` — `AXxx...` 형태의 긴 토큰

### 8-3. 환경변수 등록

**로컬 개발 (`.env.local`)**:
```
UPSTASH_REDIS_REST_URL=https://YOUR_DB_NAME.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxx...
```

**Vercel 배포**:
1. Vercel 대시보드 → 프로젝트 → **Settings** → **Environment Variables** 로 이동합니다.
2. 위 두 변수를 **Production** (및 필요 시 Preview) 환경에 추가합니다.
3. **Redeploy** 를 실행합니다.

### 적용된 한도

| 액션 | 한도 |
|---|---|
| 로그인 (`signInWithPassword`) | IP당 분당 5회 |
| 회원가입 (`signUpWithPassword`) | IP당 시간당 5회 |
| 비밀번호 재설정 (`requestPasswordReset`) | IP당 시간당 3회 |
| 앱 등록 (`submitApp`) | IP당 시간당 10회 |
| 리뷰 (`submitReview`) | IP당 분당 10회 |
| 신고 (`reportApp`) | IP당 분당 10회 |
| 기능 요청 (`addFeatureRequest`) | IP당 분당 10회 |
| 업보트 (`toggleVote`) | IP당 분당 30회 |
| 기능 투표 (`toggleFeatureVote`) | IP당 분당 30회 |

> 초과 시 `"요청이 너무 많아요. 잠시 후 다시 시도해 주세요."` 메시지가 반환됩니다.
> 키가 없거나 Upstash 연결 오류 시에는 제한 없이 통과합니다 (가용성 우선).

---

## 비용 알림 설정 (권장)

### Vercel
1. 대시보드 → **Settings** → **Billing** → **Spend Management** 에서 월 예산 상한을 설정합니다.

### Supabase
1. 대시보드 → **Settings** → **Billing** 에서 사용량 알림 이메일을 설정합니다.
2. 무료 플랜 한도 (DB 500MB, Storage 1GB, egress 5GB) 근접 시 Pro 업그레이드를 검토합니다.

---

## 관련 문서

- [SUPABASE_SETUP.md](../docs/SUPABASE_SETUP.md) — Supabase 상세 설정
- [GOOGLE_AUTH_SETUP.md](./GOOGLE_AUTH_SETUP.md) — Google OAuth 설정
- [../docs/ARCHITECTURE_v1.md](../docs/ARCHITECTURE_v1.md) — 전체 아키텍처
