import {
  BaseAssetItem,
  CanvasPreset,
  DesignSystemTokens,
  EventInfo,
  SpeakerProfile,
} from '@/types/studio';

function svgToDataUrl(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
}

export const CANVAS_PRESETS: CanvasPreset[] = [
  // SNS 홍보용 (Social Media)
  {
    id: 'sns-ig-square',
    name: '인스타그램 피드 (Square)',
    category: 'sns',
    width: 1080,
    height: 1080,
    aspectLabel: '1:1 (1080×1080)',
    defaultLayout: 'speaker-card',
    description: 'SNS 연사자 소개 카드 및 핵심 세션 홍보용 정방형 규격',
  },
  {
    id: 'sns-ig-portrait',
    name: '인스타그램 포스터 (Portrait)',
    category: 'sns',
    width: 1080,
    height: 1350,
    aspectLabel: '4:5 (1080×1350)',
    defaultLayout: 'main-poster',
    description: '모바일 피드 점유율이 가장 높은 세로형 홍보 포스터 규격',
  },
  {
    id: 'sns-story',
    name: '인스타그램 스토리 / 릴스',
    category: 'sns',
    width: 1080,
    height: 1920,
    aspectLabel: '9:16 (1080×1920)',
    defaultLayout: 'speaker-card',
    description: '스토리 카운트다운 및 모바일 풀스크린 연사자 하이라이트',
  },
  {
    id: 'sns-linkedin',
    name: '링크드인 / X(트위터) 배너',
    category: 'sns',
    width: 1200,
    height: 628,
    aspectLabel: '1.91:1 (1200×628)',
    defaultLayout: 'session-banner',
    description: '외부 공유 링크 오픈그래프(OG) 및 타임라인 세션 홍보 배너',
  },
  {
    id: 'sns-youtube',
    name: '유튜브 썸네일 / 세션 커버',
    category: 'sns',
    width: 1920,
    height: 1080,
    aspectLabel: '16:9 (1920×1080)',
    defaultLayout: 'session-banner',
    description: '세션 발표 장표 대기 화면 및 유튜브 다시보기 썸네일',
  },

  // 인쇄용 (Print - X배너, 팜플렛, 포스터, 네임택)
  {
    id: 'print-xbanner',
    name: '실내용/실외용 X배너 (스탠드)',
    category: 'print',
    width: 1200,
    height: 3600,
    physicalSize: '600 × 1800 mm',
    aspectLabel: '1:3 (600×1800mm)',
    defaultLayout: 'x-banner',
    description: '행사장 입구 및 트랙 안내용 표준 X배너 (사방 아일렛 타공 영역 포함)',
    bleedPx: 30,
    safeMarginPx: 90,
    hasGrommets: true,
  },
  {
    id: 'print-pamphlet-trifold',
    name: '3단 접지 팜플렛 / 리플렛 (A4 가로)',
    category: 'print',
    width: 2480,
    height: 1754,
    physicalSize: '297 × 210 mm (A4 3단)',
    aspectLabel: 'A4 Landscape (3단 접지)',
    defaultLayout: 'pamphlet-trifold',
    description: '행사 개요·타임테이블·연사자 하이라이트가 포함된 3단 접지 인쇄물',
    bleedPx: 36,
    safeMarginPx: 72,
    foldLines: [0.3333, 0.6667],
  },
  {
    id: 'print-poster-a2',
    name: '행사 메인 포스터 (A2/A3 인쇄용)',
    category: 'print',
    width: 1414,
    height: 2000,
    physicalSize: '420 × 594 mm (A2)',
    aspectLabel: '1:√2 (ISO A2/A3)',
    defaultLayout: 'main-poster',
    description: '행사장 벽면 부착용 고해상도 인쇄 포스터 (재단선 포함)',
    bleedPx: 28,
    safeMarginPx: 70,
  },
  {
    id: 'print-badge',
    name: '연사자 / 스태프 네임택 배지',
    category: 'print',
    width: 1000,
    height: 1400,
    physicalSize: '100 × 140 mm',
    aspectLabel: '5:7 (100×140mm)',
    defaultLayout: 'nametag-badge',
    description: '목걸이형 패스 및 연사자 식별 카드 인쇄 규격',
    bleedPx: 24,
    safeMarginPx: 60,
  },
];

export const DESIGN_SYSTEM_PRESETS: DesignSystemTokens[] = [
  {
    id: 'gdg-classic',
    name: 'GDG Classic (4-Color Neo)',
    description: 'Google 4원색과 볼드한 아웃라인을 결합한 GDG 시그니처 디자인 시스템',
    colors: {
      primary: '#4285F4',
      secondary: '#EA4335',
      accent: '#FBBC04',
      success: '#34A853',
      background: '#F8F9FA',
      surface: '#FFFFFF',
      textPrimary: '#202124',
      textSecondary: '#5F6368',
      border: '#202124',
    },
    typography: {
      headingFont: 'Pretendard, Google Sans, sans-serif',
      bodyFont: 'Pretendard, Google Sans, sans-serif',
      monoFont: 'JetBrains Mono, monospace',
      headingWeight: '900',
      letterSpacing: '-0.03em',
    },
    shapes: {
      borderRadius: 28,
      borderWidth: 4,
      shadowStyle: 'brutalist',
      patternStyle: 'dots',
      speakerFrameShape: 'arch',
    },
  },
  {
    id: 'devfest-dark',
    name: 'DevFest Dark Cyber',
    description: '다크 모드 배경 위에 네온 악센트와 그리드가 돋보이는 테크 컨퍼런스 테마',
    colors: {
      primary: '#8AB4F8',
      secondary: '#F28B82',
      accent: '#FDD663',
      success: '#81C995',
      background: '#0F141C',
      surface: '#1A2230',
      textPrimary: '#F1F3F4',
      textSecondary: '#9AA0A6',
      border: '#8AB4F8',
    },
    typography: {
      headingFont: 'Pretendard, Google Sans, sans-serif',
      bodyFont: 'Pretendard, sans-serif',
      monoFont: 'JetBrains Mono, monospace',
      headingWeight: '800',
      letterSpacing: '-0.02em',
    },
    shapes: {
      borderRadius: 24,
      borderWidth: 2,
      shadowStyle: 'glow',
      patternStyle: 'grid',
      speakerFrameShape: 'hexagon',
    },
  },
  {
    id: 'build-with-ai',
    name: 'Build with AI (Gemini Era)',
    description: 'Gemini 딥 인디고 & 스파크 오로라 그라데이션 기반 AI 행사 전용 시스템',
    colors: {
      primary: '#4E6EF2',
      secondary: '#A142F4',
      accent: '#24C1E0',
      success: '#34A853',
      background: '#0B0F29',
      surface: '#161C42',
      textPrimary: '#FFFFFF',
      textSecondary: '#B8C4E8',
      border: '#5E7CE2',
    },
    typography: {
      headingFont: 'Pretendard, Google Sans, sans-serif',
      bodyFont: 'Pretendard, sans-serif',
      monoFont: 'JetBrains Mono, monospace',
      headingWeight: '800',
      letterSpacing: '-0.025em',
    },
    shapes: {
      borderRadius: 32,
      borderWidth: 2,
      shadowStyle: 'glow',
      patternStyle: 'aurora',
      speakerFrameShape: 'circle',
    },
  },
  {
    id: 'io-extended-pastel',
    name: 'I/O Extended Pastel',
    description: '따뜻한 크림 톤 배경과 기하학적 도형이 어우러진 페스티벌 무드 테마',
    colors: {
      primary: '#1A73E8',
      secondary: '#E8710A',
      accent: '#F9AB00',
      success: '#1E8E3E',
      background: '#FFFDF7',
      surface: '#FFF4D6',
      textPrimary: '#1F1F1F',
      textSecondary: '#474747',
      border: '#1F1F1F',
    },
    typography: {
      headingFont: 'Pretendard, Google Sans, sans-serif',
      bodyFont: 'Pretendard, sans-serif',
      monoFont: 'JetBrains Mono, monospace',
      headingWeight: '900',
      letterSpacing: '-0.03em',
    },
    shapes: {
      borderRadius: 36,
      borderWidth: 4,
      shadowStyle: 'brutalist',
      patternStyle: 'geometric',
      speakerFrameShape: 'pill',
    },
  },
  {
    id: 'cloud-summit-clean',
    name: 'Cloud Summit Minimal',
    description: '깔끔한 엔터프라이즈 화이트 & 블루 톤의 정돈된 컨퍼런스 디자인 시스템',
    colors: {
      primary: '#1967D2',
      secondary: '#D93025',
      accent: '#F9AB00',
      success: '#188038',
      background: '#FFFFFF',
      surface: '#F1F5F9',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      border: '#CBD5E1',
    },
    typography: {
      headingFont: 'Pretendard, Google Sans, sans-serif',
      bodyFont: 'Pretendard, sans-serif',
      monoFont: 'JetBrains Mono, monospace',
      headingWeight: '700',
      letterSpacing: '-0.015em',
    },
    shapes: {
      borderRadius: 16,
      borderWidth: 2,
      shadowStyle: 'soft',
      patternStyle: 'none',
      speakerFrameShape: 'rounded',
    },
  },
];

// Built-in SVG portraits for immediate speaker merging demo
const SPEAKER_AVATAR_1 = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <defs>
    <linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#DBEAFE"/>
      <stop offset="100%" stop-color="#93C5FD"/>
    </linearGradient>
    <linearGradient id="suit1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1E3A8A"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bg1)"/>
  <circle cx="480" cy="110" r="70" fill="#60A5FA" opacity="0.35"/>
  <circle cx="110" cy="480" r="90" fill="#3B82F6" opacity="0.25"/>
  <!-- Shoulders / Jacket -->
  <path d="M100 600 C115 440, 200 400, 300 400 C400 400, 485 440, 500 600 Z" fill="url(#suit1)"/>
  <!-- Inner Shirt -->
  <path d="M245 405 L300 500 L355 405 Z" fill="#FFFFFF"/>
  <!-- Neck -->
  <rect x="262" y="330" width="76" height="90" rx="28" fill="#F1C27D"/>
  <!-- Head -->
  <ellipse cx="300" cy="255" rx="92" ry="108" fill="#F5CBA7"/>
  <!-- Hair -->
  <path d="M202 250 C195 160, 245 120, 315 125 C385 130, 412 180, 396 250 C385 200, 355 175, 295 178 C240 180, 215 208, 202 250 Z" fill="#1E293B"/>
  <!-- Glasses -->
  <rect x="234" y="226" width="54" height="38" rx="10" fill="none" stroke="#0F172A" stroke-width="6"/>
  <rect x="312" y="226" width="54" height="38" rx="10" fill="none" stroke="#0F172A" stroke-width="6"/>
  <line x1="288" y1="244" x2="312" y2="244" stroke="#0F172A" stroke-width="6"/>
  <!-- Eyes -->
  <circle cx="261" cy="245" r="6" fill="#0F172A"/>
  <circle cx="339" cy="245" r="6" fill="#0F172A"/>
  <!-- Smile -->
  <path d="M270 302 Q300 326 330 302" fill="none" stroke="#0F172A" stroke-width="6" stroke-linecap="round"/>
  <!-- GDG Lapel Pin -->
  <circle cx="375" cy="485" r="12" fill="#FBBC04"/>
  <circle cx="395" cy="485" r="12" fill="#EA4335"/>
</svg>
`);

const SPEAKER_AVATAR_2 = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <defs>
    <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FCE7F3"/>
      <stop offset="100%" stop-color="#FDE68A"/>
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bg2)"/>
  <circle cx="130" cy="130" r="65" fill="#F472B6" opacity="0.25"/>
  <!-- Long Hair Back -->
  <path d="M180 230 C165 360, 175 490, 210 560 L390 560 C425 490, 435 360, 420 230 Z" fill="#27272A"/>
  <!-- Shoulders / Blazer -->
  <path d="M110 600 C130 450, 210 410, 300 410 C390 410, 470 450, 490 600 Z" fill="#EA4335"/>
  <path d="M250 412 L300 520 L350 412 Z" fill="#FFFBEB"/>
  <!-- Neck -->
  <rect x="266" y="335" width="68" height="88" rx="26" fill="#F5CBA7"/>
  <!-- Head -->
  <ellipse cx="300" cy="255" rx="88" ry="104" fill="#FDEBD0"/>
  <!-- Hair Front -->
  <path d="M206 245 C206 155, 255 125, 305 125 C365 125, 402 165, 396 250 C375 195, 335 170, 285 180 C245 188, 220 212, 206 245 Z" fill="#27272A"/>
  <!-- Eyes -->
  <circle cx="265" cy="248" r="7" fill="#18181B"/>
  <circle cx="335" cy="248" r="7" fill="#18181B"/>
  <!-- Smile -->
  <path d="M273 300 Q300 322 327 300" fill="none" stroke="#E11D48" stroke-width="6" stroke-linecap="round"/>
</svg>
`);

const SPEAKER_AVATAR_3 = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <defs>
    <linearGradient id="bg3" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#DCFCE7"/>
      <stop offset="100%" stop-color="#A7F3D0"/>
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bg3)"/>
  <!-- Hoodie / Casual Tech -->
  <path d="M95 600 C115 445, 200 405, 300 405 C400 405, 485 445, 505 600 Z" fill="#065F46"/>
  <!-- Neck -->
  <rect x="262" y="332" width="76" height="88" rx="28" fill="#E5B887"/>
  <!-- Head -->
  <ellipse cx="300" cy="255" rx="90" ry="106" fill="#F0C8A0"/>
  <!-- Curly/Wavy Hair -->
  <path d="M205 235 C195 150, 250 115, 300 118 C355 115, 405 155, 395 235 C375 185, 340 168, 300 168 C260 168, 225 185, 205 235 Z" fill="#111827"/>
  <!-- Eyes -->
  <circle cx="264" cy="248" r="6.5" fill="#111827"/>
  <circle cx="336" cy="248" r="6.5" fill="#111827"/>
  <!-- Smile -->
  <path d="M272 302 Q300 324 328 302" fill="none" stroke="#111827" stroke-width="6" stroke-linecap="round"/>
</svg>
`);

export const DEFAULT_SPEAKERS: SpeakerProfile[] = [
  {
    id: 'spk-1',
    name: '김도윤 (Doyun Kim)',
    role: 'Google Developer Expert · AI/ML',
    company: 'Cloud Native Lab',
    topic: 'Vertex AI와 Gemini 2.5로 구축하는 프로덕션 멀티 에이전트 아키텍처',
    track: 'Track A · AI & Cloud',
    dateTime: '2026. 11. 14 (토) 14:00 - 14:50',
    venue: '코엑스 그랜드볼룸 101호',
    bio: '대규모 생성형 AI 파이프라인과 GCP Cloud Run 기반 서버리스 백엔드 아키텍처를 설계하고 있습니다.',
    tags: ['#VertexAI', '#Gemini', '#CloudRun', '#MultiAgent'],
    photoDataUrl: SPEAKER_AVATAR_1,
    photoScale: 1,
    photoOffsetX: 0,
    photoOffsetY: 0,
    photoFilter: 'none',
    aiAuraEnabled: true,
  },
  {
    id: 'spk-2',
    name: '박서연 (Seoyeon Park)',
    role: 'Staff Frontend Architect',
    company: 'NextGen Studio',
    topic: '디자인 시스템 토큰 자동화와 웹 캔버스 렌더링 최적화 실전 가이드',
    track: 'Track B · Web & Design System',
    dateTime: '2026. 11. 14 (토) 15:10 - 16:00',
    venue: '코엑스 그랜드볼룸 102호',
    bio: '피그마 디자인 토큰과 프로덕션 코드 사이의 간극을 줄이는 디자인 엔지니어링을 연구합니다.',
    tags: ['#DesignSystem', '#WebCanvas', '#SVG', '#NextJS'],
    photoDataUrl: SPEAKER_AVATAR_2,
    photoScale: 1,
    photoOffsetX: 0,
    photoOffsetY: 0,
    photoFilter: 'none',
    aiAuraEnabled: false,
  },
  {
    id: 'spk-3',
    name: '이준혁 (Junhyuk Lee)',
    role: 'Principal Android Engineer',
    company: 'Mobility Tech',
    topic: 'Kotlin Multiplatform과 온디바이스 Gemini Nano 통합 전략',
    track: 'Track C · Mobile & On-Device AI',
    dateTime: '2026. 11. 14 (토) 16:20 - 17:10',
    venue: '코엑스 그랜드볼룸 103호',
    bio: '안드로이드 및 크로스플랫폼 환경에서 빠르고 안전한 온디바이스 AI 경험을 구축합니다.',
    tags: ['#Android', '#KMP', '#GeminiNano', '#Mobile'],
    photoDataUrl: SPEAKER_AVATAR_3,
    photoScale: 1,
    photoOffsetX: 0,
    photoOffsetY: 0,
    photoFilter: 'none',
    aiAuraEnabled: false,
  },
];

// Built-in Base Assets (GDG Logo, DevFest Sticker, Geometric Frame)
const BUILTIN_GDG_LOGO = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
  <g transform="translate(10, 12)">
    <path d="M32 8 L8 28 L32 48" fill="none" stroke="#EA4335" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M48 8 L72 28 L48 48" fill="none" stroke="#4285F4" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="40" cy="28" r="6" fill="#FBBC04"/>
  </g>
  <text x="98" y="48" font-family="Pretendard, Google Sans, sans-serif" font-weight="900" font-size="32" fill="#202124">GDG</text>
</svg>
`);

const BUILTIN_DEVFEST_STICKER = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 90" width="220" height="90">
  <rect x="6" y="6" width="204" height="74" rx="37" fill="#FBBC04" stroke="#202124" stroke-width="5"/>
  <circle cx="42" cy="43" r="14" fill="#EA4335" stroke="#202124" stroke-width="3"/>
  <text x="68" y="51" font-family="JetBrains Mono, monospace" font-weight="800" font-size="22" fill="#202124">DEVFEST '26</text>
</svg>
`);

const BUILTIN_SPONSOR_BAR = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 70" width="500" height="70">
  <rect x="2" y="2" width="496" height="66" rx="16" fill="#FFFFFF" fill-opacity="0.9" stroke="#202124" stroke-width="3"/>
  <text x="24" y="41" font-family="Pretendard, sans-serif" font-weight="700" font-size="16" fill="#5F6368">PARTNERS</text>
  <circle cx="145" cy="35" r="8" fill="#4285F4"/>
  <circle cx="163" cy="35" r="8" fill="#EA4335"/>
  <circle cx="181" cy="35" r="8" fill="#FBBC04"/>
  <circle cx="199" cy="35" r="8" fill="#34A853"/>
  <text x="220" y="41" font-family="Pretendard, sans-serif" font-weight="800" font-size="18" fill="#202124">Google for Developers · Cloud</text>
</svg>
`);

export const DEFAULT_BASE_ASSETS: BaseAssetItem[] = [
  {
    id: 'asset-gdg-logo',
    name: 'GDG 공식 브래킷 로고 (Built-in)',
    type: 'logo',
    dataUrl: BUILTIN_GDG_LOGO,
    opacity: 1,
    scale: 1,
    x: 8,
    y: 7,
    visible: true,
    builtIn: true,
  },
  {
    id: 'asset-devfest-sticker',
    name: 'DevFest 2026 뱃지 스티커',
    type: 'sticker',
    dataUrl: BUILTIN_DEVFEST_STICKER,
    opacity: 1,
    scale: 0.9,
    x: 78,
    y: 8,
    visible: true,
    builtIn: true,
  },
  {
    id: 'asset-sponsor-bar',
    name: '하단 파트너/스폰서 바',
    type: 'sponsor',
    dataUrl: BUILTIN_SPONSOR_BAR,
    opacity: 0.95,
    scale: 0.85,
    x: 50,
    y: 93,
    visible: false,
    builtIn: true,
  },
];

export const DEFAULT_EVENT_INFO: EventInfo = {
  eventName: 'GDG DevFest Seoul 2026',
  subtitle: 'Build with AI, Cloud & Open Web Community',
  chapterName: 'GDG Seoul · Korea',
  date: '2026. 11. 14 (SAT) 10:00 - 18:00',
  location: 'COEX Grand Ballroom, Seoul',
  ctaText: '지금 참가 신청하기 · gdg.community.dev',
  websiteUrl: 'https://gdg.community.dev',
  hashtag: '#GDG #DevFest2026 #BuildWithAI',
  pamphletIntro:
    '개발자 커뮤니티가 함께 만드는 연례 최대 기술 페스티벌! AI, Cloud, Android, Web 트랙의 실전 세션을 만나보세요.',
  schedule: [
    {
      time: '10:30 - 11:20',
      title: 'Keynote: 에이전틱 AI 시대의 개발자 생태계',
      speaker: 'GDG Organizers & Google Developer Relations',
      track: 'Main Hall',
    },
    {
      time: '14:00 - 14:50',
      title: 'Vertex AI와 Gemini 2.5로 구축하는 프로덕션 멀티 에이전트',
      speaker: '김도윤 · Cloud Native Lab',
      track: 'Track A (AI/Cloud)',
    },
    {
      time: '15:10 - 16:00',
      title: '디자인 시스템 토큰 자동화와 웹 캔버스 렌더링 최적화',
      speaker: '박서연 · NextGen Studio',
      track: 'Track B (Web/Design)',
    },
    {
      time: '16:20 - 17:10',
      title: 'Kotlin Multiplatform과 온디바이스 Gemini Nano 통합 전략',
      speaker: '이준혁 · Mobility Tech',
      track: 'Track C (Mobile)',
    },
  ],
};
