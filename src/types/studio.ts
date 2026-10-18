export type AssetMode = 'speaker' | 'timetable';

export type SpeakerTemplateVariant =
  | 'devfest-bracket'
  | 'track-notch'
  | 'xbanner-meterboard';

export type TimetableTemplateVariant =
  | 'agenda-digital'
  | 'agenda-xbanner'
  | 'agenda-print';

export type PhotoFilterType = 'none' | 'grayscale' | 'contrast';

export type DevFestColorwayId =
  | 'offwhite-classic'
  | 'pastel-blue'
  | 'pastel-yellow'
  | 'pastel-green'
  | 'pastel-pink'
  | 'dark-charcoal';

export interface DevFestColorway {
  id: DevFestColorwayId;
  name: string;
  description: string;
  canvasBg: string;
  cardSurface: string;
  ink: string;
  mutedInk: string;
  bracketColor: string;
  locationPillBg: string;
  locationPillText: string;
  yearPillBg: string;
  yearPillText: string;
  slashFill: string;
  caterpillarFill: string;
  scallopFill: string;
  timeAccent: string;
}

export interface SizePreset {
  id: string;
  name: string;
  usageLabel: string;
  category: 'sns' | 'xbanner' | 'print';
  width: number;
  height: number;
  aspectLabel: string;
  recommendedMode: AssetMode;
  recommendedSpeakerVariant?: SpeakerTemplateVariant;
  recommendedTimetableVariant?: TimetableTemplateVariant;
}

export interface SpeakerSessionItem {
  id: string;
  name: string;
  affiliation: string;
  role: string;
  title: string;
  description: string;
  track: string;
  time: string;
  room: string;
  photoDataUrl: string;
  photoScale: number;
  photoOffsetX: number;
  photoOffsetY: number;
  photoFilter: PhotoFilterType;
}

export interface DevFestEventMeta {
  eventTitle: string; // e.g. 'DevFest'
  locationText: string; // e.g. 'Seoul' or 'Editable Location'
  yearText: string; // e.g. '2026'
  trackHeader: string; // e.g. 'AI & Cloud @DevFest' or 'Track @DevFest'
  chapterLabel: string; // e.g. 'Google Developer Groups'
  dateVenueSubtext: string; // e.g. '2026. 11. 14 (SAT) · COEX GRAND BALLROOM'
  agendaTitle: string; // e.g. 'Agenda'
  showWireframeGlobe: boolean;
  showAsteriskSticker: boolean;
  showCropMarks: boolean;
  customLogoDataUrl?: string;
}

export type ExportFormat = 'png' | 'jpg' | 'svg' | 'webp';

export interface ExportOptions {
  format: ExportFormat;
  scale: 1 | 2 | 3;
  quality: number;
  transparentBg: boolean;
}
