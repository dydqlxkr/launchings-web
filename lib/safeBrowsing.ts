/**
 * Google Safe Browsing Lookup API v4 유틸.
 * 환경변수 GOOGLE_SAFE_BROWSING_API_KEY가 없으면 graceful skip (경고만 출력).
 * 키가 있고 URL이 위협으로 판정되면 { threat: true, type: string }을 반환.
 *
 * 참고: https://developers.google.com/safe-browsing/v4/lookup-api
 * 키 발급: https://console.cloud.google.com/ > Safe Browsing API 활성화 후 API 키 생성.
 */

export interface SafeBrowsingResult {
  /** URL이 위협으로 판정된 경우 true */
  threat: boolean;
  /** 위협 유형 (MALWARE / SOCIAL_ENGINEERING / UNWANTED_SOFTWARE 등) */
  type?: string;
  /** 검사를 건너뛴 경우 true (키 없음 또는 API 오류) */
  skipped?: boolean;
}

const SAFE_BROWSING_API_URL =
  'https://safebrowsing.googleapis.com/v4/threatMatches:find';

/**
 * 단일 URL을 Google Safe Browsing API로 검사.
 * 키가 없으면 { threat: false, skipped: true }를 반환하고 경고를 출력.
 */
export async function checkUrlSafety(url: string): Promise<SafeBrowsingResult> {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;

  if (!apiKey) {
    console.warn(
      '[SafeBrowsing] GOOGLE_SAFE_BROWSING_API_KEY가 설정되지 않아 URL 검사를 건너뜁니다. ' +
        'Google Cloud Console에서 Safe Browsing API 키를 발급하고 환경변수에 추가하세요.'
    );
    return { threat: false, skipped: true };
  }

  try {
    const body = {
      client: {
        clientId: 'launchings',
        clientVersion: '1.0.0',
      },
      threatInfo: {
        threatTypes: [
          'MALWARE',
          'SOCIAL_ENGINEERING',
          'UNWANTED_SOFTWARE',
          'POTENTIALLY_HARMFUL_APPLICATION',
        ],
        platformTypes: ['ANY_PLATFORM'],
        threatEntryTypes: ['URL'],
        threatEntries: [{ url }],
      },
    };

    const response = await fetch(`${SAFE_BROWSING_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      // 타임아웃: 5초 (AbortSignal)
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.error(
        `[SafeBrowsing] API 응답 오류: ${response.status} ${response.statusText}`
      );
      // API 오류 시 차단하지 않고 통과 (가용성 우선)
      return { threat: false, skipped: true };
    }

    const data = (await response.json()) as {
      matches?: Array<{ threatType: string }>;
    };

    if (data.matches && data.matches.length > 0) {
      const type = data.matches[0].threatType;
      console.warn(`[SafeBrowsing] 위협 URL 감지: ${url} (${type})`);
      return { threat: true, type };
    }

    return { threat: false };
  } catch (err) {
    console.error('[SafeBrowsing] 검사 중 오류 발생:', err);
    // 오류 시 차단하지 않고 통과 (가용성 우선)
    return { threat: false, skipped: true };
  }
}

/**
 * 위협 유형을 한국어로 변환.
 */
export function threatTypeLabel(type: string): string {
  const map: Record<string, string> = {
    MALWARE: '악성코드',
    SOCIAL_ENGINEERING: '피싱/사회공학',
    UNWANTED_SOFTWARE: '원치 않는 소프트웨어',
    POTENTIALLY_HARMFUL_APPLICATION: '잠재적 유해 앱',
  };
  return map[type] ?? '보안 위협';
}
