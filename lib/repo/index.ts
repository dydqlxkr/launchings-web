/**
 * Repository 팩토리.
 *
 * NEXT_PUBLIC_SUPABASE_URL이 설정돼 있으면 SupabaseRepo,
 * 없으면 LocalRepo(data/seed.ts)로 폴백.
 *
 * Phase 2: Supabase 환경변수가 설정된 경우 자동으로 Supabase 구현체 사용.
 */

import type { IRepo } from './interface';
import localRepo from './local';
import supabaseRepo from './supabase';

export function getRepo(): IRepo {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return supabaseRepo;
  }
  return localRepo;
}

// 편의 재export
export type { IRepo } from './interface';
