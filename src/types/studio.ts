export type AssetCategory = 'sns' | 'print';

export type LayoutTemplateId =
  | 'speaker-card'
  | 'session-banner'
  | 'x-banner'
  | 'pamphlet-trifold'
  | 'main-poster'
  | 'nametag-badge';

export type SpeakerFrameShape = 'circle' | 'arch' | 'rounded' | 'hexagon' | 'pill';

export type PhotoFilterType =
  | 'none'
  | 'grayscale'
  | 'duotone-blue'
  | 'duotone-warm'
  | 'contrast';

export type PatternStyleType = 'dots' | 'grid' | 'geometric' | 'aurora' | 'none';

export type ShadowStyleType = 'brutalist' | 'soft' | 'glow' | 'none';

export interface CanvasPreset {
  id: string;
  name: string;
  category: AssetCategory;
  width: number;
  height: number;
  physicalSize?: string;
  aspectLabel: string;
  defaultLayout: LayoutTemplateId;
  description: string;
  bleedPx?: number;
  safeMarginPx?: number;
  foldLines?: number[]; // Normalized 0..1 X positions for pamphlet fold lines
  hasGrommets?: boolean; // Corner punch marks for X-banners
}

export interface DesignSystemTokens {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    background: string;
    surface: string;
    textPrimary: string;
    textSecondary: string;
    border: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    monoFont: string;
    headingWeight: '700' | '800' | '900';
    letterSpacing: string;
  };
  shapes: {
    borderRadius: number;
    borderWidth: number;
    shadowStyle: ShadowStyleType;
    patternStyle: PatternStyleType;
    speakerFrameShape: SpeakerFrameShape;
  };
}

export type BaseAssetType = 'logo' | 'background' | 'frame' | 'sticker' | 'sponsor';

export interface BaseAssetItem {
  id: string;
  name: string;
  type: BaseAssetType;
  dataUrl: string;
  opacity: number;
  scale: number;
  x: number; // Percentage 0..100
  y: number; // Percentage 0..100
  visible: boolean;
  builtIn?: boolean;
}

export interface SpeakerProfile {
  id: string;
  name: string;
  role: string;
  company: string;
  topic: string;
  track: string;
  dateTime: string;
  venue: string;
  bio: string;
  tags: string[];
  photoDataUrl: string;
  photoScale: number;
  photoOffsetX: number;
  photoOffsetY: number;
  photoFilter: PhotoFilterType;
  accentColorOverride?: string;
  aiAuraEnabled?: boolean;
}

export interface PamphletScheduleItem {
  time: string;
  title: string;
  speaker: string;
  track: string;
}

export interface EventInfo {
  eventName: string;
  subtitle: string;
  chapterName: string;
  date: string;
  location: string;
  ctaText: string;
  websiteUrl: string;
  hashtag: string;
  pamphletIntro: string;
  schedule: PamphletScheduleItem[];
}

export type ExportFormat = 'svg' | 'png' | 'jpg' | 'webp';

export interface ExportOptions {
  format: ExportFormat;
  scale: 1 | 2 | 3;
  quality: number;
  includePrintGuides: boolean;
  transparentBg: boolean;
}
