import { redirect } from 'next/navigation';

// 루트 `/`는 next-intl 미들웨어가 `/ko`로 리디렉션하지만
// 정적 빌드 보험용으로 명시적 redirect 추가.
export default function RootPage() {
  redirect('/ko');
}
