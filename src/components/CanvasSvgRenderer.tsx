'use client';

import React from 'react';
import {
  AssetMode,
  DevFestColorway,
  DevFestEventMeta,
  SpeakerSessionItem,
  SpeakerTemplateVariant,
  TimetableTemplateVariant,
} from '@/types/studio';

interface CanvasSvgRendererProps {
  svgRef?: React.RefObject<SVGSVGElement | null>;
  width: number;
  height: number;
  mode: AssetMode;
  speakerVariant: SpeakerTemplateVariant;
  timetableVariant: TimetableTemplateVariant;
  colorway: DevFestColorway;
  activeSpeaker: SpeakerSessionItem;
  sessions: SpeakerSessionItem[];
  eventMeta: DevFestEventMeta;
}

/**
 * Given an ordered array of orthogonal polygon vertices [[x0,y0], [x1,y1], ...],
 * generates an SVG path string with smooth rounded corners (both convex and concave steps).
 */
function buildOrthogonalRoundedPath(
  pts: Array<[number, number]>,
  defaultRadius: number
): string {
  const n = pts.length;
  if (n < 3) return '';

  const segments: string[] = [];

  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const curr = pts[i];
    const next = pts[(i + 1) % n];

    const v1x = curr[0] - prev[0];
    const v1y = curr[1] - prev[1];
    const len1 = Math.hypot(v1x, v1y);

    const v2x = next[0] - curr[0];
    const v2y = next[1] - curr[1];
    const len2 = Math.hypot(v2x, v2y);

    if (len1 === 0 || len2 === 0) continue;

    const r = Math.min(defaultRadius, len1 * 0.45, len2 * 0.45);

    const u1x = v1x / len1;
    const u1y = v1y / len1;
    const u2x = v2x / len2;
    const u2y = v2y / len2;

    const startX = curr[0] - u1x * r;
    const startY = curr[1] - u1y * r;
    const endX = curr[0] + u2x * r;
    const endY = curr[1] + u2y * r;

    if (i === 0) {
      segments.push(`M ${startX.toFixed(1)} ${startY.toFixed(1)}`);
    } else {
      segments.push(`L ${startX.toFixed(1)} ${startY.toFixed(1)}`);
    }

    // Cross product determines turn direction (sweep flag for circular arc)
    const cross = u1x * u2y - u1y * u2x;
    const sweep = cross > 0 ? 1 : 0;
    segments.push(
      `A ${r.toFixed(1)} ${r.toFixed(1)} 0 0 ${sweep} ${endX.toFixed(1)} ${endY.toFixed(1)}`
    );
  }

  segments.push('Z');
  return segments.join(' ');
}

/**
 * Simple line-wrapping helper for SVG text elements.
 * Supports Korean + English mixed strings by estimating character width units.
 */
function wrapTextLines(
  text: string,
  maxUnitsPerLine: number,
  maxLines: number
): string[] {
  if (!text) return [];
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';
  let currentUnits = 0;

  const charUnits = (str: string) => {
    let total = 0;
    for (const ch of str) {
      total += ch.charCodeAt(0) > 255 ? 1.75 : 1.0;
    }
    return total;
  };

  for (const word of words) {
    const wUnits = charUnits(word);
    if (!currentLine) {
      currentLine = word;
      currentUnits = wUnits;
    } else if (currentUnits + 1 + wUnits <= maxUnitsPerLine) {
      currentLine += ` ${word}`;
      currentUnits += 1 + wUnits;
    } else {
      lines.push(currentLine);
      currentLine = word;
      currentUnits = wUnits;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  if (lines.length > maxLines) {
    const sliced = lines.slice(0, maxLines);
    sliced[maxLines - 1] = sliced[maxLines - 1].replace(/[.,\s]*$/, '') + '…';
    return sliced;
  }

  return lines;
}

/**
 * Official GDG `< >` 4-color outlined capsule logo
 */
function GdgBracketLogo({
  x,
  y,
  scale = 1,
  strokeColor = '#1e1e1e',
  strokeWidth = 2.4,
  withLabel = false,
  labelColor = '#1e1e1e',
  chapterText = 'Google Developer Groups',
  customLogoUrl,
  customLogoScale = 1,
}: {
  x: number;
  y: number;
  scale?: number;
  strokeColor?: string;
  strokeWidth?: number;
  withLabel?: boolean;
  labelColor?: string;
  chapterText?: string;
  customLogoUrl?: string;
  customLogoScale?: number;
}) {
  const sw = strokeWidth / scale;
  if (customLogoUrl) {
    const imgW = 120 * customLogoScale;
    const imgH = 52 * customLogoScale;
    return (
      <g transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) scale(${scale.toFixed(3)})`}>
        <image
          href={customLogoUrl}
          x={43 - imgW / 2}
          y={20 - imgH / 2}
          width={imgW}
          height={imgH}
          preserveAspectRatio="xMidYMid meet"
        />
      </g>
    );
  }
  return (
    <g transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) scale(${scale.toFixed(3)})`}>
      {/* Left bracket < : Red upper arm + Blue lower arm */}
      <g transform="translate(22, 20)">
        <rect
          x="-18"
          y="-7"
          width="36"
          height="14"
          rx="7"
          transform="translate(-4, -7) rotate(-32)"
          fill="#ea4335"
          stroke={strokeColor}
          strokeWidth={sw}
        />
        <rect
          x="-18"
          y="-7"
          width="36"
          height="14"
          rx="7"
          transform="translate(-4, 7) rotate(32)"
          fill="#4285f4"
          stroke={strokeColor}
          strokeWidth={sw}
        />
        <circle cx="-13" cy="0" r="6.4" fill="#ea4335" />
      </g>
      {/* Right bracket > : Green upper arm + Yellow lower arm */}
      <g transform="translate(64, 20)">
        <rect
          x="-18"
          y="-7"
          width="36"
          height="14"
          rx="7"
          transform="translate(4, 7) rotate(-32)"
          fill="#f9ab00"
          stroke={strokeColor}
          strokeWidth={sw}
        />
        <rect
          x="-18"
          y="-7"
          width="36"
          height="14"
          rx="7"
          transform="translate(4, -7) rotate(32)"
          fill="#34a853"
          stroke={strokeColor}
          strokeWidth={sw}
        />
      </g>
      {withLabel && (
        <text
          x={96}
          y={25}
          fill={labelColor}
          fontFamily="'Google Sans', 'Pretendard', sans-serif"
          fontSize={16}
          fontWeight={700}
          letterSpacing="-0.02em"
        >
          {chapterText}
        </text>
      )}
    </g>
  );
}

/**
 * Official DevFest 2026 Bold `//` Double Slash Sticker
 */
function DoubleSlashGlyph({
  x,
  y,
  height,
  fill,
  stroke = '#1e1e1e',
  strokeWidth = 2.5,
}: {
  x: number;
  y: number;
  height: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
}) {
  const s = height / 100;
  const barW = 28 * s;
  const barH = 104 * s;
  const rx = 10 * s;
  return (
    <g transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)})`}>
      <rect
        x={18 * s}
        y={0}
        width={barW}
        height={barH}
        rx={rx}
        transform={`skewX(-18)`}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <rect
        x={58 * s}
        y={0}
        width={barW}
        height={barH}
        rx={rx}
        transform={`skewX(-18)`}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </g>
  );
}

/**
 * Official DevFest 2026 Bold `;` Semicolon Sticker
 */
function SemicolonGlyph({
  x,
  y,
  height,
  fill,
  stroke = '#1e1e1e',
  strokeWidth = 2.5,
}: {
  x: number;
  y: number;
  height: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
}) {
  const s = height / 100;
  return (
    <g transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) scale(${s.toFixed(3)})`}>
      <circle
        cx={28}
        cy={20}
        r={17}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth / s}
      />
      <path
        d="M 16 54 H 40 A 8 8 0 0 1 48 62 V 76 C 48 92 34 102 14 104 L 11 91 C 22 89 27 84 27 76 H 16 A 8 8 0 0 1 8 68 V 62 A 8 8 0 0 1 16 54 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth / s}
        strokeLinejoin="round"
      />
    </g>
  );
}

/**
 * Official DevFest 2026 3-Circle Caterpillar Blob (Unified outline with inner circle detail)
 */
function CaterpillarBlob({
  x,
  y,
  width,
  fill,
  stroke = '#1e1e1e',
  strokeWidth = 2.5,
}: {
  x: number;
  y: number;
  width: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
}) {
  const s = width / 180;
  const sw = strokeWidth / s;
  return (
    <g transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) scale(${s.toFixed(3)})`}>
      {/* Unified 3-lobe caterpillar silhouette */}
      <path
        d="M 52 14 A 30 30 0 0 1 90 14 A 30 30 0 0 1 128 14 A 30 30 0 1 1 128 58 A 30 30 0 0 1 90 58 A 30 30 0 0 1 52 58 A 30 30 0 1 1 52 14 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      {/* Signature single complete circle ring on the right lobe (from DevFest 2026 slides) */}
      <circle
        cx={142}
        cy={36}
        r={30}
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
      />
    </g>
  );
}

/**
 * Official DevFest 2026 Scallop Arches Sticker (2 connected half-domes)
 */
function ScallopArches({
  x,
  y,
  width,
  fill,
  stroke = '#1e1e1e',
  strokeWidth = 2.5,
}: {
  x: number;
  y: number;
  width: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
}) {
  const s = width / 160;
  const sw = strokeWidth / s;
  return (
    <g transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) scale(${s.toFixed(3)})`}>
      <path
        d="M 4 44 A 38 38 0 0 1 80 44 A 38 38 0 0 1 156 44 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
    </g>
  );
}

/**
 * Monoline 8-spoke asterisk `*` from DevFest 2026 Sticker Sheet
 */
function MonolineAsterisk({
  cx,
  cy,
  radius,
  stroke = '#1e1e1e',
  strokeWidth = 2.4,
}: {
  cx: number;
  cy: number;
  radius: number;
  stroke?: string;
  strokeWidth?: number;
}) {
  const d45 = radius * 0.7071;
  return (
    <g stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round">
      <line x1={cx - radius} y1={cy} x2={cx + radius} y2={cy} />
      <line x1={cx} y1={cy - radius} x2={cx} y2={cy + radius} />
      <line x1={cx - d45} y1={cy - d45} x2={cx + d45} y2={cy + d45} />
      <line x1={cx - d45} y1={cy + d45} x2={cx + d45} y2={cy - d45} />
    </g>
  );
}

/**
 * Monoline Wireframe Globe from DevFest 2026 Speaker / Meterboard templates
 */
function WireframeGlobe({
  cx,
  cy,
  radius,
  stroke = '#1e1e1e',
  strokeWidth = 2.2,
}: {
  cx: number;
  cy: number;
  radius: number;
  stroke?: string;
  strokeWidth?: number;
}) {
  return (
    <g fill="none" stroke={stroke} strokeWidth={strokeWidth}>
      <circle cx={cx} cy={cy} r={radius} />
      <ellipse cx={cx} cy={cy} rx={radius * 0.52} ry={radius} />
      <ellipse cx={cx} cy={cy} rx={radius} ry={radius * 0.42} />
      <line x1={cx - radius} y1={cy} x2={cx + radius} y2={cy} />
      <line x1={cx} y1={cy - radius} x2={cx} y2={cy + radius} />
    </g>
  );
}

/**
 * Official `{ DevFest } [Location] [2026]` Lockup Header
 */
function DevFestBracketLockup({
  x,
  y,
  scale,
  eventMeta,
  colorway,
  strokeWidth,
  compact = false,
}: {
  x: number;
  y: number;
  scale: number;
  eventMeta: DevFestEventMeta;
  colorway: DevFestColorway;
  strokeWidth: number;
  compact?: boolean;
}) {
  if (eventMeta.devfestLogoDataUrl) {
    const logoScale = eventMeta.devfestLogoScale || 1;
    const imgW = 340 * logoScale;
    const imgH = 104 * logoScale;
    return (
      <g transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) scale(${scale.toFixed(3)})`}>
        <image
          href={eventMeta.devfestLogoDataUrl}
          x={0}
          y={4}
          width={imgW}
          height={imgH}
          preserveAspectRatio="xMinYMid meet"
        />
      </g>
    );
  }

  const sw = strokeWidth / scale;
  const titleText = eventMeta.eventTitle || 'DevFest';
  const locText = eventMeta.locationText || 'Seoul';
  const yearText = eventMeta.yearText || '2026';

  const locPillW = Math.max(96, locText.length * 14 + 34);
  const yearPillW = Math.max(88, yearText.length * 18 + 34);

  return (
    <g transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) scale(${scale.toFixed(3)})`}>
      {/* Left Curly Brace { */}
      <text
        x={0}
        y={52}
        fill={colorway.bracketColor}
        fontFamily="'Google Sans', 'Pretendard', sans-serif"
        fontSize={62}
        fontWeight={700}
      >
        {'{'}
      </text>

      {/* DevFest wordmark */}
      <text
        x={34}
        y={50}
        fill={colorway.ink}
        fontFamily="'Google Sans', 'Pretendard', sans-serif"
        fontSize={54}
        fontWeight={800}
        letterSpacing="-0.03em"
      >
        {titleText}
      </text>

      {/* Right Curly Brace } */}
      <text
        x={252}
        y={52}
        fill={colorway.bracketColor}
        fontFamily="'Google Sans', 'Pretendard', sans-serif"
        fontSize={62}
        fontWeight={700}
      >
        {'}'}
      </text>

      {!compact ? (
        <>
          {/* Location Pill (top-right of DevFest or beside it) */}
          <rect
            x={288}
            y={12}
            width={locPillW}
            height={36}
            rx={8}
            fill={colorway.locationPillBg}
            stroke={colorway.ink}
            strokeWidth={sw}
          />
          <text
            x={288 + locPillW / 2}
            y={35}
            textAnchor="middle"
            fill={colorway.locationPillText}
            fontFamily="'Google Sans Mono', 'JetBrains Mono', monospace"
            fontSize={17}
            fontWeight={600}
          >
            {locText}
          </text>

          {/* 2026 Capsule Pill below */}
          <rect
            x={168}
            y={66}
            width={yearPillW}
            height={42}
            rx={21}
            fill={colorway.yearPillBg}
            stroke={colorway.ink}
            strokeWidth={sw}
          />
          <text
            x={168 + yearPillW / 2}
            y={94}
            textAnchor="middle"
            fill={colorway.yearPillText}
            fontFamily="'Google Sans', 'Pretendard', sans-serif"
            fontSize={25}
            fontWeight={800}
          >
            {yearText}
          </text>
        </>
      ) : (
        <>
          {/* Inline Location + Year pills */}
          <rect
            x={288}
            y={14}
            width={locPillW}
            height={40}
            rx={8}
            fill={colorway.locationPillBg}
            stroke={colorway.ink}
            strokeWidth={sw}
          />
          <text
            x={288 + locPillW / 2}
            y={40}
            textAnchor="middle"
            fill={colorway.locationPillText}
            fontFamily="'Google Sans Mono', 'JetBrains Mono', monospace"
            fontSize={18}
            fontWeight={600}
          >
            {locText}
          </text>
          <rect
            x={288 + locPillW + 12}
            y={14}
            width={yearPillW}
            height={40}
            rx={20}
            fill={colorway.yearPillBg}
            stroke={colorway.ink}
            strokeWidth={sw}
          />
          <text
            x={288 + locPillW + 12 + yearPillW / 2}
            y={41}
            textAnchor="middle"
            fill={colorway.yearPillText}
            fontFamily="'Google Sans', 'Pretendard', sans-serif"
            fontSize={22}
            fontWeight={800}
          >
            {yearText}
          </text>
        </>
      )}
    </g>
  );
}

/**
 * Official `Track @DevFest` Two-Line Header Lockup with Location Pill
 */
function TrackAtDevFestLockup({
  x,
  y,
  scale,
  trackLabel,
  locationText,
  yearText,
  colorway,
  strokeWidth,
  textColorOverride,
  customLogoUrl,
  customLogoScale = 1,
}: {
  x: number;
  y: number;
  scale: number;
  trackLabel: string;
  locationText: string;
  yearText?: string;
  colorway: DevFestColorway;
  strokeWidth: number;
  textColorOverride?: string;
  customLogoUrl?: string;
  customLogoScale?: number;
}) {
  if (customLogoUrl) {
    const imgW = 340 * customLogoScale;
    const imgH = 104 * customLogoScale;
    return (
      <g transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) scale(${scale.toFixed(3)})`}>
        <image
          href={customLogoUrl}
          x={0}
          y={4}
          width={imgW}
          height={imgH}
          preserveAspectRatio="xMinYMid meet"
        />
      </g>
    );
  }

  const sw = strokeWidth / scale;
  const headingColor = textColorOverride || colorway.ink;
  const locW = Math.max(108, locationText.length * 14 + 36);
  const yearW = yearText ? Math.max(76, yearText.length * 15 + 26) : 0;

  return (
    <g transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) scale(${scale.toFixed(3)})`}>
      <text
        x={0}
        y={42}
        fill={headingColor}
        fontFamily="'Google Sans', 'Pretendard', sans-serif"
        fontSize={46}
        fontWeight={800}
        letterSpacing="-0.03em"
      >
        {trackLabel || 'AI & Cloud'}
      </text>
      <text
        x={0}
        y={94}
        fill={headingColor}
        fontFamily="'Google Sans', 'Pretendard', sans-serif"
        fontSize={46}
        fontWeight={800}
        letterSpacing="-0.03em"
      >
        @DevFest
      </text>

      {/* Location Pill aligned beside @DevFest */}
      <rect
        x={236}
        y={58}
        width={locW}
        height={38}
        rx={9}
        fill={colorway.locationPillBg}
        stroke={colorway.ink}
        strokeWidth={sw}
      />
      <text
        x={236 + locW / 2}
        y={83}
        textAnchor="middle"
        fill={colorway.locationPillText}
        fontFamily="'Google Sans Mono', 'JetBrains Mono', monospace"
        fontSize={17}
        fontWeight={600}
      >
        {locationText}
      </text>

      {yearText && (
        <>
          <rect
            x={236 + locW + 10}
            y={58}
            width={yearW}
            height={38}
            rx={19}
            fill={colorway.yearPillBg}
            stroke={colorway.ink}
            strokeWidth={sw}
          />
          <text
            x={236 + locW + 10 + yearW / 2}
            y={84}
            textAnchor="middle"
            fill={colorway.yearPillText}
            fontFamily="'Google Sans', 'Pretendard', sans-serif"
            fontSize={20}
            fontWeight={800}
          >
            {yearText}
          </text>
        </>
      )}
    </g>
  );
}

export default function CanvasSvgRenderer({
  svgRef,
  width,
  height,
  mode,
  speakerVariant,
  timetableVariant,
  colorway,
  activeSpeaker,
  sessions,
  eventMeta,
}: CanvasSvgRendererProps) {
  const W = Math.max(320, width);
  const H = Math.max(320, height);
  const minDim = Math.min(W, H);
  const u = minDim / 1000;
  const aspect = W / H;
  const sw = Math.max(2, Number((2.5 * u).toFixed(2)));
  const cornerR = Math.round(26 * u);

  // Dark canvas check (for text sitting directly on the outer canvas)
  const isDarkCanvas = colorway.id === 'dark-charcoal';
  const canvasTextColor = isDarkCanvas ? '#ffffff' : colorway.ink;
  const canvasMutedColor = isDarkCanvas ? '#d0d0d0' : colorway.mutedInk;

  const filterAttr =
    activeSpeaker.photoFilter === 'grayscale'
      ? 'url(#df-filter-grayscale)'
      : activeSpeaker.photoFilter === 'contrast'
      ? 'url(#df-filter-contrast)'
      : undefined;

  // Render helper for speaker photo inside any bounding box [fx, fy, fw, fh]
  const renderClippedPhoto = (
    clipId: string,
    pathD: string,
    fx: number,
    fy: number,
    fw: number,
    fh: number,
    speaker: SpeakerSessionItem
  ) => {
    const scale = speaker.photoScale || 1;
    const imgW = fw * scale;
    const imgH = fh * scale;
    const imgX = fx + (fw - imgW) / 2 + (speaker.photoOffsetX || 0) * (fw / 200);
    const imgY = fy + (fh - imgH) / 2 + (speaker.photoOffsetY || 0) * (fh / 200);

    return (
      <>
        <defs>
          <clipPath id={clipId}>
            <path d={pathD} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <rect x={fx} y={fy} width={fw} height={fh} fill="#d8e2ef" />
          {speaker.photoDataUrl && (
            <image
              href={speaker.photoDataUrl}
              x={imgX}
              y={imgY}
              width={imgW}
              height={imgH}
              preserveAspectRatio="xMidYMid slice"
              filter={filterAttr}
            />
          )}
        </g>
        <path
          d={pathD}
          fill="none"
          stroke={isDarkCanvas ? '#ffffff' : colorway.ink}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
      </>
    );
  };

  // ============================================================================
  // MODE 1: SPEAKER PROMO CARD / SPEAKER X-BANNER
  // ============================================================================
  const renderSpeakerAsset = () => {
    const pad = Math.round(48 * u);

    // -------------------------------------------------------------------------
    // VARIANT 1C: X-BANNER / STANDING METERBOARD (meterboard_0.png, meterboard_1.png)
    // Also auto-selected if user picks xbanner-meterboard
    // -------------------------------------------------------------------------
    if (speakerVariant === 'xbanner-meterboard') {
      const headerH = Math.round(H * 0.14);
      const footerH = Math.round(H * 0.31);
      const photoX = pad;
      const photoY = pad + headerH;
      const photoW = W - pad * 2;
      const photoH = Math.max(180, H - pad * 2 - headerH - footerH);

      // Top-right notch for asterisk + bottom-left notch for slash/globe
      const notchTRW = Math.round(photoW * 0.22);
      const notchTRH = Math.round(photoH * 0.14);
      const notchBLW = Math.round(photoW * 0.24);
      const notchBLH = Math.round(photoH * 0.13);

      const photoPts: Array<[number, number]> = [
        [photoX, photoY],
        [photoX + photoW - notchTRW, photoY],
        [photoX + photoW - notchTRW, photoY + notchTRH],
        [photoX + photoW, photoY + notchTRH],
        [photoX + photoW, photoY + photoH],
        [photoX + notchBLW, photoY + photoH],
        [photoX + notchBLW, photoY + photoH - notchBLH],
        [photoX, photoY + photoH - notchBLH],
      ];
      const photoPath = buildOrthogonalRoundedPath(photoPts, cornerR);

      const cardY = photoY + photoH + Math.round(24 * u);
      const cardH = H - pad - cardY;

      const titleLines = wrapTextLines(activeSpeaker.title, 24, 3);
      const descLines = wrapTextLines(activeSpeaker.description, 34, 2);

      return (
        <g>
          {/* Top Header: Track @DevFest + Location Pill + Double Slash */}
          <TrackAtDevFestLockup
            x={pad}
            y={pad}
            scale={u * 1.15}
            trackLabel={activeSpeaker.track || 'AI & Cloud'}
            locationText={eventMeta.locationText}
            yearText={eventMeta.yearText}
            colorway={colorway}
            strokeWidth={sw}
            textColorOverride={canvasTextColor}
            customLogoUrl={eventMeta.devfestLogoDataUrl}
            customLogoScale={eventMeta.devfestLogoScale || 1}
          />

          <DoubleSlashGlyph
            x={W - pad - 120 * u}
            y={pad + 8 * u}
            height={92 * u}
            fill={colorway.slashFill}
            stroke={colorway.ink}
            strokeWidth={sw}
          />

          {/* Wireframe Globe behind bottom-right of photo */}
          {eventMeta.showWireframeGlobe && (
            <WireframeGlobe
              cx={photoX + photoW - 35 * u}
              cy={photoY + photoH - 25 * u}
              radius={85 * u}
              stroke={canvasTextColor}
              strokeWidth={sw * 0.85}
            />
          )}

          {/* Stepped Speaker Photo */}
          {renderClippedPhoto(
            'clip-meterboard-photo',
            photoPath,
            photoX,
            photoY,
            photoW,
            photoH,
            activeSpeaker
          )}

          {/* Top-right notch Asterisk */}
          {eventMeta.showAsteriskSticker && (
            <MonolineAsterisk
              cx={photoX + photoW - notchTRW * 0.45}
              cy={photoY + notchTRH * 0.48}
              radius={Math.min(notchTRW, notchTRH) * 0.34}
              stroke={canvasTextColor}
              strokeWidth={sw}
            />
          )}

          {/* Bottom-left notch Caterpillar or Semicolon */}
          <CaterpillarBlob
            x={photoX}
            y={photoY + photoH - notchBLH + 14 * u}
            width={notchBLW * 0.88}
            fill={colorway.caterpillarFill}
            stroke={colorway.ink}
            strokeWidth={sw}
          />

          {/* Bottom White Speaker Card */}
          <rect
            x={pad}
            y={cardY}
            width={photoW}
            height={cardH}
            rx={cornerR}
            fill={colorway.cardSurface}
            stroke={colorway.ink}
            strokeWidth={sw}
          />

          {/* Speaker Name + Affiliation + Track Pill */}
          <g transform={`translate(${pad + 36 * u}, ${cardY + 48 * u})`}>
            {/* Time & Room Badge */}
            <rect
              x={0}
              y={0}
              width={Math.min(photoW - 72 * u, 420 * u)}
              height={38 * u}
              rx={8 * u}
              fill={colorway.yearPillBg}
              stroke={colorway.ink}
              strokeWidth={sw * 0.85}
            />
            <text
              x={16 * u}
              y={25 * u}
              fill={colorway.ink}
              fontFamily="'Google Sans Mono', 'JetBrains Mono', monospace"
              fontSize={18 * u}
              fontWeight={700}
            >
              {`${activeSpeaker.time} · ${activeSpeaker.room}`}
            </text>

            {/* Speaker Name */}
            <text
              x={0}
              y={94 * u}
              fill={colorway.ink}
              fontFamily="'Google Sans', 'Pretendard', sans-serif"
              fontSize={48 * u}
              fontWeight={800}
              letterSpacing="-0.03em"
            >
              {activeSpeaker.name}
            </text>

            {/* Speaker Affiliation & Role */}
            <text
              x={0}
              y={130 * u}
              fill={colorway.mutedInk}
              fontFamily="'Google Sans Mono', 'JetBrains Mono', monospace"
              fontSize={21 * u}
              fontWeight={600}
            >
              {[activeSpeaker.affiliation, activeSpeaker.role]
                .filter(Boolean)
                .join(' · ')}
            </text>

            {/* Divider line */}
            <line
              x1={0}
              y1={154 * u}
              x2={photoW - 72 * u}
              y2={154 * u}
              stroke={colorway.ink}
              strokeWidth={sw * 0.7}
              strokeDasharray={`${6 * u} ${6 * u}`}
            />

            {/* Session Title */}
            {titleLines.map((line, idx) => (
              <text
                key={idx}
                x={0}
                y={(198 + idx * 40) * u}
                fill={colorway.ink}
                fontFamily="'Google Sans', 'Pretendard', sans-serif"
                fontSize={31 * u}
                fontWeight={800}
                letterSpacing="-0.02em"
              >
                {line}
              </text>
            ))}

            {/* Session Description */}
            {cardH > 340 * u &&
              descLines.map((line, idx) => (
                <text
                  key={idx}
                  x={0}
                  y={(198 + titleLines.length * 40 + 18 + idx * 28) * u}
                  fill={colorway.mutedInk}
                  fontFamily="'Google Sans', 'Pretendard', sans-serif"
                  fontSize={20 * u}
                  fontWeight={500}
                >
                  {line}
                </text>
              ))}
          </g>

          {/* Bottom GDG Bracket Logo inside card bottom-right */}
          <GdgBracketLogo
            x={W - pad - 115 * u}
            y={H - pad - 54 * u}
            scale={u * 1.0}
            strokeColor={colorway.ink}
            strokeWidth={sw}
            customLogoUrl={eventMeta.gdgLogoDataUrl}
            customLogoScale={eventMeta.gdgLogoScale || 1}
          />
        </g>
      );
    }

    // -------------------------------------------------------------------------
    // LANDSCAPE SPEAKER PROMO (aspect >= 1.22, e.g., 1920x1080 or 1200x800)
    // Matches speaker_16x9_0.png and speaker_promo_16x9_0.png
    // -------------------------------------------------------------------------
    if (aspect >= 1.22) {
      const leftW = Math.round((W - pad * 2) * 0.48);
      const photoX = pad + leftW + Math.round(24 * u);
      const photoY = pad;
      const photoW = W - pad - photoX;
      const photoH = H - pad * 2;

      const stepTLW = Math.round(photoW * 0.25);
      const stepTLH = Math.round(photoH * 0.2);
      const notchBRW = Math.round(photoW * 0.22);
      const notchBRH = Math.round(photoH * 0.16);

      const photoPts: Array<[number, number]> = [
        [photoX + stepTLW, photoY],
        [photoX + photoW, photoY],
        [photoX + photoW, photoY + photoH - notchBRH],
        [photoX + photoW - notchBRW, photoY + photoH - notchBRH],
        [photoX + photoW - notchBRW, photoY + photoH],
        [photoX, photoY + photoH],
        [photoX, photoY + stepTLH],
        [photoX + stepTLW, photoY + stepTLH],
      ];
      const photoPath = buildOrthogonalRoundedPath(photoPts, cornerR);

      const titleLines = wrapTextLines(activeSpeaker.title, 22, 3);
      const descLines = wrapTextLines(activeSpeaker.description, 30, 2);

      return (
        <g>
          {/* Left Header Lockup */}
          {speakerVariant === 'devfest-bracket' ? (
            <DevFestBracketLockup
              x={pad}
              y={pad + 8 * u}
              scale={u * 1.05}
              eventMeta={eventMeta}
              colorway={colorway}
              strokeWidth={sw}
            />
          ) : (
            <TrackAtDevFestLockup
              x={pad}
              y={pad + 8 * u}
              scale={u * 1.08}
              trackLabel={activeSpeaker.track}
              locationText={eventMeta.locationText}
              yearText={eventMeta.yearText}
              colorway={colorway}
              strokeWidth={sw}
              textColorOverride={canvasTextColor}
              customLogoUrl={eventMeta.devfestLogoDataUrl}
              customLogoScale={eventMeta.devfestLogoScale || 1}
            />
          )}

          {/* Decorative Asterisk or Semicolon in the top-left photo cutout */}
          {speakerVariant === 'devfest-bracket' ? (
            eventMeta.showAsteriskSticker && (
              <MonolineAsterisk
                cx={photoX + stepTLW * 0.45}
                cy={photoY + stepTLH * 0.48}
                radius={Math.min(stepTLW, stepTLH) * 0.34}
                stroke={canvasTextColor}
                strokeWidth={sw}
              />
            )
          ) : (
            <SemicolonGlyph
              x={photoX + stepTLW * 0.22}
              y={photoY + stepTLH * 0.08}
              height={stepTLH * 0.78}
              fill={colorway.slashFill}
              stroke={colorway.ink}
              strokeWidth={sw}
            />
          )}

          {/* Left Speaker & Session Editorial Card */}
          <rect
            x={pad}
            y={pad + 170 * u}
            width={leftW}
            height={H - pad * 2 - 170 * u}
            rx={cornerR}
            fill={colorway.cardSurface}
            stroke={colorway.ink}
            strokeWidth={sw}
          />

          <g transform={`translate(${pad + 36 * u}, ${pad + 216 * u})`}>
            {/* Track + Time Badge */}
            <rect
              x={0}
              y={0}
              width={Math.min(leftW - 72 * u, 380 * u)}
              height={36 * u}
              rx={8 * u}
              fill={colorway.yearPillBg}
              stroke={colorway.ink}
              strokeWidth={sw * 0.85}
            />
            <text
              x={14 * u}
              y={24 * u}
              fill={colorway.ink}
              fontFamily="'Google Sans Mono', 'JetBrains Mono', monospace"
              fontSize={16 * u}
              fontWeight={700}
            >
              {`${activeSpeaker.track} · ${activeSpeaker.time}`}
            </text>

            {/* Speaker Name */}
            <text
              x={0}
              y={92 * u}
              fill={colorway.ink}
              fontFamily="'Google Sans', 'Pretendard', sans-serif"
              fontSize={48 * u}
              fontWeight={800}
              letterSpacing="-0.03em"
            >
              {activeSpeaker.name}
            </text>

            {/* Affiliation & Role */}
            <text
              x={0}
              y={128 * u}
              fill={colorway.mutedInk}
              fontFamily="'Google Sans Mono', 'JetBrains Mono', monospace"
              fontSize={20 * u}
              fontWeight={600}
            >
              {[activeSpeaker.affiliation, activeSpeaker.role]
                .filter(Boolean)
                .join(' · ')}
            </text>

            {/* Talk Title */}
            {titleLines.map((line, idx) => (
              <text
                key={idx}
                x={0}
                y={(186 + idx * 38) * u}
                fill={colorway.ink}
                fontFamily="'Google Sans', 'Pretendard', sans-serif"
                fontSize={29 * u}
                fontWeight={800}
                letterSpacing="-0.02em"
              >
                {line}
              </text>
            ))}

            {/* Talk Description */}
            {descLines.map((line, idx) => (
              <text
                key={idx}
                x={0}
                y={(186 + titleLines.length * 38 + 16 + idx * 26) * u}
                fill={colorway.mutedInk}
                fontFamily="'Google Sans', 'Pretendard', sans-serif"
                fontSize={18 * u}
                fontWeight={500}
              >
                {line}
              </text>
            ))}

            {/* Venue Room Footer */}
            <text
              x={0}
              y={H - pad * 2 - 245 * u}
              fill={colorway.ink}
              fontFamily="'Google Sans Mono', 'JetBrains Mono', monospace"
              fontSize={17 * u}
              fontWeight={700}
            >
              {`📍 ${activeSpeaker.room}   |   ${eventMeta.dateVenueSubtext}`}
            </text>
          </g>

          {/* Wireframe Globe behind bottom-left of photo */}
          {eventMeta.showWireframeGlobe && (
            <WireframeGlobe
              cx={photoX + 20 * u}
              cy={photoY + photoH - 40 * u}
              radius={72 * u}
              stroke={canvasTextColor}
              strokeWidth={sw * 0.85}
            />
          )}

          {/* Stepped Photo Frame on Right */}
          {renderClippedPhoto(
            'clip-landscape-photo',
            photoPath,
            photoX,
            photoY,
            photoW,
            photoH,
            activeSpeaker
          )}

          {/* GDG `< >` Logo in the bottom-right notch */}
          <GdgBracketLogo
            x={photoX + photoW - notchBRW + 18 * u}
            y={photoY + photoH - notchBRH + (notchBRH - 40 * u) / 2}
            scale={u * 1.05}
            strokeColor={colorway.ink}
            strokeWidth={sw}
            customLogoUrl={eventMeta.gdgLogoDataUrl}
            customLogoScale={eventMeta.gdgLogoScale || 1}
          />
        </g>
      );
    }

    // -------------------------------------------------------------------------
    // SQUARE / PORTRAIT (800x1000, 1080x1080, 1080x1350, 1080x1920)
    // Matches speaker_sq_0.png & speaker_3x4_9x16_0.png & speaker_3x4_9x16_1.png
    // -------------------------------------------------------------------------
    const topHeaderH = Math.round(145 * u);
    const infoCardH = Math.round(Math.max(255 * u, H * 0.27));
    const photoX = pad;
    const photoY = pad + topHeaderH - Math.round(28 * u);
    const photoW = W - pad * 2;
    const photoH = Math.max(240, H - pad - infoCardH - Math.round(20 * u) - photoY);

    // Top-left step cutout (so the 2026 pill / Location pill sits neatly above-left of the photo step)
    const stepTLW = Math.round(photoW * 0.34);
    const stepTLH = Math.round(Math.min(photoH * 0.22, 96 * u));
    // Bottom-right notch cutout for GDG `< >` logo
    const notchBRW = Math.round(Math.max(130 * u, photoW * 0.22));
    const notchBRH = Math.round(Math.min(photoH * 0.2, 82 * u));

    const photoPts: Array<[number, number]> = [
      [photoX + stepTLW, photoY],
      [photoX + photoW, photoY],
      [photoX + photoW, photoY + photoH - notchBRH],
      [photoX + photoW - notchBRW, photoY + photoH - notchBRH],
      [photoX + photoW - notchBRW, photoY + photoH],
      [photoX, photoY + photoH],
      [photoX, photoY + stepTLH],
      [photoX + stepTLW, photoY + stepTLH],
    ];
    const photoPath = buildOrthogonalRoundedPath(photoPts, cornerR);

    const cardY = photoY + photoH + Math.round(20 * u);
    const titleLines = wrapTextLines(activeSpeaker.title, 28, 2);
    const descLines = wrapTextLines(activeSpeaker.description, 38, 2);

    return (
      <g>
        {/* Top Header Lockup */}
        {speakerVariant === 'devfest-bracket' ? (
          <DevFestBracketLockup
            x={pad}
            y={pad}
            scale={u * 1.05}
            eventMeta={eventMeta}
            colorway={colorway}
            strokeWidth={sw}
          />
        ) : (
          <>
            <TrackAtDevFestLockup
              x={pad}
              y={pad - 4 * u}
              scale={u * 1.0}
              trackLabel={activeSpeaker.track}
              locationText={eventMeta.locationText}
              yearText={eventMeta.yearText}
              colorway={colorway}
              strokeWidth={sw}
              textColorOverride={canvasTextColor}
              customLogoUrl={eventMeta.devfestLogoDataUrl}
              customLogoScale={eventMeta.devfestLogoScale || 1}
            />
            <DoubleSlashGlyph
              x={W - pad - 110 * u}
              y={pad}
              height={82 * u}
              fill={colorway.slashFill}
              stroke={colorway.ink}
              strokeWidth={sw}
            />
          </>
        )}

        {/* Top-Right Asterisk or Semicolon when using devfest-bracket */}
        {speakerVariant === 'devfest-bracket' && eventMeta.showAsteriskSticker && (
          <MonolineAsterisk
            cx={W - pad - 48 * u}
            cy={pad + 42 * u}
            radius={34 * u}
            stroke={canvasTextColor}
            strokeWidth={sw}
          />
        )}

        {/* Wireframe Globe peeking at bottom-left of photo */}
        {eventMeta.showWireframeGlobe && (
          <WireframeGlobe
            cx={photoX + 46 * u}
            cy={photoY + photoH - 22 * u}
            radius={64 * u}
            stroke={canvasTextColor}
            strokeWidth={sw * 0.85}
          />
        )}

        {/* Stepped Speaker Photo Frame */}
        {renderClippedPhoto(
          'clip-portrait-photo',
          photoPath,
          photoX,
          photoY,
          photoW,
          photoH,
          activeSpeaker
        )}

        {/* GDG `< >` Logo in the bottom-right photo notch */}
        <GdgBracketLogo
          x={photoX + photoW - notchBRW + (notchBRW - 86 * u) / 2}
          y={photoY + photoH - notchBRH + (notchBRH - 40 * u) / 2}
          scale={u * 1.0}
          strokeColor={colorway.ink}
          strokeWidth={sw}
          customLogoUrl={eventMeta.gdgLogoDataUrl}
          customLogoScale={eventMeta.gdgLogoScale || 1}
        />

        {/* Bottom Speaker & Session Info White Card */}
        <rect
          x={pad}
          y={cardY}
          width={photoW}
          height={infoCardH}
          rx={cornerR}
          fill={colorway.cardSurface}
          stroke={colorway.ink}
          strokeWidth={sw}
        />

        <g transform={`translate(${pad + 32 * u}, ${cardY + 38 * u})`}>
          {/* Speaker Name */}
          <text
            x={0}
            y={18 * u}
            fill={colorway.ink}
            fontFamily="'Google Sans', 'Pretendard', sans-serif"
            fontSize={38 * u}
            fontWeight={800}
            letterSpacing="-0.03em"
          >
            {activeSpeaker.name}
          </text>

          {/* Track + Time Pill on the right of Speaker Name */}
          <g transform={`translate(${photoW - 64 * u}, ${-12 * u})`}>
            <rect
              x={-260 * u}
              y={0}
              width={260 * u}
              height={36 * u}
              rx={8 * u}
              fill={colorway.yearPillBg}
              stroke={colorway.ink}
              strokeWidth={sw * 0.85}
            />
            <text
              x={-130 * u}
              y={24 * u}
              textAnchor="middle"
              fill={colorway.ink}
              fontFamily="'Google Sans Mono', 'JetBrains Mono', monospace"
              fontSize={15.5 * u}
              fontWeight={700}
            >
              {`${activeSpeaker.track} · ${activeSpeaker.time}`}
            </text>
          </g>

          {/* Speaker Affiliation & Role */}
          <text
            x={0}
            y={50 * u}
            fill={colorway.mutedInk}
            fontFamily="'Google Sans Mono', 'JetBrains Mono', monospace"
            fontSize={19 * u}
            fontWeight={600}
          >
            {[activeSpeaker.affiliation, activeSpeaker.role, activeSpeaker.room]
              .filter(Boolean)
              .join(' · ')}
          </text>

          {/* Divider */}
          <line
            x1={0}
            y1={72 * u}
            x2={photoW - 64 * u}
            y2={72 * u}
            stroke={colorway.ink}
            strokeWidth={sw * 0.65}
            strokeDasharray={`${5 * u} ${5 * u}`}
          />

          {/* Session Title */}
          {titleLines.map((line, idx) => (
            <text
              key={idx}
              x={0}
              y={(110 + idx * 34) * u}
              fill={colorway.ink}
              fontFamily="'Google Sans', 'Pretendard', sans-serif"
              fontSize={26.5 * u}
              fontWeight={800}
              letterSpacing="-0.02em"
            >
              {line}
            </text>
          ))}

          {/* Session Description */}
          {infoCardH >= 245 * u &&
            descLines.slice(0, 1).map((line, idx) => (
              <text
                key={idx}
                x={0}
                y={(110 + titleLines.length * 34 + 6 + idx * 24) * u}
                fill={colorway.mutedInk}
                fontFamily="'Google Sans', 'Pretendard', sans-serif"
                fontSize={17.5 * u}
                fontWeight={500}
              >
                {line}
              </text>
            ))}
        </g>
      </g>
    );
  };

  // ============================================================================
  // MODE 2: TIMETABLE / AGENDA (SNS Digital, X-Banner Standing, A4 Print)
  // Matches agenda_digital_0.png, agenda_digital_1.png, agenda_digital_2.png,
  // agenda_9x16_0.png, agenda_print_0.png, agenda_print_1.png
  // ============================================================================
  const renderTimetableAsset = () => {
    const pad = Math.round(44 * u);
    const cardX = pad;
    const cardY = pad;
    const cardW = W - pad * 2;
    const cardH = H - pad * 2;

    // -------------------------------------------------------------------------
    // Stepped White Card Geometry (Official DevFest 2026 Agenda Container):
    // - Top-left rises up as the "Agenda" folder tab (width tabW, height tabDropH)
    // - Top-right steps down by tabDropH to leave canvas space for Track @DevFest + Location Pill + // or Scallop
    // - Bottom-left steps in (cutBLW x cutBLH) to leave canvas space for GDG < > logo + Caterpillar blob
    // -------------------------------------------------------------------------
    const isWide = aspect >= 1.18;
    const tabW = Math.round(cardW * (isWide ? 0.36 : 0.44));
    const tabDropH = Math.round(Math.min(138 * u, cardH * 0.14));
    const cutBLW = Math.round(Math.min(340 * u, cardW * (isWide ? 0.28 : 0.42)));
    const cutBLH = Math.round(Math.min(92 * u, cardH * 0.1));

    const agendaCardPts: Array<[number, number]> = [
      [cardX, cardY],
      [cardX + tabW, cardY],
      [cardX + tabW, cardY + tabDropH],
      [cardX + cardW, cardY + tabDropH],
      [cardX + cardW, cardY + cardH],
      [cardX + cutBLW, cardY + cardH],
      [cardX + cutBLW, cardY + cardH - cutBLH],
      [cardX, cardY + cardH - cutBLH],
    ];
    const agendaCardPath = buildOrthogonalRoundedPath(agendaCardPts, cornerR);

    // Content area inside the white stepped card
    const innerX = cardX + Math.round(38 * u);
    const innerTopY = cardY + tabDropH + Math.round(34 * u);
    const innerW = cardW - Math.round(76 * u);
    const innerBottomY = cardY + cardH - cutBLH - Math.round(24 * u);
    const availH = Math.max(160, innerBottomY - innerTopY);

    // Decide 1-column vs 2-column layout based on aspect ratio, variant, and session count
    const useTwoCols =
      (timetableVariant === 'agenda-print' && sessions.length > 3 && aspect >= 0.68) ||
      (isWide && sessions.length > 3);

    const cols = useTwoCols ? 2 : 1;
    const rowsPerCol = Math.max(1, Math.ceil(sessions.length / cols));
    const colGap = Math.round(36 * u);
    const colW = cols === 2 ? (innerW - colGap) / 2 : innerW;
    const rowH = availH / rowsPerCol;

    return (
      <g>
        {/* Top-Right Header Cutout on Canvas: Track @DevFest + Location Pill + Decorative Motif */}
        <g>
          <TrackAtDevFestLockup
            x={cardX + tabW + Math.round(24 * u)}
            y={cardY + Math.round(4 * u)}
            scale={u * (isWide ? 0.92 : 0.78)}
            trackLabel={eventMeta.trackHeader.replace(/\s*@DevFest$/i, '') || 'DevFest'}
            locationText={eventMeta.locationText}
            yearText={isWide ? eventMeta.yearText : undefined}
            colorway={colorway}
            strokeWidth={sw}
            textColorOverride={canvasTextColor}
            customLogoUrl={eventMeta.devfestLogoDataUrl}
            customLogoScale={eventMeta.devfestLogoScale || 1}
          />

          {/* Rightmost motif in top cutout: Double Slash // or Scallop Arches */}
          {timetableVariant === 'agenda-print' ? (
            <ScallopArches
              x={cardX + cardW - 155 * u}
              y={cardY + tabDropH - 44 * u}
              width={145 * u}
              fill={colorway.scallopFill}
              stroke={colorway.ink}
              strokeWidth={sw}
            />
          ) : (
            <DoubleSlashGlyph
              x={cardX + cardW - 105 * u}
              y={cardY + 12 * u}
              height={Math.min(82 * u, tabDropH - 20 * u)}
              fill={colorway.slashFill}
              stroke={colorway.ink}
              strokeWidth={sw}
            />
          )}
        </g>

        {/* Main Stepped White Container Card */}
        <path
          d={agendaCardPath}
          fill={colorway.cardSurface}
          stroke={colorway.ink}
          strokeWidth={sw}
          strokeLinejoin="round"
        />

        {/* Top-Left Tab Title: "Agenda" + Date/Venue */}
        <g transform={`translate(${cardX + 38 * u}, ${cardY + 64 * u})`}>
          <text
            x={0}
            y={0}
            fill={colorway.ink}
            fontFamily="'Google Sans', 'Pretendard', sans-serif"
            fontSize={52 * u}
            fontWeight={800}
            letterSpacing="-0.03em"
          >
            {eventMeta.agendaTitle || 'Agenda'}
          </text>
          <text
            x={0}
            y={34 * u}
            fill={colorway.mutedInk}
            fontFamily="'Google Sans Mono', 'JetBrains Mono', monospace"
            fontSize={16 * u}
            fontWeight={600}
          >
            {eventMeta.dateVenueSubtext}
          </text>
        </g>

        {/* Session List Inside Stepped White Card */}
        {sessions.map((item, index) => {
          const colIdx = cols === 2 ? Math.floor(index / rowsPerCol) : 0;
          const rowIdx = cols === 2 ? index % rowsPerCol : index;
          const sx = innerX + colIdx * (colW + colGap);
          const sy = innerTopY + rowIdx * rowH;

          const compactRow = rowH < 130 * u;
          const titleFontSize = Math.min(26 * u, Math.max(17 * u, rowH * 0.2));
          const timeFontSize = Math.min(20 * u, Math.max(14 * u, rowH * 0.15));
          const metaFontSize = Math.min(18 * u, Math.max(13 * u, rowH * 0.14));

          const avatarSize = compactRow ? 0 : Math.min(64 * u, rowH * 0.48);
          const textOffsetX = avatarSize > 0 ? avatarSize + 20 * u : 0;
          const availTextW = colW - textOffsetX;
          const maxCharsPerLine = Math.max(18, Math.floor(availTextW / (titleFontSize * 0.62)));

          const titleLines = wrapTextLines(
            item.title,
            maxCharsPerLine,
            compactRow ? 1 : 2
          );
          const descLines =
            !compactRow && rowH >= 155 * u
              ? wrapTextLines(item.description, Math.floor(maxCharsPerLine * 1.25), 1)
              : [];

          const clipAvatarId = `agenda-avatar-${item.id}-${index}`;

          return (
            <g key={item.id || index} transform={`translate(${sx.toFixed(1)}, ${sy.toFixed(1)})`}>
              {/* Top border separator for rows after the first in each column */}
              {rowIdx > 0 && (
                <line
                  x1={0}
                  y1={-8 * u}
                  x2={colW}
                  y2={-8 * u}
                  stroke="#e2e5e9"
                  strokeWidth={Math.max(1, sw * 0.55)}
                />
              )}

              {/* Optional Speaker Circular Avatar */}
              {avatarSize > 0 && item.photoDataUrl && (
                <g transform={`translate(0, ${10 * u})`}>
                  <defs>
                    <clipPath id={clipAvatarId}>
                      <rect
                        x={0}
                        y={0}
                        width={avatarSize}
                        height={avatarSize}
                        rx={14 * u}
                      />
                    </clipPath>
                  </defs>
                  <g clipPath={`url(#${clipAvatarId})`}>
                    <rect
                      x={0}
                      y={0}
                      width={avatarSize}
                      height={avatarSize}
                      fill="#e8eef7"
                    />
                    <image
                      href={item.photoDataUrl}
                      x={0}
                      y={0}
                      width={avatarSize}
                      height={avatarSize}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  </g>
                  <rect
                    x={0}
                    y={0}
                    width={avatarSize}
                    height={avatarSize}
                    rx={14 * u}
                    fill="none"
                    stroke={colorway.ink}
                    strokeWidth={sw * 0.75}
                  />
                </g>
              )}

              <g transform={`translate(${textOffsetX.toFixed(1)}, 0)`}>
                {/* Time in DevFest Monospace Accent + Track/Room Pill */}
                <text
                  x={0}
                  y={timeFontSize + 4 * u}
                  fill={colorway.timeAccent}
                  fontFamily="'Google Sans Mono', 'JetBrains Mono', monospace"
                  fontSize={timeFontSize}
                  fontWeight={700}
                >
                  {item.time}
                </text>

                {/* Track & Room Badge */}
                <text
                  x={155 * u}
                  y={timeFontSize + 4 * u}
                  fill={colorway.mutedInk}
                  fontFamily="'Google Sans Mono', 'JetBrains Mono', monospace"
                  fontSize={metaFontSize * 0.92}
                  fontWeight={600}
                >
                  {[item.track, item.room].filter(Boolean).join(' · ')}
                </text>

                {/* Session Title */}
                {titleLines.map((line, lIdx) => (
                  <text
                    key={lIdx}
                    x={0}
                    y={timeFontSize + 8 * u + (lIdx + 1) * (titleFontSize * 1.24)}
                    fill={colorway.ink}
                    fontFamily="'Google Sans', 'Pretendard', sans-serif"
                    fontSize={titleFontSize}
                    fontWeight={800}
                    letterSpacing="-0.02em"
                  >
                    {line}
                  </text>
                ))}

                {/* Optional 1-line Description */}
                {descLines.map((line, dIdx) => (
                  <text
                    key={dIdx}
                    x={0}
                    y={
                      timeFontSize +
                      12 * u +
                      titleLines.length * (titleFontSize * 1.24) +
                      (dIdx + 1) * (metaFontSize * 1.2)
                    }
                    fill={colorway.mutedInk}
                    fontFamily="'Google Sans', 'Pretendard', sans-serif"
                    fontSize={metaFontSize * 0.95}
                    fontWeight={500}
                  >
                    {line}
                  </text>
                ))}

                {/* Speaker Name & Affiliation in Monospace (#595959) */}
                <text
                  x={0}
                  y={
                    timeFontSize +
                    14 * u +
                    titleLines.length * (titleFontSize * 1.24) +
                    descLines.length * (metaFontSize * 1.2) +
                    metaFontSize * 1.2
                  }
                  fill={colorway.mutedInk}
                  fontFamily="'Google Sans Mono', 'JetBrains Mono', monospace"
                  fontSize={metaFontSize}
                  fontWeight={600}
                >
                  {`${item.name}${item.affiliation ? ` · ${item.affiliation}` : ''}${
                    item.role ? ` (${item.role})` : ''
                  }`}
                </text>
              </g>
            </g>
          );
        })}

        {/* Bottom-Left Cutout on Canvas: GDG `< >` Logo + 3-Circle Caterpillar Blob */}
        <GdgBracketLogo
          x={cardX + 8 * u}
          y={cardY + cardH - cutBLH + (cutBLH - 40 * u) / 2}
          scale={u * 1.0}
          strokeColor={colorway.ink}
          strokeWidth={sw}
          customLogoUrl={eventMeta.gdgLogoDataUrl}
          customLogoScale={eventMeta.gdgLogoScale || 1}
        />

        <CaterpillarBlob
          x={cardX + 112 * u}
          y={cardY + cardH - cutBLH + (cutBLH - 68 * u) / 2}
          width={Math.min(185 * u, cutBLW - 125 * u)}
          fill={colorway.caterpillarFill}
          stroke={colorway.ink}
          strokeWidth={sw}
        />

        {/* Bottom-Right Chapter Label inside card */}
        <text
          x={cardX + cardW - 32 * u}
          y={cardY + cardH - 24 * u}
          textAnchor="end"
          fill={colorway.mutedInk}
          fontFamily="'Google Sans Mono', 'JetBrains Mono', monospace"
          fontSize={16 * u}
          fontWeight={600}
        >
          {`${eventMeta.chapterLabel} · ${eventMeta.eventTitle} ${eventMeta.locationText} ${eventMeta.yearText}`}
        </text>
      </g>
    );
  };

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="100%"
      style={{
        display: 'block',
        maxWidth: '100%',
        maxHeight: '100%',
        userSelect: 'none',
      }}
    >
      <defs>
        <filter id="df-filter-grayscale">
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <filter id="df-filter-contrast">
          <feComponentTransfer>
            <feFuncR type="linear" slope="1.15" intercept="-0.05" />
            <feFuncG type="linear" slope="1.15" intercept="-0.05" />
            <feFuncB type="linear" slope="1.15" intercept="-0.05" />
          </feComponentTransfer>
        </filter>
      </defs>

      {/* Canvas Background */}
      <rect x={0} y={0} width={W} height={H} fill={colorway.canvasBg} />

      {/* Main Content */}
      {mode === 'speaker' ? renderSpeakerAsset() : renderTimetableAsset()}

      {/* Custom Uploaded Logo (if any) */}
      {eventMeta.customLogoDataUrl && (
        <image
          href={eventMeta.customLogoDataUrl}
          x={W - 160 * u}
          y={H - 85 * u}
          width={120 * u}
          height={50 * u}
          preserveAspectRatio="xMaxYMid meet"
        />
      )}

      {/* Optional Print / X-Banner Crop & Grommet Marks */}
      {eventMeta.showCropMarks && (
        <g stroke={canvasTextColor} strokeWidth={1.5 * u} opacity={0.65} fill="none">
          {/* Corner crop marks */}
          <path d={`M ${18 * u} ${36 * u} V ${18 * u} H ${36 * u}`} />
          <path d={`M ${W - 36 * u} ${18 * u} H ${W - 18 * u} V ${36 * u}`} />
          <path d={`M ${18 * u} ${H - 36 * u} V ${H - 18 * u} H ${36 * u}`} />
          <path d={`M ${W - 36 * u} ${H - 18 * u} H ${W - 18 * u} V ${H - 36 * u}`} />
          {/* X-Banner Grommet punch circles */}
          <circle cx={42 * u} cy={42 * u} r={10 * u} strokeDasharray={`${4 * u} ${3 * u}`} />
          <circle cx={W - 42 * u} cy={42 * u} r={10 * u} strokeDasharray={`${4 * u} ${3 * u}`} />
          <circle cx={42 * u} cy={H - 42 * u} r={10 * u} strokeDasharray={`${4 * u} ${3 * u}`} />
          <circle
            cx={W - 42 * u}
            cy={H - 42 * u}
            r={10 * u}
            strokeDasharray={`${4 * u} ${3 * u}`}
          />
        </g>
      )}
    </svg>
  );
}
