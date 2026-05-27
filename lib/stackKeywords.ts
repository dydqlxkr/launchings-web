/**
 * 기술 스택 키워드 사전.
 * canonical: 표준 표기 (스택 태그로 저장될 값)
 * aliases: 감지용 별칭 (대소문자 무시, 단어 경계 매칭)
 */
export interface StackKeyword {
  canonical: string;
  aliases: string[];
}

export const STACK_KEYWORDS: StackKeyword[] = [
  // 프론트엔드
  { canonical: 'React', aliases: ['react', '리액트'] },
  { canonical: 'Next.js', aliases: ['nextjs', 'next.js', 'next js', '넥스트', '넥스트js'] },
  { canonical: 'Vue', aliases: ['vue', 'vuejs', 'vue.js', '뷰'] },
  { canonical: 'Svelte', aliases: ['svelte', 'sveltekit', '스벨트'] },
  { canonical: 'Angular', aliases: ['angular', '앵귤러'] },
  { canonical: 'Tailwind', aliases: ['tailwind', 'tailwindcss', '테일윈드'] },
  { canonical: 'TypeScript', aliases: ['typescript', '타입스크립트', 'ts'] },
  { canonical: 'JavaScript', aliases: ['javascript', '자바스크립트', 'js', 'vanilla js'] },

  // 모바일
  { canonical: 'Flutter', aliases: ['flutter', '플러터'] },
  { canonical: 'React Native', aliases: ['react native', 'reactnative', '리액트 네이티브'] },
  { canonical: 'Swift', aliases: ['swift', '스위프트'] },
  { canonical: 'Kotlin', aliases: ['kotlin', '코틀린'] },
  { canonical: 'Expo', aliases: ['expo', '엑스포'] },

  // 백엔드 / DB
  { canonical: 'Node.js', aliases: ['node', 'nodejs', 'node.js', '노드', '노드js'] },
  { canonical: 'Python', aliases: ['python', '파이썬'] },
  { canonical: 'Django', aliases: ['django', '장고'] },
  { canonical: 'Flask', aliases: ['flask', '플라스크'] },
  { canonical: 'FastAPI', aliases: ['fastapi', 'fast api', '패스트api'] },
  { canonical: 'Supabase', aliases: ['supabase', '수파베이스'] },
  { canonical: 'Firebase', aliases: ['firebase', '파이어베이스'] },
  { canonical: 'PostgreSQL', aliases: ['postgresql', 'postgres', '포스트그레스', 'pg'] },
  { canonical: 'MongoDB', aliases: ['mongodb', 'mongo', '몽고db'] },
  { canonical: 'Spring', aliases: ['spring', 'spring boot', 'springboot', '스프링'] },

  // AI
  { canonical: 'OpenAI', aliases: ['openai', 'gpt', 'gpt-4', 'gpt4', 'chatgpt', '챗gpt', '챗GPT', 'gpt-3.5'] },
  { canonical: 'Claude', aliases: ['claude', '클로드', 'anthropic'] },
  { canonical: 'Gemini', aliases: ['gemini', '제미나이'] },
  { canonical: 'LLM', aliases: ['llm', '대형 언어 모델', '언어모델'] },
  { canonical: 'Whisper', aliases: ['whisper', '위스퍼'] },
  { canonical: 'Stable Diffusion', aliases: ['stable diffusion', 'stablediffusion', 'sd', '스테이블 디퓨전'] },
  { canonical: 'LangChain', aliases: ['langchain', 'lang chain', '랭체인'] },

  // 인프라 / 기타
  { canonical: 'Vercel', aliases: ['vercel', '버셀'] },
  { canonical: 'Cloudflare', aliases: ['cloudflare', 'cloudflare workers', '클라우드플레어'] },
  { canonical: 'AWS', aliases: ['aws', 'amazon web services', '아마존'] },
  { canonical: 'Docker', aliases: ['docker', '도커'] },
  { canonical: 'Canvas', aliases: ['canvas', 'html canvas', 'canvas api'] },
  { canonical: 'WebGL', aliases: ['webgl', 'web gl'] },
  { canonical: 'Three.js', aliases: ['three.js', 'threejs', 'three js'] },
];

/**
 * 텍스트에서 감지된 스택 canonical 목록을 반환한다.
 * - 대소문자 무시
 * - 단어 경계(\b)로 오탐 방지 (영문 alias에만 적용, 한글은 포함 검사)
 * - 이미 추가된 태그(existing)는 제외
 */
export function detectStacks(text: string, existing: string[]): string[] {
  if (!text.trim()) return [];

  const lower = text.toLowerCase();
  const existingLower = existing.map((s) => s.toLowerCase());
  const detected: string[] = [];

  for (const kw of STACK_KEYWORDS) {
    if (existingLower.includes(kw.canonical.toLowerCase())) continue;
    if (detected.map((d) => d.toLowerCase()).includes(kw.canonical.toLowerCase())) continue;

    let found = false;
    for (const alias of kw.aliases) {
      const aliasLower = alias.toLowerCase();
      // 한글이 포함된 alias: 단순 포함 검사
      if (/[가-힣]/.test(aliasLower)) {
        if (lower.includes(aliasLower)) {
          found = true;
          break;
        }
      } else {
        // 영문/숫자 alias: 단어 경계(\b) 매칭
        // '.' '+' 같은 특수문자를 escape
        const escaped = aliasLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'i');
        if (pattern.test(text)) {
          found = true;
          break;
        }
      }
    }

    if (found) {
      detected.push(kw.canonical);
    }
  }

  return detected;
}
