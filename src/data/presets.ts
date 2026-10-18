import {
  DevFestColorway,
  DevFestEventMeta,
  SizePreset,
  SpeakerSessionItem,
} from '@/types/studio';

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

export const SAMPLE_PORTRAITS: string[] = [
  svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">
      <rect width="800" height="800" fill="#d9e7fd"/>
      <circle cx="650" cy="160" r="180" fill="#c3ecf6"/>
      <rect x="-40" y="520" width="360" height="320" rx="40" fill="#ffe7a5"/>
      <!-- Stylized studio portrait placeholder -->
      <path d="M180 800 C195 575 300 490 400 490 C500 490 605 575 620 800 Z" fill="#1e1e1e"/>
      <path d="M310 505 L400 630 L490 505 Z" fill="#4285f4"/>
      <rect x="358" y="395" width="84" height="125" rx="36" fill="#f1c29b"/>
      <ellipse cx="400" cy="295" rx="115" ry="132" fill="#f5cba7"/>
      <!-- Hair -->
      <path d="M282 285 C275 170 350 132 425 142 C505 150 532 215 516 292 C495 235 452 212 390 215 C332 218 302 248 282 285 Z" fill="#1e1e1e"/>
      <!-- Glasses -->
      <rect x="326" y="272" width="60" height="42" rx="10" fill="none" stroke="#1e1e1e" stroke-width="8"/>
      <rect x="414" y="272" width="60" height="42" rx="10" fill="none" stroke="#1e1e1e" stroke-width="8"/>
      <line x1="386" y1="292" x2="414" y2="292" stroke="#1e1e1e" stroke-width="8"/>
      <!-- Smile -->
      <path d="M372 356 Q400 378 428 356" fill="none" stroke="#1e1e1e" stroke-width="7" stroke-linecap="round"/>
      <!-- Mic lapel -->
      <circle cx="452" cy="590" r="10" fill="#f9ab00" stroke="#1e1e1e" stroke-width="4"/>
    </svg>
  `),
  svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">
      <rect width="800" height="800" fill="#fde2e2"/>
      <circle cx="150" cy="170" r="160" fill="#ffe7a5"/>
      <!-- Shoulders & Jacket -->
      <path d="M170 800 C190 570 295 495 400 495 C505 495 610 570 630 800 Z" fill="#34a853"/>
      <path d="M290 515 L400 800 L510 515 Z" fill="#ffffff"/>
      <!-- Long Hair Back -->
      <path d="M258 270 C240 430 265 555 290 600 L510 600 C535 555 560 430 542 270 Z" fill="#1e1e1e"/>
      <rect x="360" y="395" width="80" height="125" rx="35" fill="#f3c6a5"/>
      <ellipse cx="400" cy="292" rx="110" ry="128" fill="#f7d1b5"/>
      <!-- Hair Bangs -->
      <path d="M275 295 C280 165 360 140 415 145 C490 150 530 205 524 300 C488 242 446 210 385 215 C330 220 295 255 275 295 Z" fill="#1e1e1e"/>
      <circle cx="358" cy="292" r="9" fill="#1e1e1e"/>
      <circle cx="442" cy="292" r="9" fill="#1e1e1e"/>
      <path d="M372 352 Q400 376 428 352" fill="none" stroke="#ea4335" stroke-width="8" stroke-linecap="round"/>
    </svg>
  `),
  svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">
      <rect width="800" height="800" fill="#ccf6c5"/>
      <circle cx="660" cy="640" r="190" fill="#c3ecf6"/>
      <path d="M175 800 C195 575 295 495 400 495 C505 495 605 575 625 800 Z" fill="#4285f4"/>
      <rect x="358" y="395" width="84" height="120" rx="38" fill="#e6b28a"/>
      <ellipse cx="400" cy="295" rx="114" ry="130" fill="#ecc09c"/>
      <path d="M286 270 C292 175 352 145 405 145 C468 145 514 185 514 270 C480 228 438 212 398 212 C350 212 312 232 286 270 Z" fill="#1e1e1e"/>
      <circle cx="358" cy="292" r="9" fill="#1e1e1e"/>
      <circle cx="442" cy="292" r="9" fill="#1e1e1e"/>
      <path d="M370 355 Q400 376 430 355" fill="none" stroke="#1e1e1e" stroke-width="7" stroke-linecap="round"/>
    </svg>
  `),
  svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">
      <rect width="800" height="800" fill="#ffe7a5"/>
      <circle cx="160" cy="620" r="175" fill="#f8d8d8"/>
      <path d="M180 800 C198 575 300 495 400 495 C500 495 602 575 620 800 Z" fill="#1e1e1e"/>
      <rect x="358" y="395" width="84" height="120" rx="38" fill="#f0c09c"/>
      <ellipse cx="400" cy="295" rx="112" ry="128" fill="#f5cca8"/>
      <path d="M284 282 C284 170 355 142 415 145 C485 148 522 198 515 282 C482 235 440 215 392 215 C340 215 305 245 284 282 Z" fill="#1e1e1e"/>
      <circle cx="358" cy="292" r="9" fill="#1e1e1e"/>
      <circle cx="442" cy="292" r="9" fill="#1e1e1e"/>
      <path d="M372 354 Q400 375 428 354" fill="none" stroke="#1e1e1e" stroke-width="7" stroke-linecap="round"/>
    </svg>
  `),
];

/**
 * Official DevFest 2026 Brand Guide Colorways
 * Exact hex values from the DevFest 2026 Visual Identity slides:
 * - Off-White: #f0f0f0, Black 02: #1e1e1e
 * - Core: #4285f4, #34a853, #f9ab00, #ea4335
 * - Halftones: #57caff, #5cdb6d, #ffd427, #ff7daf
 * - Pastels: #c3ecf6, #ccf6c5, #ffe7a5, #f8d8d8
 */
export const DEVFEST_COLORWAYS: DevFestColorway[] = [
  {
    id: 'offwhite-classic',
    name: 'Off-White Classic (#f0f0f0)',
    description: '공식 가이드 기본 오프화이트 배경 + 블루 브래킷 + 옐로우/그린 필',
    canvasBg: '#f0f0f0',
    cardSurface: '#ffffff',
    ink: '#1e1e1e',
    mutedInk: '#595959',
    bracketColor: '#4285f4',
    locationPillBg: '#5cdb6d',
    locationPillText: '#1e1e1e',
    yearPillBg: '#ffd427',
    yearPillText: '#1e1e1e',
    slashFill: '#ffd427',
    caterpillarFill: '#57caff',
    scallopFill: '#ff7daf',
    timeAccent: '#f9ab00',
  },
  {
    id: 'pastel-blue',
    name: 'Pastel Blue (#c3ecf6)',
    description: '파스텔 블루 배경 + 하프톤 그린 알약 + 옐로우 슬래시 (공식 연사/타임테이블)',
    canvasBg: '#c3ecf6',
    cardSurface: '#ffffff',
    ink: '#1e1e1e',
    mutedInk: '#595959',
    bracketColor: '#4285f4',
    locationPillBg: '#5cdb6d',
    locationPillText: '#1e1e1e',
    yearPillBg: '#ffd427',
    yearPillText: '#1e1e1e',
    slashFill: '#ffd427',
    caterpillarFill: '#5cdb6d',
    scallopFill: '#ff7daf',
    timeAccent: '#4285f4',
  },
  {
    id: 'pastel-yellow',
    name: 'Pastel Yellow (#ffe7a5)',
    description: '파스텔 옐로우 배경 + 하프톤 핑크 알약 + 그린 포인트 (공식 Meterboard/SNS)',
    canvasBg: '#ffe7a5',
    cardSurface: '#ffffff',
    ink: '#1e1e1e',
    mutedInk: '#595959',
    bracketColor: '#4285f4',
    locationPillBg: '#ff7daf',
    locationPillText: '#1e1e1e',
    yearPillBg: '#5cdb6d',
    yearPillText: '#1e1e1e',
    slashFill: '#57caff',
    caterpillarFill: '#ff7daf',
    scallopFill: '#5cdb6d',
    timeAccent: '#ea4335',
  },
  {
    id: 'pastel-green',
    name: 'Pastel Green (#ccf6c5)',
    description: '파스텔 그린 배경 + 하프톤 옐로우 알약 + 블루/핑크 포인트',
    canvasBg: '#ccf6c5',
    cardSurface: '#ffffff',
    ink: '#1e1e1e',
    mutedInk: '#595959',
    bracketColor: '#34a853',
    locationPillBg: '#ffd427',
    locationPillText: '#1e1e1e',
    yearPillBg: '#57caff',
    yearPillText: '#1e1e1e',
    slashFill: '#ff7daf',
    caterpillarFill: '#ffd427',
    scallopFill: '#57caff',
    timeAccent: '#34a853',
  },
  {
    id: 'pastel-pink',
    name: 'Pastel Pink (#f8d8d8)',
    description: '파스텔 핑크 배경 + 하프톤 블루 알약 + 옐로우 슬래시',
    canvasBg: '#f8d8d8',
    cardSurface: '#ffffff',
    ink: '#1e1e1e',
    mutedInk: '#595959',
    bracketColor: '#ea4335',
    locationPillBg: '#57caff',
    locationPillText: '#1e1e1e',
    yearPillBg: '#ffd427',
    yearPillText: '#1e1e1e',
    slashFill: '#ffd427',
    caterpillarFill: '#5cdb6d',
    scallopFill: '#ffd427',
    timeAccent: '#ea4335',
  },
  {
    id: 'dark-charcoal',
    name: 'Black 02 Dark (#1e1e1e)',
    description: '공식 가이드 Black 02 다크 프레임 + 화이트 스텝 카드 + 하프톤 액센트',
    canvasBg: '#1e1e1e',
    cardSurface: '#ffffff',
    ink: '#1e1e1e',
    mutedInk: '#595959',
    bracketColor: '#57caff',
    locationPillBg: '#ffd427',
    locationPillText: '#1e1e1e',
    yearPillBg: '#5cdb6d',
    yearPillText: '#1e1e1e',
    slashFill: '#ff7daf',
    caterpillarFill: '#5cdb6d',
    scallopFill: '#ff7daf',
    timeAccent: '#f9ab00',
  },
];

export const SIZE_PRESETS: SizePreset[] = [
  {
    id: 'custom-800x1000',
    name: 'SNS 홍보 카드 (800 × 1000)',
    usageLabel: '4:5 SNS 카드 기본',
    category: 'sns',
    width: 800,
    height: 1000,
    aspectLabel: '4:5',
    recommendedMode: 'speaker',
    recommendedSpeakerVariant: 'devfest-bracket',
    recommendedTimetableVariant: 'agenda-digital',
  },
  {
    id: 'sns-square-1080',
    name: 'Instagram 정방형 (1080 × 1080)',
    usageLabel: '1:1 피드',
    category: 'sns',
    width: 1080,
    height: 1080,
    aspectLabel: '1:1',
    recommendedMode: 'speaker',
    recommendedSpeakerVariant: 'devfest-bracket',
    recommendedTimetableVariant: 'agenda-digital',
  },
  {
    id: 'sns-portrait-1080x1350',
    name: 'Instagram 세로형 (1080 × 1350)',
    usageLabel: '4:5 고해상도 피드',
    category: 'sns',
    width: 1080,
    height: 1350,
    aspectLabel: '4:5',
    recommendedMode: 'speaker',
    recommendedSpeakerVariant: 'track-notch',
    recommendedTimetableVariant: 'agenda-digital',
  },
  {
    id: 'sns-landscape-1920x1080',
    name: 'SNS 와이드 / 세션 배너 (1920 × 1080)',
    usageLabel: '16:9 가로형 홍보/시간표',
    category: 'sns',
    width: 1920,
    height: 1080,
    aspectLabel: '16:9',
    recommendedMode: 'timetable',
    recommendedSpeakerVariant: 'track-notch',
    recommendedTimetableVariant: 'agenda-digital',
  },
  {
    id: 'sns-story-1080x1920',
    name: 'SNS 스토리 / 릴스 (1080 × 1920)',
    usageLabel: '9:16 모바일 풀스크린',
    category: 'sns',
    width: 1080,
    height: 1920,
    aspectLabel: '9:16',
    recommendedMode: 'timetable',
    recommendedSpeakerVariant: 'devfest-bracket',
    recommendedTimetableVariant: 'agenda-digital',
  },
  {
    id: 'xbanner-1200x3600',
    name: '실내용 X배너 / 스탠딩 배너 (1200 × 3600)',
    usageLabel: '600×1800mm (1:3 인쇄비율)',
    category: 'xbanner',
    width: 1200,
    height: 3600,
    aspectLabel: '1:3',
    recommendedMode: 'timetable',
    recommendedSpeakerVariant: 'xbanner-meterboard',
    recommendedTimetableVariant: 'agenda-xbanner',
  },
  {
    id: 'print-a4-1600x2263',
    name: 'A4 인쇄용 시간표 / 포스터 (1600 × 2263)',
    usageLabel: 'A4 세로 규격 (1:1.414)',
    category: 'print',
    width: 1600,
    height: 2263,
    aspectLabel: 'A4',
    recommendedMode: 'timetable',
    recommendedSpeakerVariant: 'devfest-bracket',
    recommendedTimetableVariant: 'agenda-print',
  },
];

export const INITIAL_SPEAKER_SESSIONS: SpeakerSessionItem[] = [
  {
    id: 'spk-1',
    name: '김지훈',
    affiliation: 'Google Cloud Korea',
    role: 'Staff Customer Engineer',
    title: 'Gemini 2.5와 Vertex AI로 구축하는 프로덕션 멀티 에이전트 아키텍처',
    description:
      '실제 엔터프라이즈 환경에서 컨텍스트 압축, 도구 호출 안정성, 레이턴시 최적화를 달성한 설계 패턴을 공유합니다.',
    track: 'AI & Cloud',
    time: '13:00 - 13:50',
    room: 'Hall A (오디토리움)',
    photoDataUrl: SAMPLE_PORTRAITS[0],
    photoScale: 1,
    photoOffsetX: 0,
    photoOffsetY: 0,
    photoFilter: 'none',
  },
  {
    id: 'spk-2',
    name: '박소연',
    affiliation: 'Toss (Viva Republic)',
    role: 'Frontend Platform Lead',
    title: '대규모 웹 애플리케이션을 위한 디자인 시스템 토큰 파이프라인',
    description:
      'Figma 변수부터 CSS 런타임, SVG 에셋 자동 생성까지 디자이너와 엔지니어의 간극을 줄인 실전 워크플로우를 다룹니다.',
    track: 'Web & Design',
    time: '14:00 - 14:50',
    room: 'Hall B (세미나실 101)',
    photoDataUrl: SAMPLE_PORTRAITS[1],
    photoScale: 1,
    photoOffsetX: 0,
    photoOffsetY: 0,
    photoFilter: 'none',
  },
  {
    id: 'spk-3',
    name: '이도현',
    affiliation: 'Karrot (당근)',
    role: 'Staff Android Engineer',
    title: 'Kotlin Multiplatform과 Compose로 하나의 코드베이스에서 60fps 달성하기',
    description:
      '안드로이드와 iOS 양쪽에서 네이티브 수준의 렌더링 성능과 메모리 안정성을 확보한 프로파일링 사례를 소개합니다.',
    track: 'Mobile',
    time: '15:10 - 16:00',
    room: 'Hall A (오디토리움)',
    photoDataUrl: SAMPLE_PORTRAITS[2],
    photoScale: 1,
    photoOffsetX: 0,
    photoOffsetY: 0,
    photoFilter: 'none',
  },
  {
    id: 'spk-4',
    name: '최윤서',
    affiliation: 'DeepMind Open Source Contributor',
    role: 'ML Systems Engineer',
    title: '온디바이스 추론 최적화: WebGPU와 경량 모델 양자화 실전 가이드',
    description:
      '서버 비용 없이 브라우저와 모바일 기기에서 실시간 추론을 구동하기 위한 양자화 및 셰이더 튜닝 기법을 알아봅니다.',
    track: 'AI & Cloud',
    time: '16:10 - 17:00',
    room: 'Hall A (오디토리움)',
    photoDataUrl: SAMPLE_PORTRAITS[3],
    photoScale: 1,
    photoOffsetX: 0,
    photoOffsetY: 0,
    photoFilter: 'none',
  },
  {
    id: 'spk-5',
    name: '정현우',
    affiliation: 'LINE Plus',
    role: 'Principal Infrastructure Engineer',
    title: 'Kubernetes 멀티 클러스터 환경에서의 Zero-Downtime 메시 마이그레이션',
    description:
      '수억 건의 일일 트래픽을 무중단으로 전환하기 위해 설계한 카나리 검증 파이프라인과 관측성(Observability) 체계를 설명합니다.',
    track: 'Cloud & Infra',
    time: '17:10 - 18:00',
    room: 'Hall B (세미나실 101)',
    photoDataUrl: SAMPLE_PORTRAITS[0],
    photoScale: 1,
    photoOffsetX: 0,
    photoOffsetY: 0,
    photoFilter: 'none',
  },
];

export const INITIAL_EVENT_META: DevFestEventMeta = {
  eventTitle: 'DevFest',
  locationText: 'Seoul',
  yearText: '2026',
  trackHeader: 'AI & Cloud @DevFest',
  chapterLabel: 'Google Developer Groups',
  dateVenueSubtext: '2026. 11. 14 (SAT) · COEX GRAND BALLROOM',
  agendaTitle: 'Agenda',
  showWireframeGlobe: true,
  showAsteriskSticker: true,
  showCropMarks: false,
};
