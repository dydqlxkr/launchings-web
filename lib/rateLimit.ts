/**
 * Upstash Redis 기반 레이트리밋 유틸.
 *
 * 환경변수 UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN이
 * 모두 있을 때만 Upstash 클라이언트를 생성한다.
 * 없으면 모든 검사를 통과(graceful)하고, 최초 1회 콘솔 경고만 출력한다.
 *
 * 발급: https://console.upstash.com/ > Redis > Create Database > REST API
 *
 * 사용 예)
 *   const result = await checkRateLimit('signIn', { limit: 5, windowSec: 60 });
 *   if (!result.ok) return { error: '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.' };
 */

import { headers } from 'next/headers';

// ─────────────────────────────────────────────────────────────────────────────
// 타입 (Upstash 패키지 타입을 직접 import하면 빌드 의존이 생기므로 최소 인터페이스만 정의)
// ─────────────────────────────────────────────────────────────────────────────
interface RateLimitResponse {
  success: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// 환경변수 확인 및 클라이언트 초기화
// ─────────────────────────────────────────────────────────────────────────────
let _warned = false;

function isConfigured(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

// 실제 클라이언트는 요청 시점에 lazy 생성 (빌드 시 env 없어도 안전)
let _limiterCache: Map<string, unknown> | null = null;

function getLimiterCache(): Map<string, unknown> {
  if (!_limiterCache) _limiterCache = new Map();
  return _limiterCache;
}

async function getLimiter(
  action: string,
  limit: number,
  windowSec: number
): Promise<{ limit: (identifier: string) => Promise<RateLimitResponse> } | null> {
  if (!isConfigured()) {
    if (!_warned) {
      _warned = true;
      console.warn(
        '[RateLimit] UPSTASH_REDIS_REST_URL 또는 UPSTASH_REDIS_REST_TOKEN이 ' +
          '설정되지 않아 레이트리밋을 비활성화합니다. ' +
          'Upstash 콘솔(https://console.upstash.com/)에서 Redis DB를 만들고 ' +
          'REST URL / TOKEN을 환경변수에 추가하세요.'
      );
    }
    return null;
  }

  const cacheKey = `${action}:${limit}:${windowSec}`;
  const cache = getLimiterCache();

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey) as { limit: (id: string) => Promise<RateLimitResponse> };
  }

  // 동적 import — 빌드 시 env 없는 경우에도 모듈 자체는 로드되지만 인스턴스화 없이 통과
  const { Redis } = await import('@upstash/redis');
  const { Ratelimit } = await import('@upstash/ratelimit');

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
    prefix: `rl:${action}`,
    analytics: false,
  });

  cache.set(cacheKey, limiter);
  return limiter as { limit: (id: string) => Promise<RateLimitResponse> };
}

// ─────────────────────────────────────────────────────────────────────────────
// IP 추출 헬퍼
// ─────────────────────────────────────────────────────────────────────────────
async function getClientIp(): Promise<string> {
  try {
    const headersList = await headers();
    const forwarded = headersList.get('x-forwarded-for');
    if (forwarded) {
      // "IP1, IP2, ..." 형태에서 첫 번째 IP만 취함
      const first = forwarded.split(',')[0].trim();
      if (first) return first;
    }
    const realIp = headersList.get('x-real-ip');
    if (realIp) return realIp.trim();
  } catch {
    // Server Action 밖에서 호출된 경우 등 방어
  }
  return 'anonymous';
}

// ─────────────────────────────────────────────────────────────────────────────
// 공개 API
// ─────────────────────────────────────────────────────────────────────────────

export interface RateLimitResult {
  ok: boolean;
}

/**
 * 범용 레이트리밋 검사.
 * @param action  식별자 prefix (e.g. 'signIn', 'submitApp')
 * @param opts    limit: 허용 횟수, windowSec: 윈도우(초)
 */
export async function checkRateLimit(
  action: string,
  opts: { limit: number; windowSec: number }
): Promise<RateLimitResult> {
  const limiter = await getLimiter(action, opts.limit, opts.windowSec);
  if (!limiter) return { ok: true }; // graceful: 키 없으면 통과

  const ip = await getClientIp();
  const identifier = `${action}:${ip}`;

  try {
    const { success } = await limiter.limit(identifier);
    return { ok: success };
  } catch (err) {
    // Upstash 연결 오류 시 차단하지 않고 통과 (가용성 우선)
    console.error('[RateLimit] 검사 중 오류 발생:', err);
    return { ok: true };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 사전 정의 limiter 헬퍼 (각 Action에서 편리하게 호출)
// ─────────────────────────────────────────────────────────────────────────────

/** 로그인: IP당 분당 5회 */
export function rateLimitSignIn(): Promise<RateLimitResult> {
  return checkRateLimit('signIn', { limit: 5, windowSec: 60 });
}

/** 회원가입: IP당 시간당 5회 */
export function rateLimitSignUp(): Promise<RateLimitResult> {
  return checkRateLimit('signUp', { limit: 5, windowSec: 3600 });
}

/** 비밀번호 재설정 요청: IP당 시간당 3회 */
export function rateLimitPasswordReset(): Promise<RateLimitResult> {
  return checkRateLimit('passwordReset', { limit: 3, windowSec: 3600 });
}

/** 앱 등록: IP당 시간당 10회 */
export function rateLimitSubmitApp(): Promise<RateLimitResult> {
  return checkRateLimit('submitApp', { limit: 10, windowSec: 3600 });
}

/** 리뷰·신고·기능요청: IP당 분당 10회 */
export function rateLimitInteraction(action: string): Promise<RateLimitResult> {
  return checkRateLimit(action, { limit: 10, windowSec: 60 });
}

/** 업보트·기능투표: IP당 분당 30회 (느슨) */
export function rateLimitVote(action: string): Promise<RateLimitResult> {
  return checkRateLimit(action, { limit: 30, windowSec: 60 });
}

/** 공통 초과 에러 메시지 */
export const RATE_LIMIT_ERROR = '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.';
