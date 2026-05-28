/**
 * 요청 단위 getUser() dedupe — React cache()로 감싸서
 * 한 요청 내에서 여러 번 호출해도 실제 auth.getUser()는 1회만 실행됨.
 *
 * ⚠️ proxy.ts의 getUser는 세션 토큰 갱신 목적이므로 이 함수를 쓰지 않는다.
 *    RSC/Server Action에서만 사용.
 */

import { cache } from 'react';
import { createClient } from './server';

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
