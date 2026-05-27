# Google OAuth 설정 가이드 (비개발자용)

이 가이드를 따라 Google 소셜 로그인을 활성화하세요.
설정 전에도 이메일/비밀번호 로그인은 정상 동작합니다.

---

## Step 1 — Google Cloud Console에서 OAuth 클라이언트 생성

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속합니다.
2. 상단의 프로젝트 선택 드롭다운을 클릭하고 **새 프로젝트**를 만들거나 기존 프로젝트를 선택합니다.
3. 왼쪽 메뉴에서 **API 및 서비스 > OAuth 동의 화면**을 클릭합니다.
4. User Type을 **외부(External)**로 선택하고 **만들기**를 클릭합니다.
5. 앱 이름: `Launchings`, 지원 이메일을 입력하고 **저장 후 계속**을 클릭합니다.
   - 범위(Scope) 추가 없이 기본 이메일·프로필만 사용합니다.
   - 테스트 사용자 단계도 건너뛰고 **요약**에서 **대시보드로 돌아가기**를 클릭합니다.
6. 왼쪽 메뉴에서 **API 및 서비스 > 사용자 인증 정보**를 클릭합니다.
7. 상단의 **+ 사용자 인증 정보 만들기 > OAuth 2.0 클라이언트 ID**를 클릭합니다.
8. 애플리케이션 유형: **웹 애플리케이션**을 선택합니다.
9. 이름은 예시로 `Launchings Web`으로 입력합니다.
10. **승인된 리디렉션 URI** 항목에 아래 URI를 추가합니다:

    ```
    https://emwqtufpwzqzyjkezrne.supabase.co/auth/v1/callback
    ```

11. **만들기**를 클릭합니다.
12. **클라이언트 ID**와 **클라이언트 보안 비밀번호**를 복사해 안전한 곳에 보관합니다.

---

## Step 2 — Supabase 대시보드에서 Google Provider 활성화

1. [Supabase 대시보드](https://supabase.com/dashboard)에 접속합니다.
2. 이 프로젝트(`emwqtufpwzqzyjkezrne`)를 선택합니다.
3. 왼쪽 사이드바에서 **Authentication > Providers**로 이동합니다.
4. 목록에서 **Google**을 찾아 클릭합니다.
5. **Enable Sign in with Google** 토글을 켭니다.
6. Step 1에서 복사한 값을 입력합니다:
   - **Client ID (for OAuth)**: Google에서 발급된 클라이언트 ID
   - **Client Secret**: Google에서 발급된 클라이언트 보안 비밀번호
7. **Save**를 클릭합니다.

---

## Step 3 — Supabase URL 설정 확인

1. 왼쪽 사이드바에서 **Authentication > URL Configuration**으로 이동합니다.
2. **Site URL**: 운영 도메인 (예: `https://launchings.vercel.app`) 또는 로컬 개발 시 `http://localhost:3000`
3. **Redirect URLs**에 아래 두 가지를 추가합니다:
   - `http://localhost:3000/auth/callback` (로컬 개발용)
   - `https://launchings.vercel.app/auth/callback` (운영 도메인, 배포 시 실제 URL로 교체)
4. **Save**를 클릭합니다.

---

## 완료 확인

- `/ko` 페이지에서 **로그인** 버튼을 클릭합니다.
- 모달에 **Google로 계속하기** 버튼이 보입니다.
- 버튼을 클릭하면 Google 계정 선택 화면으로 이동합니다.
- 계정 선택 후 런칭스로 돌아오면 로그인이 완료됩니다.

---

## 주의사항

- Google OAuth 미설정 시에도 이메일/비밀번호 로그인은 정상 동작합니다.
- OAuth 동의 화면이 **테스트 상태**이면 등록된 테스트 계정만 로그인할 수 있습니다. 실제 서비스 오픈 시 **게시(Publish)** 상태로 변경하세요.
- 클라이언트 시크릿은 Supabase 대시보드에만 입력하며 코드에 절대 포함하지 않습니다.
