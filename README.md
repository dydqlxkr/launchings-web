# Launchings

**한국 0→1 빌더 쇼케이스** — 직접 만든 앱·도구를 올리고 커뮤니티의 검증을 받는 플랫폼.

사이트: [launchings.io](https://launchings.io)

---

## 스택

| 영역 | 기술 |
|---|---|
| 프레임워크 | Next.js 16 (App Router, RSC) |
| 데이터베이스·인증·스토리지 | Supabase (Postgres + Auth + Storage) |
| 호스팅 | Vercel |
| 스타일 | Tailwind CSS v4 |
| i18n | next-intl (한국어 `ko`) |
| 이미지 최적화 | next/image |

---

## 로컬 실행

### 전제 조건

- Node.js 20 이상
- npm

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:3000)
npm run dev
```

Supabase 환경변수가 없으면 로컬 시드 데이터(`data/seed.ts`)로 자동 동작합니다.

### Supabase 연동 (선택)

프로젝트 루트에 `.env.local` 파일을 만들고 아래 내용을 입력합니다:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
# 선택 사항
GOOGLE_SAFE_BROWSING_API_KEY=your_key
```

Supabase 설정 상세는 [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) 를 참고하세요.

---

## 환경변수

| 변수명 | 필수 | 설명 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 선택 | Supabase 프로젝트 URL (없으면 로컬 시드 사용) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 선택 | Supabase anon key |
| `GOOGLE_SAFE_BROWSING_API_KEY` | 선택 | 앱 등록 시 URL 안전 검사 (없으면 건너뜀) |

> `SUPABASE_SERVICE_ROLE_KEY` 는 이 프로젝트에서 사용하지 않습니다. 코드에 절대 입력하지 마세요.

---

## 빌드 및 린트

```bash
npm run build  # 프로덕션 빌드
npm run lint   # ESLint 검사
```

---

## 프로젝트 구조

```
launchings-web/
├── app/
│   ├── [locale]/          # next-intl 라우팅 (ko)
│   │   ├── page.tsx       # 홈 (앱 목록·검색·필터)
│   │   ├── apps/[slug]/   # 앱 상세 + OG 이미지
│   │   ├── makers/[handle]/ # 메이커 프로필
│   │   ├── compare/       # 앱 비교
│   │   ├── submit/        # 제품 등록 (로그인 필요)
│   │   ├── terms/         # 이용약관
│   │   └── privacy/       # 개인정보처리방침
│   ├── auth/callback/     # OAuth 콜백
│   ├── opengraph-image.tsx # 홈 OG 이미지
│   ├── sitemap.ts         # 동적 사이트맵
│   └── robots.ts          # robots.txt
├── components/            # UI 컴포넌트
├── data/                  # 로컬 시드 데이터
├── docs/                  # 설정 가이드
│   ├── DEPLOY.md          # 배포 가이드
│   ├── GOOGLE_AUTH_SETUP.md
│   └── SUPABASE_SETUP.md  # (상위 디렉터리)
├── i18n/                  # next-intl 설정
├── lib/                   # 유틸리티·DB 접근
│   ├── repo/              # Repository 패턴 (Local / Supabase)
│   ├── supabase/          # Supabase 클라이언트
│   └── actions/           # Server Actions
├── messages/              # 번역 파일 (ko.json)
└── supabase/migrations/   # DB 마이그레이션 SQL
```

---

## 배포

배포 단계별 가이드: [docs/DEPLOY.md](docs/DEPLOY.md)

요약:
1. GitHub 저장소에 push
2. Vercel에서 import → Deploy
3. 환경변수 등록 (Supabase URL + anon key)
4. 도메인 `launchings.io` 연결 (Vercel → 가비아 DNS)
5. Supabase Authentication URL 설정 업데이트
6. Supabase 마이그레이션 적용 확인

---

## 라이선스

Private — 무단 배포 금지
