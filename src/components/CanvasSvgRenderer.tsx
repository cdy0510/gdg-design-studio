'use client';

import React from 'react';
import {
  BaseAssetItem,
  CanvasPreset,
  DesignSystemTokens,
  EventInfo,
  LayoutTemplateId,
  SpeakerFrameShape,
  SpeakerProfile,
} from '@/types/studio';

interface CanvasSvgRendererProps {
  svgRef?: React.RefObject<SVGSVGElement | null>;
  preset: CanvasPreset;
  layout: LayoutTemplateId;
  designSystem: DesignSystemTokens;
  speaker: SpeakerProfile;
  allSpeakers: SpeakerProfile[];
  eventInfo: EventInfo;
  baseAssets: BaseAssetItem[];
  showPrintGuides: boolean;
  transparentBg: boolean;
}

/**
 * Splits a text string into multiple lines based on approximate character width
 * (accounting for CJK full-width characters vs ASCII half-width characters).
 */
function wrapTextLines(text: string, maxUnitsPerLine: number, maxLines = 4): string[] {
  if (!text) return [''];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';
  let currentUnits = 0;

  const measureUnits = (str: string) => {
    let u = 0;
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      u += code > 255 ? 1.85 : 1.0;
    }
    return u;
  };

  for (const word of words) {
    const wordUnits = measureUnits(word);
    if (!currentLine) {
      currentLine = word;
      currentUnits = wordUnits;
    } else if (currentUnits + 1 + wordUnits <= maxUnitsPerLine) {
      currentLine += ' ' + word;
      currentUnits += 1 + wordUnits;
    } else {
      lines.push(currentLine);
      currentLine = word;
      currentUnits = wordUnits;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  if (lines.length > maxLines) {
    const sliced = lines.slice(0, maxLines);
    sliced[maxLines - 1] = sliced[maxLines - 1].replace(/\.*$/, '') + '…';
    return sliced;
  }

  return lines;
}

/**
 * Generates an SVG path for various speaker frame shapes centered at (cx, cy) with size (w, h).
 */
function getSpeakerFramePath(
  shape: SpeakerFrameShape,
  cx: number,
  cy: number,
  w: number,
  h: number,
  radius: number
): string {
  const x = cx - w / 2;
  const y = cy - h / 2;

  switch (shape) {
    case 'circle': {
      const r = Math.min(w, h) / 2;
      return `M ${cx - r}, ${cy} a ${r},${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 -${r * 2},0`;
    }
    case 'arch': {
      const rTop = w / 2;
      const rBottom = Math.min(32, radius);
      return [
        `M ${x} ${y + rTop}`,
        `A ${rTop} ${rTop} 0 0 1 ${x + w} ${y + rTop}`,
        `L ${x + w} ${y + h - rBottom}`,
        `Q ${x + w} ${y + h} ${x + w - rBottom} ${y + h}`,
        `L ${x + rBottom} ${y + h}`,
        `Q ${x} ${y + h} ${x} ${y + h - rBottom}`,
        'Z',
      ].join(' ');
    }
    case 'hexagon': {
      const rx = w / 2;
      const ry = h / 2;
      const pts = [
        [cx, cy - ry],
        [cx + rx * 0.92, cy - ry * 0.5],
        [cx + rx * 0.92, cy + ry * 0.5],
        [cx, cy + ry],
        [cx - rx * 0.92, cy + ry * 0.5],
        [cx - rx * 0.92, cy - ry * 0.5],
      ];
      return `M ${pts.map((p) => p.join(',')).join(' L ')} Z`;
    }
    case 'pill': {
      const r = Math.min(w, h) / 2;
      return [
        `M ${x + r} ${y}`,
        `L ${x + w - r} ${y}`,
        `A ${r} ${r} 0 0 1 ${x + w} ${y + r}`,
        `L ${x + w} ${y + h - r}`,
        `A ${r} ${r} 0 0 1 ${x + w - r} ${y + h}`,
        `L ${x + r} ${y + h}`,
        `A ${r} ${r} 0 0 1 ${x} ${y + h - r}`,
        `L ${x} ${y + r}`,
        `A ${r} ${r} 0 0 1 ${x + r} ${y}`,
        'Z',
      ].join(' ');
    }
    case 'rounded':
    default: {
      const r = Math.min(radius, w / 4, h / 4);
      return [
        `M ${x + r} ${y}`,
        `L ${x + w - r} ${y}`,
        `Q ${x + w} ${y} ${x + w} ${y + r}`,
        `L ${x + w} ${y + h - r}`,
        `Q ${x + w} ${y + h} ${x + w - r} ${y + h}`,
        `L ${x + r} ${y + h}`,
        `Q ${x} ${y + h} ${x} ${y + h - r}`,
        `L ${x} ${y + r}`,
        `Q ${x} ${y} ${x + r} ${y}`,
        'Z',
      ].join(' ');
    }
  }
}

export const CanvasSvgRenderer: React.FC<CanvasSvgRendererProps> = ({
  svgRef,
  preset,
  layout,
  designSystem,
  speaker,
  allSpeakers,
  eventInfo,
  baseAssets,
  showPrintGuides,
  transparentBg,
}) => {
  const { width: W, height: H } = preset;
  const { colors, typography, shapes } = designSystem;
  const activeAccent = speaker.accentColorOverride || colors.primary;

  const backgroundAssets = baseAssets.filter((a) => a.visible && a.type === 'background');
  const frameAssets = baseAssets.filter((a) => a.visible && a.type === 'frame');
  const foregroundAssets = baseAssets.filter(
    (a) => a.visible && a.type !== 'background' && a.type !== 'frame'
  );

  const filterAttr =
    speaker.photoFilter !== 'none' ? `url(#filter-${speaker.photoFilter})` : undefined;

  // Helper to render merged speaker portrait at (cx, cy) with (frameW, frameH)
  const renderSpeakerPortrait = (
    cx: number,
    cy: number,
    frameW: number,
    frameH: number,
    clipId: string
  ) => {
    const framePath = getSpeakerFramePath(
      shapes.speakerFrameShape,
      cx,
      cy,
      frameW,
      frameH,
      shapes.borderRadius
    );
    const shadowOffset = shapes.shadowStyle === 'brutalist' ? Math.max(10, frameW * 0.03) : 0;
    const shadowPath =
      shadowOffset > 0
        ? getSpeakerFramePath(
            shapes.speakerFrameShape,
            cx + shadowOffset,
            cy + shadowOffset,
            frameW,
            frameH,
            shapes.borderRadius
          )
        : '';

    const imgW = frameW * speaker.photoScale;
    const imgH = frameH * speaker.photoScale;
    const imgX = cx - imgW / 2 + (speaker.photoOffsetX / 100) * frameW;
    const imgY = cy - imgH / 2 + (speaker.photoOffsetY / 100) * frameH;

    return (
      <g>
        <defs>
          <clipPath id={clipId}>
            <path d={framePath} />
          </clipPath>
        </defs>

        {/* Optional AI Aura / Studio Glow behind speaker */}
        {(speaker.aiAuraEnabled || shapes.shadowStyle === 'glow') && (
          <g opacity="0.75">
            <circle
              cx={cx - frameW * 0.18}
              cy={cy - frameH * 0.15}
              r={frameW * 0.45}
              fill="url(#aiAuraGrad)"
              filter="url(#blurGlow)"
            />
            <circle
              cx={cx + frameW * 0.2}
              cy={cy + frameH * 0.18}
              r={frameW * 0.4}
              fill={colors.accent}
              opacity="0.3"
              filter="url(#blurGlow)"
            />
          </g>
        )}

        {/* Brutalist Offset Shadow */}
        {shadowOffset > 0 && <path d={shadowPath} fill={colors.border} />}

        {/* Frame Base Fill */}
        <path d={framePath} fill={colors.surface} />

        {/* Clipped Speaker Photo + Merged Frame Overlay */}
        <g clipPath={`url(#${clipId})`}>
          {/* Subtle inner studio backdrop */}
          <rect
            x={cx - frameW / 2}
            y={cy - frameH / 2}
            width={frameW}
            height={frameH}
            fill="url(#speakerBackdropGrad)"
          />
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
          {/* Inner bottom gradient for depth */}
          <rect
            x={cx - frameW / 2}
            y={cy + frameH * 0.15}
            width={frameW}
            height={frameH * 0.35}
            fill="url(#bottomVignette)"
          />
        </g>

        {/* Frame Stroke */}
        {shapes.borderWidth > 0 && (
          <path
            d={framePath}
            fill="none"
            stroke={colors.border}
            strokeWidth={shapes.borderWidth * 1.5}
          />
        )}

        {/* GDG 4-Color Corner Spark Accents */}
        <circle
          cx={cx - frameW * 0.44}
          cy={cy - frameH * 0.42}
          r={Math.max(12, frameW * 0.04)}
          fill={colors.accent}
          stroke={colors.border}
          strokeWidth={Math.max(2, shapes.borderWidth)}
        />
        <rect
          x={cx + frameW * 0.36}
          y={cy + frameH * 0.34}
          width={Math.max(26, frameW * 0.09)}
          height={Math.max(26, frameW * 0.09)}
          rx={8}
          transform={`rotate(15 ${cx + frameW * 0.4} ${cy + frameH * 0.38})`}
          fill={colors.success}
          stroke={colors.border}
          strokeWidth={Math.max(2, shapes.borderWidth)}
        />
      </g>
    );
  };

  // Render pattern background based on designSystem.shapes.patternStyle
  const renderPatternOverlay = () => {
    switch (shapes.patternStyle) {
      case 'dots':
        return <rect width={W} height={H} fill="url(#pattern-dots)" opacity="0.4" />;
      case 'grid':
        return <rect width={W} height={H} fill="url(#pattern-grid)" opacity="0.28" />;
      case 'aurora':
        return (
          <g opacity="0.55">
            <circle
              cx={W * 0.82}
              cy={H * 0.18}
              r={Math.max(W, H) * 0.34}
              fill={colors.primary}
              filter="url(#blurGlowLarge)"
            />
            <circle
              cx={W * 0.18}
              cy={H * 0.82}
              r={Math.max(W, H) * 0.3}
              fill={colors.secondary}
              filter="url(#blurGlowLarge)"
            />
          </g>
        );
      case 'geometric':
        return (
          <g opacity="0.85">
            <circle
              cx={W * 0.92}
              cy={H * 0.12}
              r={Math.min(W, H) * 0.14}
              fill={colors.accent}
              stroke={colors.border}
              strokeWidth={shapes.borderWidth}
            />
            <path
              d={`M ${W * 0.05} ${H * 0.88} L ${W * 0.16} ${H * 0.96} L ${W * 0.03} ${H * 0.97} Z`}
              fill={colors.primary}
              stroke={colors.border}
              strokeWidth={shapes.borderWidth}
            />
          </g>
        );
      default:
        return null;
    }
  };

  // Render layout content depending on `layout`
  const renderLayoutContent = () => {
    const padX = Math.round(W * 0.065);
    const padY = Math.round(H * 0.065);

    // ------------------------------------------------------------------------
    // LAYOUT 1: X-BANNER STANDEE (1200 x 3600 or vertical tall standee)
    // ------------------------------------------------------------------------
    if (layout === 'x-banner') {
      const cardX = padX;
      const cardW = W - padX * 2;
      const titleLines = wrapTextLines(speaker.topic, 19, 4);

      return (
        <g>
          {/* Top GDG Color Ribbon */}
          <g>
            <rect x={0} y={0} width={W * 0.25} height={28} fill={colors.primary} />
            <rect x={W * 0.25} y={0} width={W * 0.25} height={28} fill={colors.secondary} />
            <rect x={W * 0.5} y={0} width={W * 0.25} height={28} fill={colors.accent} />
            <rect x={W * 0.75} y={0} width={W * 0.25} height={28} fill={colors.success} />
          </g>

          {/* Header Pill & Event Title */}
          <g transform={`translate(${padX}, ${H * 0.065})`}>
            <rect
              x={0}
              y={0}
              width={420}
              height={76}
              rx={38}
              fill={activeAccent}
              stroke={colors.border}
              strokeWidth={shapes.borderWidth}
            />
            <text
              x={210}
              y={48}
              textAnchor="middle"
              fontFamily={typography.monoFont}
              fontWeight="800"
              fontSize="30"
              fill="#FFFFFF"
            >
              {eventInfo.chapterName.toUpperCase()}
            </text>

            <text
              x={0}
              y={170}
              fontFamily={typography.headingFont}
              fontWeight={typography.headingWeight}
              fontSize="78"
              letterSpacing={typography.letterSpacing}
              fill={colors.textPrimary}
            >
              {eventInfo.eventName}
            </text>
            <text
              x={0}
              y={235}
              fontFamily={typography.bodyFont}
              fontWeight="600"
              fontSize="36"
              fill={colors.textSecondary}
            >
              {eventInfo.subtitle}
            </text>
          </g>

          {/* Center Merged Speaker Portrait */}
          {renderSpeakerPortrait(W / 2, H * 0.37, W * 0.62, W * 0.68, 'xbanner-speaker-clip')}

          {/* Speaker Nameplate */}
          <g transform={`translate(${W / 2}, ${H * 0.525})`}>
            <rect
              x={-340}
              y={-56}
              width={680}
              height={136}
              rx={shapes.borderRadius}
              fill={colors.surface}
              stroke={colors.border}
              strokeWidth={shapes.borderWidth * 1.4}
            />
            <text
              x={0}
              y={2}
              textAnchor="middle"
              fontFamily={typography.headingFont}
              fontWeight="900"
              fontSize="48"
              fill={colors.textPrimary}
            >
              {speaker.name}
            </text>
            <text
              x={0}
              y={52}
              textAnchor="middle"
              fontFamily={typography.bodyFont}
              fontWeight="700"
              fontSize="28"
              fill={activeAccent}
            >
              {speaker.role} · {speaker.company}
            </text>
          </g>

          {/* Session Card */}
          <g transform={`translate(${cardX}, ${H * 0.59})`}>
            {shapes.shadowStyle === 'brutalist' && (
              <rect
                x={14}
                y={14}
                width={cardW}
                height={H * 0.24}
                rx={shapes.borderRadius * 1.2}
                fill={colors.border}
              />
            )}
            <rect
              x={0}
              y={0}
              width={cardW}
              height={H * 0.24}
              rx={shapes.borderRadius * 1.2}
              fill={colors.surface}
              stroke={colors.border}
              strokeWidth={shapes.borderWidth * 1.5}
            />

            {/* Track Badge */}
            <rect
              x={56}
              y={52}
              width={360}
              height={64}
              rx={16}
              fill={colors.accent}
              stroke={colors.border}
              strokeWidth={Math.max(2, shapes.borderWidth)}
            />
            <text
              x={236}
              y={94}
              textAnchor="middle"
              fontFamily={typography.monoFont}
              fontWeight="800"
              fontSize="28"
              fill="#202124"
            >
              {speaker.track}
            </text>

            {/* Session Title */}
            <text
              x={56}
              y={200}
              fontFamily={typography.headingFont}
              fontWeight={typography.headingWeight}
              fontSize="60"
              fill={colors.textPrimary}
            >
              {titleLines.map((line, i) => (
                <tspan key={i} x={56} dy={i === 0 ? 0 : 78}>
                  {line}
                </tspan>
              ))}
            </text>

            {/* Session Meta */}
            <line
              x1={56}
              y1={H * 0.24 - 190}
              x2={cardW - 56}
              y2={H * 0.24 - 190}
              stroke={colors.border}
              strokeWidth="2"
              strokeOpacity="0.25"
            />
            <text
              x={56}
              y={H * 0.24 - 115}
              fontFamily={typography.monoFont}
              fontWeight="700"
              fontSize="34"
              fill={colors.textPrimary}
            >
              🕒 {speaker.dateTime}
            </text>
            <text
              x={56}
              y={H * 0.24 - 55}
              fontFamily={typography.bodyFont}
              fontWeight="700"
              fontSize="34"
              fill={colors.textSecondary}
            >
              📍 {speaker.venue}
            </text>
          </g>

          {/* Bottom Standee Footer + QR Placeholder */}
          <g transform={`translate(${padX}, ${H * 0.865})`}>
            <rect
              x={0}
              y={0}
              width={cardW}
              height={280}
              rx={shapes.borderRadius}
              fill={colors.textPrimary}
            />
            <text
              x={56}
              y={105}
              fontFamily={typography.headingFont}
              fontWeight="800"
              fontSize="44"
              fill={colors.background}
            >
              {eventInfo.location}
            </text>
            <text
              x={56}
              y={168}
              fontFamily={typography.monoFont}
              fontWeight="600"
              fontSize="30"
              fill={colors.accent}
            >
              {eventInfo.ctaText}
            </text>
            <text
              x={56}
              y={222}
              fontFamily={typography.monoFont}
              fontWeight="600"
              fontSize="26"
              fill={colors.background}
              opacity="0.75"
            >
              {eventInfo.hashtag}
            </text>

            {/* Simulated Vector QR Code Box */}
            <g transform={`translate(${cardW - 230}, 40)`}>
              <rect width={190} height={200} rx={18} fill="#FFFFFF" />
              <rect x={22} y={22} width={44} height={44} fill="#202124" />
              <rect x={30} y={30} width={28} height={28} fill="#FFFFFF" />
              <rect x={36} y={36} width={16} height={16} fill="#202124" />

              <rect x={124} y={22} width={44} height={44} fill="#202124" />
              <rect x={132} y={30} width={28} height={28} fill="#FFFFFF" />
              <rect x={138} y={36} width={16} height={16} fill="#202124" />

              <rect x={22} y={114} width={44} height={44} fill="#202124" />
              <rect x={30} y={122} width={28} height={28} fill="#FFFFFF" />
              <rect x={36} y={128} width={16} height={16} fill="#202124" />

              <rect x={78} y={26} width={14} height={14} fill="#202124" />
              <rect x={78} y={54} width={28} height={14} fill="#202124" />
              <rect x={26} y={78} width={36} height={14} fill="#202124" />
              <rect x={78} y={78} width={28} height={28} fill="#4285F4" />
              <rect x={118} y={78} width={46} height={14} fill="#202124" />
              <rect x={82} y={118} width={30} height={14} fill="#202124" />
              <rect x={124} y={114} width={44} height={44} fill="#202124" />
              <rect x={136} y={126} width={20} height={20} fill="#EA4335" />
              <text
                x={95}
                y={184}
                textAnchor="middle"
                fontFamily={typography.monoFont}
                fontWeight="800"
                fontSize="16"
                fill="#202124"
              >
                SCAN CHECK-IN
              </text>
            </g>
          </g>
        </g>
      );
    }

    // ------------------------------------------------------------------------
    // LAYOUT 2: 3-FOLD PAMPHLET / LEAFLET (2480 x 1754 or wide landscape)
    // ------------------------------------------------------------------------
    if (layout === 'pamphlet-trifold') {
      const colW = W / 3;
      const innerPad = Math.round(colW * 0.085);
      const cardW = colW - innerPad * 2;
      const introLines = wrapTextLines(eventInfo.pamphletIntro, 24, 4);
      const topicLines = wrapTextLines(speaker.topic, 22, 3);

      return (
        <g>
          {/* Column 1 (Left Panel): Event Overview & Venue Map Info */}
          <g transform={`translate(${innerPad}, ${padY})`}>
            <rect
              x={0}
              y={0}
              width={cardW}
              height={H - padY * 2}
              rx={shapes.borderRadius}
              fill={colors.surface}
              stroke={colors.border}
              strokeWidth={shapes.borderWidth}
            />
            <g transform="translate(44, 52)">
              <rect
                x={0}
                y={0}
                width={220}
                height={44}
                rx={22}
                fill={colors.primary}
              />
              <text
                x={110}
                y={29}
                textAnchor="middle"
                fontFamily={typography.monoFont}
                fontWeight="800"
                fontSize="18"
                fill="#FFFFFF"
              >
                ABOUT EVENT
              </text>

              <text
                x={0}
                y={110}
                fontFamily={typography.headingFont}
                fontWeight="900"
                fontSize="44"
                fill={colors.textPrimary}
              >
                {eventInfo.eventName}
              </text>
              <text
                x={0}
                y={155}
                fontFamily={typography.bodyFont}
                fontWeight="700"
                fontSize="22"
                fill={colors.secondary}
              >
                {eventInfo.subtitle}
              </text>

              <text
                x={0}
                y={220}
                fontFamily={typography.bodyFont}
                fontWeight="500"
                fontSize="24"
                fill={colors.textSecondary}
              >
                {introLines.map((line, idx) => (
                  <tspan key={idx} x={0} dy={idx === 0 ? 0 : 38}>
                    {line}
                  </tspan>
                ))}
              </text>

              {/* Venue & Date Info Box */}
              <g transform={`translate(0, 410)`}>
                <rect
                  x={0}
                  y={0}
                  width={cardW - 88}
                  height={210}
                  rx={20}
                  fill={colors.background}
                  stroke={colors.border}
                  strokeWidth={Math.max(2, shapes.borderWidth * 0.75)}
                />
                <text
                  x={28}
                  y={52}
                  fontFamily={typography.monoFont}
                  fontWeight="800"
                  fontSize="20"
                  fill={colors.primary}
                >
                  DATE &amp; TIME
                </text>
                <text
                  x={28}
                  y={88}
                  fontFamily={typography.bodyFont}
                  fontWeight="700"
                  fontSize="24"
                  fill={colors.textPrimary}
                >
                  {eventInfo.date}
                </text>
                <text
                  x={28}
                  y={140}
                  fontFamily={typography.monoFont}
                  fontWeight="800"
                  fontSize="20"
                  fill={colors.success}
                >
                  VENUE LOCATION
                </text>
                <text
                  x={28}
                  y={176}
                  fontFamily={typography.bodyFont}
                  fontWeight="700"
                  fontSize="24"
                  fill={colors.textPrimary}
                >
                  {eventInfo.location}
                </text>
              </g>

              {/* Speaker Roster Preview inside Pamphlet Col 1 */}
              <g transform="translate(0, 670)">
                <text
                  x={0}
                  y={0}
                  fontFamily={typography.monoFont}
                  fontWeight="800"
                  fontSize="22"
                  fill={colors.textPrimary}
                >
                  FEATURED SPEAKERS ({allSpeakers.length})
                </text>
                {allSpeakers.slice(0, 3).map((spk, idx) => (
                  <g key={spk.id} transform={`translate(0, ${28 + idx * 115})`}>
                    <rect
                      x={0}
                      y={0}
                      width={cardW - 88}
                      height={98}
                      rx={16}
                      fill={spk.id === speaker.id ? colors.background : colors.surface}
                      stroke={spk.id === speaker.id ? activeAccent : colors.border}
                      strokeWidth={spk.id === speaker.id ? 3 : 1.5}
                    />
                    <circle cx={48} cy={49} r={30} fill={colors.primary} opacity="0.2" />
                    {spk.photoDataUrl && (
                      <image
                        href={spk.photoDataUrl}
                        x={18}
                        y={19}
                        width={60}
                        height={60}
                        preserveAspectRatio="xMidYMid slice"
                      />
                    )}
                    <text
                      x={96}
                      y={42}
                      fontFamily={typography.headingFont}
                      fontWeight="800"
                      fontSize="22"
                      fill={colors.textPrimary}
                    >
                      {spk.name}
                    </text>
                    <text
                      x={96}
                      y={72}
                      fontFamily={typography.bodyFont}
                      fontWeight="600"
                      fontSize="18"
                      fill={colors.textSecondary}
                    >
                      {spk.company} · {spk.track}
                    </text>
                  </g>
                ))}
              </g>
            </g>
          </g>

          {/* Column 2 (Center Panel): Timetable & Track Schedule */}
          <g transform={`translate(${colW + innerPad}, ${padY})`}>
            <rect
              x={0}
              y={0}
              width={cardW}
              height={H - padY * 2}
              rx={shapes.borderRadius}
              fill={colors.surface}
              stroke={colors.border}
              strokeWidth={shapes.borderWidth}
            />
            <g transform="translate(44, 52)">
              <rect
                x={0}
                y={0}
                width={260}
                height={44}
                rx={22}
                fill={colors.accent}
                stroke={colors.border}
                strokeWidth="2"
              />
              <text
                x={130}
                y={29}
                textAnchor="middle"
                fontFamily={typography.monoFont}
                fontWeight="800"
                fontSize="18"
                fill="#202124"
              >
                SESSION TIMETABLE
              </text>

              <text
                x={0}
                y={105}
                fontFamily={typography.headingFont}
                fontWeight="900"
                fontSize="40"
                fill={colors.textPrimary}
              >
                프로그램 타임테이블
              </text>

              {eventInfo.schedule.map((item, idx) => {
                const itemLines = wrapTextLines(item.title, 26, 2);
                const badgeColors = [
                  colors.primary,
                  colors.secondary,
                  colors.success,
                  colors.accent,
                ];
                return (
                  <g key={idx} transform={`translate(0, ${150 + idx * 255})`}>
                    <rect
                      x={0}
                      y={0}
                      width={cardW - 88}
                      height={230}
                      rx={20}
                      fill={colors.background}
                      stroke={colors.border}
                      strokeWidth={Math.max(2, shapes.borderWidth * 0.75)}
                    />
                    <rect
                      x={24}
                      y={22}
                      width={185}
                      height={36}
                      rx={10}
                      fill={badgeColors[idx % badgeColors.length]}
                    />
                    <text
                      x={116}
                      y={46}
                      textAnchor="middle"
                      fontFamily={typography.monoFont}
                      fontWeight="800"
                      fontSize="17"
                      fill="#FFFFFF"
                    >
                      {item.time}
                    </text>
                    <text
                      x={225}
                      y={46}
                      fontFamily={typography.monoFont}
                      fontWeight="700"
                      fontSize="17"
                      fill={colors.textSecondary}
                    >
                      {item.track}
                    </text>

                    <text
                      x={24}
                      y={98}
                      fontFamily={typography.headingFont}
                      fontWeight="800"
                      fontSize="24"
                      fill={colors.textPrimary}
                    >
                      {itemLines.map((l, i) => (
                        <tspan key={i} x={24} dy={i === 0 ? 0 : 32}>
                          {l}
                        </tspan>
                      ))}
                    </text>

                    <text
                      x={24}
                      y={195}
                      fontFamily={typography.bodyFont}
                      fontWeight="700"
                      fontSize="20"
                      fill={activeAccent}
                    >
                      🎙 {item.speaker}
                    </text>
                  </g>
                );
              })}
            </g>
          </g>

          {/* Column 3 (Right Front Cover Panel): Featured Speaker & Cover */}
          <g transform={`translate(${colW * 2 + innerPad}, ${padY})`}>
            {shapes.shadowStyle === 'brutalist' && (
              <rect
                x={12}
                y={12}
                width={cardW}
                height={H - padY * 2}
                rx={shapes.borderRadius}
                fill={colors.border}
              />
            )}
            <rect
              x={0}
              y={0}
              width={cardW}
              height={H - padY * 2}
              rx={shapes.borderRadius}
              fill={colors.surface}
              stroke={colors.border}
              strokeWidth={shapes.borderWidth * 1.4}
            />

            {/* Cover Header */}
            <text
              x={cardW / 2}
              y={88}
              textAnchor="middle"
              fontFamily={typography.monoFont}
              fontWeight="800"
              fontSize="22"
              fill={activeAccent}
            >
              {eventInfo.chapterName} · PAMPHLET COVER
            </text>
            <text
              x={cardW / 2}
              y={145}
              textAnchor="middle"
              fontFamily={typography.headingFont}
              fontWeight="900"
              fontSize="44"
              fill={colors.textPrimary}
            >
              {eventInfo.eventName}
            </text>

            {/* Merged Speaker Portrait in Cover Panel */}
            {renderSpeakerPortrait(
              cardW / 2,
              490,
              cardW * 0.62,
              cardW * 0.66,
              'pamphlet-speaker-clip'
            )}

            {/* Speaker & Keynote Spotlight */}
            <text
              x={cardW / 2}
              y={815}
              textAnchor="middle"
              fontFamily={typography.headingFont}
              fontWeight="900"
              fontSize="40"
              fill={colors.textPrimary}
            >
              {speaker.name}
            </text>
            <text
              x={cardW / 2}
              y={858}
              textAnchor="middle"
              fontFamily={typography.bodyFont}
              fontWeight="700"
              fontSize="22"
              fill={activeAccent}
            >
              {speaker.role} @ {speaker.company}
            </text>

            <g transform={`translate(48, 915)`}>
              <rect
                x={0}
                y={0}
                width={cardW - 96}
                height={290}
                rx={24}
                fill={colors.background}
                stroke={colors.border}
                strokeWidth={shapes.borderWidth}
              />
              <text
                x={32}
                y={50}
                fontFamily={typography.monoFont}
                fontWeight="800"
                fontSize="20"
                fill={colors.secondary}
              >
                HIGHLIGHT SESSION · {speaker.track}
              </text>
              <text
                x={32}
                y={104}
                fontFamily={typography.headingFont}
                fontWeight="800"
                fontSize="28"
                fill={colors.textPrimary}
              >
                {topicLines.map((line, i) => (
                  <tspan key={i} x={32} dy={i === 0 ? 0 : 40}>
                    {line}
                  </tspan>
                ))}
              </text>
              <text
                x={32}
                y={252}
                fontFamily={typography.monoFont}
                fontWeight="700"
                fontSize="20"
                fill={colors.textSecondary}
              >
                {speaker.dateTime} | {speaker.venue}
              </text>
            </g>

            {/* Bottom Cover Footer */}
            <text
              x={cardW / 2}
              y={H - padY * 2 - 48}
              textAnchor="middle"
              fontFamily={typography.monoFont}
              fontWeight="800"
              fontSize="22"
              fill={colors.textSecondary}
            >
              {eventInfo.hashtag}
            </text>
          </g>
        </g>
      );
    }

    // ------------------------------------------------------------------------
    // LAYOUT 3: SESSION BANNER (Horizontal 16:9 or 1.91:1 LinkedIn/YouTube)
    // ------------------------------------------------------------------------
    if (layout === 'session-banner') {
      const leftW = W * 0.56;
      const titleLines = wrapTextLines(speaker.topic, 22, 3);
      const fontSizeTitle = Math.round(W * 0.036);

      return (
        <g>
          {/* Main Surface Card */}
          {shapes.shadowStyle === 'brutalist' && (
            <rect
              x={padX + 12}
              y={padY + 12}
              width={W - padX * 2}
              height={H - padY * 2}
              rx={shapes.borderRadius}
              fill={colors.border}
            />
          )}
          <rect
            x={padX}
            y={padY}
            width={W - padX * 2}
            height={H - padY * 2}
            rx={shapes.borderRadius}
            fill={colors.surface}
            stroke={colors.border}
            strokeWidth={shapes.borderWidth * 1.2}
          />

          {/* Left Column: Event Info + Session Title + Speaker Meta */}
          <g transform={`translate(${padX + W * 0.045}, ${padY + H * 0.11})`}>
            {/* Track Badge */}
            <rect
              x={0}
              y={0}
              width={Math.max(240, W * 0.22)}
              height={Math.max(44, H * 0.065)}
              rx={22}
              fill={activeAccent}
              stroke={colors.border}
              strokeWidth={Math.max(2, shapes.borderWidth * 0.8)}
            />
            <text
              x={Math.max(120, W * 0.11)}
              y={Math.max(29, H * 0.044)}
              textAnchor="middle"
              fontFamily={typography.monoFont}
              fontWeight="800"
              fontSize={Math.round(H * 0.028)}
              fill="#FFFFFF"
            >
              {speaker.track}
            </text>

            {/* Event Subtitle */}
            <text
              x={0}
              y={H * 0.14}
              fontFamily={typography.monoFont}
              fontWeight="800"
              fontSize={Math.round(H * 0.03)}
              fill={colors.textSecondary}
            >
              {eventInfo.eventName} · {eventInfo.chapterName}
            </text>

            {/* Session Title */}
            <text
              x={0}
              y={H * 0.24}
              fontFamily={typography.headingFont}
              fontWeight={typography.headingWeight}
              fontSize={fontSizeTitle}
              letterSpacing={typography.letterSpacing}
              fill={colors.textPrimary}
            >
              {titleLines.map((line, idx) => (
                <tspan key={idx} x={0} dy={idx === 0 ? 0 : fontSizeTitle * 1.28}>
                  {line}
                </tspan>
              ))}
            </text>

            {/* Speaker Name & Role */}
            <g transform={`translate(0, ${H * 0.56})`}>
              <text
                x={0}
                y={0}
                fontFamily={typography.headingFont}
                fontWeight="900"
                fontSize={Math.round(H * 0.048)}
                fill={colors.textPrimary}
              >
                {speaker.name}
              </text>
              <text
                x={0}
                y={H * 0.052}
                fontFamily={typography.bodyFont}
                fontWeight="700"
                fontSize={Math.round(H * 0.03)}
                fill={activeAccent}
              >
                {speaker.role} · {speaker.company}
              </text>
            </g>

            {/* Date & Venue Footer */}
            <g transform={`translate(0, ${H * 0.71})`}>
              <text
                x={0}
                y={0}
                fontFamily={typography.monoFont}
                fontWeight="700"
                fontSize={Math.round(H * 0.026)}
                fill={colors.textSecondary}
              >
                📅 {speaker.dateTime} &nbsp;|&nbsp; 📍 {speaker.venue}
              </text>
            </g>
          </g>

          {/* Right Column: Merged Speaker Photo */}
          {renderSpeakerPortrait(
            leftW + (W - leftW - padX) * 0.45,
            H * 0.5,
            Math.min(W * 0.28, H * 0.62),
            Math.min(W * 0.3, H * 0.68),
            'banner-speaker-clip'
          )}
        </g>
      );
    }

    // ------------------------------------------------------------------------
    // LAYOUT 4: NAMETAG / PASS BADGE (1000 x 1400)
    // ------------------------------------------------------------------------
    if (layout === 'nametag-badge') {
      return (
        <g>
          {/* Lanyard Slot Hole at Top */}
          <rect
            x={W / 2 - 90}
            y={48}
            width={180}
            height={36}
            rx={18}
            fill={colors.background}
            stroke={colors.border}
            strokeWidth={shapes.borderWidth}
          />

          {/* Top Header Block */}
          <rect
            x={padX}
            y={120}
            width={W - padX * 2}
            height={H - 200}
            rx={shapes.borderRadius * 1.2}
            fill={colors.surface}
            stroke={colors.border}
            strokeWidth={shapes.borderWidth * 1.5}
          />

          {/* Top Color Header inside Badge */}
          <path
            d={`M ${padX} ${120 + shapes.borderRadius * 1.2}
                Q ${padX} 120 ${padX + shapes.borderRadius * 1.2} 120
                L ${W - padX - shapes.borderRadius * 1.2} 120
                Q ${W - padX} 120 ${W - padX} ${120 + shapes.borderRadius * 1.2}
                L ${W - padX} 310
                L ${padX} 310 Z`}
            fill={activeAccent}
            stroke={colors.border}
            strokeWidth={shapes.borderWidth}
          />
          <text
            x={W / 2}
            y={205}
            textAnchor="middle"
            fontFamily={typography.headingFont}
            fontWeight="900"
            fontSize="42"
            fill="#FFFFFF"
          >
            {eventInfo.eventName}
          </text>
          <text
            x={W / 2}
            y={258}
            textAnchor="middle"
            fontFamily={typography.monoFont}
            fontWeight="700"
            fontSize="24"
            fill="#FFFFFF"
            opacity="0.9"
          >
            {eventInfo.chapterName}
          </text>

          {/* Speaker Portrait */}
          {renderSpeakerPortrait(W / 2, 590, 420, 440, 'badge-speaker-clip')}

          {/* Speaker Name & Company */}
          <text
            x={W / 2}
            y={915}
            textAnchor="middle"
            fontFamily={typography.headingFont}
            fontWeight="900"
            fontSize="54"
            fill={colors.textPrimary}
          >
            {speaker.name}
          </text>
          <text
            x={W / 2}
            y={975}
            textAnchor="middle"
            fontFamily={typography.bodyFont}
            fontWeight="700"
            fontSize="30"
            fill={activeAccent}
          >
            {speaker.company}
          </text>
          <text
            x={W / 2}
            y={1022}
            textAnchor="middle"
            fontFamily={typography.bodyFont}
            fontWeight="600"
            fontSize="24"
            fill={colors.textSecondary}
          >
            {speaker.role}
          </text>

          {/* Role Pill Bottom */}
          <rect
            x={W / 2 - 220}
            y={1090}
            width={440}
            height={96}
            rx={48}
            fill={colors.secondary}
            stroke={colors.border}
            strokeWidth={shapes.borderWidth}
          />
          <text
            x={W / 2}
            y={1152}
            textAnchor="middle"
            fontFamily={typography.monoFont}
            fontWeight="900"
            fontSize="40"
            letterSpacing="0.08em"
            fill="#FFFFFF"
          >
            SPEAKER
          </text>
        </g>
      );
    }

    // ------------------------------------------------------------------------
    // LAYOUT 5: MAIN EVENT POSTER (A2/A3 or 4:5 Portrait)
    // ------------------------------------------------------------------------
    if (layout === 'main-poster') {
      const cardW = W - padX * 2;
      const titleLines = wrapTextLines(speaker.topic, 20, 3);

      return (
        <g>
          {/* Poster Outer Frame */}
          {shapes.shadowStyle === 'brutalist' && (
            <rect
              x={padX + 14}
              y={padY + 14}
              width={cardW}
              height={H - padY * 2}
              rx={shapes.borderRadius * 1.2}
              fill={colors.border}
            />
          )}
          <rect
            x={padX}
            y={padY}
            width={cardW}
            height={H - padY * 2}
            rx={shapes.borderRadius * 1.2}
            fill={colors.surface}
            stroke={colors.border}
            strokeWidth={shapes.borderWidth * 1.4}
          />

          {/* Event Header Section */}
          <g transform={`translate(${padX + 64}, ${padY + 86})`}>
            <rect
              x={0}
              y={0}
              width={320}
              height={54}
              rx={27}
              fill={colors.accent}
              stroke={colors.border}
              strokeWidth={Math.max(2, shapes.borderWidth)}
            />
            <text
              x={160}
              y={36}
              textAnchor="middle"
              fontFamily={typography.monoFont}
              fontWeight="800"
              fontSize="24"
              fill="#202124"
            >
              {eventInfo.chapterName}
            </text>

            <text
              x={0}
              y={136}
              fontFamily={typography.headingFont}
              fontWeight="900"
              fontSize={Math.round(W * 0.056)}
              letterSpacing={typography.letterSpacing}
              fill={colors.textPrimary}
            >
              {eventInfo.eventName}
            </text>
            <text
              x={0}
              y={192}
              fontFamily={typography.bodyFont}
              fontWeight="700"
              fontSize={Math.round(W * 0.026)}
              fill={activeAccent}
            >
              {eventInfo.subtitle}
            </text>
          </g>

          {/* Center Speaker Feature */}
          {renderSpeakerPortrait(
            W / 2,
            H * 0.48,
            Math.min(W * 0.48, H * 0.34),
            Math.min(W * 0.52, H * 0.36),
            'poster-speaker-clip'
          )}

          {/* Bottom Keynote / Session Block */}
          <g transform={`translate(${padX + 64}, ${H * 0.69})`}>
            <text
              x={0}
              y={0}
              fontFamily={typography.monoFont}
              fontWeight="800"
              fontSize={Math.round(W * 0.022)}
              fill={colors.secondary}
            >
              {speaker.track.toUpperCase()} · {speaker.name} ({speaker.company})
            </text>

            <text
              x={0}
              y={Math.round(W * 0.048)}
              fontFamily={typography.headingFont}
              fontWeight="900"
              fontSize={Math.round(W * 0.038)}
              fill={colors.textPrimary}
            >
              {titleLines.map((line, idx) => (
                <tspan key={idx} x={0} dy={idx === 0 ? 0 : Math.round(W * 0.048)}>
                  {line}
                </tspan>
              ))}
            </text>

            {/* Event Date & Location Bar */}
            <g transform={`translate(0, ${H * 0.17})`}>
              <rect
                x={0}
                y={0}
                width={cardW - 128}
                height={Math.round(H * 0.065)}
                rx={20}
                fill={colors.background}
                stroke={colors.border}
                strokeWidth={shapes.borderWidth}
              />
              <text
                x={32}
                y={Math.round(H * 0.041)}
                fontFamily={typography.monoFont}
                fontWeight="800"
                fontSize={Math.round(W * 0.022)}
                fill={colors.textPrimary}
              >
                📅 {eventInfo.date} &nbsp;·&nbsp; 📍 {eventInfo.location}
              </text>
            </g>
          </g>
        </g>
      );
    }

    // ------------------------------------------------------------------------
    // LAYOUT 6 (DEFAULT): SPEAKER SPOTLIGHT CARD (1:1 Square / 9:16 Story)
    // ------------------------------------------------------------------------
    const isTallStory = H / W > 1.4;
    const cardW = W - padX * 2;
    const cardH = H - padY * 2;
    const titleLines = wrapTextLines(speaker.topic, 22, 3);
    const portraitSize = isTallStory ? W * 0.54 : Math.min(W, H) * 0.4;
    const portraitCy = isTallStory ? H * 0.38 : H * 0.41;

    return (
      <g>
        {/* Main Card Container */}
        {shapes.shadowStyle === 'brutalist' && (
          <rect
            x={padX + 12}
            y={padY + 12}
            width={cardW}
            height={cardH}
            rx={shapes.borderRadius}
            fill={colors.border}
          />
        )}
        <rect
          x={padX}
          y={padY}
          width={cardW}
          height={cardH}
          rx={shapes.borderRadius}
          fill={colors.surface}
          stroke={colors.border}
          strokeWidth={shapes.borderWidth * 1.25}
        />

        {/* Top Event Header Bar */}
        <g transform={`translate(${padX + 48}, ${padY + 52})`}>
          <rect
            x={0}
            y={0}
            width={280}
            height={48}
            rx={24}
            fill={activeAccent}
            stroke={colors.border}
            strokeWidth={Math.max(2, shapes.borderWidth * 0.75)}
          />
          <text
            x={140}
            y={32}
            textAnchor="middle"
            fontFamily={typography.monoFont}
            fontWeight="800"
            fontSize="20"
            fill="#FFFFFF"
          >
            {speaker.track}
          </text>

          <text
            x={cardW - 96}
            y={32}
            textAnchor="end"
            fontFamily={typography.headingFont}
            fontWeight="800"
            fontSize="24"
            fill={colors.textSecondary}
          >
            {eventInfo.eventName}
          </text>
        </g>

        {/* Merged Speaker Portrait */}
        {renderSpeakerPortrait(
          W / 2,
          portraitCy,
          portraitSize,
          portraitSize * 1.05,
          'spotlight-speaker-clip'
        )}

        {/* Speaker Name & Role Badge */}
        <g transform={`translate(${W / 2}, ${portraitCy + portraitSize * 0.62})`}>
          <text
            x={0}
            y={0}
            textAnchor="middle"
            fontFamily={typography.headingFont}
            fontWeight="900"
            fontSize={Math.round(W * 0.042)}
            fill={colors.textPrimary}
          >
            {speaker.name}
          </text>
          <text
            x={0}
            y={Math.round(W * 0.038)}
            textAnchor="middle"
            fontFamily={typography.bodyFont}
            fontWeight="700"
            fontSize={Math.round(W * 0.024)}
            fill={activeAccent}
          >
            {speaker.role} · {speaker.company}
          </text>
        </g>

        {/* Session Topic Box */}
        <g
          transform={`translate(${padX + 48}, ${
            isTallStory ? H * 0.64 : H * 0.68
          })`}
        >
          <rect
            x={0}
            y={0}
            width={cardW - 96}
            height={isTallStory ? H * 0.2 : H * 0.19}
            rx={Math.max(16, shapes.borderRadius * 0.7)}
            fill={colors.background}
            stroke={colors.border}
            strokeWidth={Math.max(2, shapes.borderWidth * 0.8)}
          />
          <text
            x={36}
            y={52}
            fontFamily={typography.headingFont}
            fontWeight={typography.headingWeight}
            fontSize={Math.round(W * 0.032)}
            letterSpacing={typography.letterSpacing}
            fill={colors.textPrimary}
          >
            {titleLines.map((line, idx) => (
              <tspan key={idx} x={36} dy={idx === 0 ? 0 : Math.round(W * 0.042)}>
                {line}
              </tspan>
            ))}
          </text>

          {/* Tags & Time */}
          <text
            x={36}
            y={(isTallStory ? H * 0.2 : H * 0.19) - 28}
            fontFamily={typography.monoFont}
            fontWeight="700"
            fontSize={Math.round(W * 0.02)}
            fill={colors.textSecondary}
          >
            🕒 {speaker.dateTime} &nbsp;·&nbsp; 📍 {speaker.venue}
          </text>
        </g>

        {/* Bottom Hashtag / Tags Row */}
        <g transform={`translate(${padX + 48}, ${H - padY - 34})`}>
          <text
            x={0}
            y={0}
            fontFamily={typography.monoFont}
            fontWeight="700"
            fontSize="20"
            fill={colors.textSecondary}
          >
            {speaker.tags.join('  ')}
          </text>
          <text
            x={cardW - 96}
            y={0}
            textAnchor="end"
            fontFamily={typography.monoFont}
            fontWeight="800"
            fontSize="20"
            fill={activeAccent}
          >
            {eventInfo.chapterName}
          </text>
        </g>
      </g>
    );
  };

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      className="w-full h-full select-none"
      style={{
        fontFamily: typography.bodyFont,
      }}
    >
      <defs>
        {/* Pattern Definitions */}
        <pattern
          id="pattern-dots"
          x="0"
          y="0"
          width="36"
          height="36"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="6" cy="6" r="2.5" fill={colors.textSecondary} opacity="0.35" />
        </pattern>

        <pattern
          id="pattern-grid"
          x="0"
          y="0"
          width="60"
          height="60"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 60 0 L 0 0 0 60"
            fill="none"
            stroke={colors.border}
            strokeWidth="1.5"
            strokeOpacity="0.25"
          />
        </pattern>

        {/* Gradients */}
        <linearGradient id="aiAuraGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={colors.primary} />
          <stop offset="50%" stopColor={colors.secondary} />
          <stop offset="100%" stopColor={colors.accent} />
        </linearGradient>

        <linearGradient id="speakerBackdropGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={colors.primary} stopOpacity="0.18" />
          <stop offset="100%" stopColor={colors.accent} stopOpacity="0.28" />
        </linearGradient>

        <linearGradient id="bottomVignette" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
        </linearGradient>

        {/* Blur Filters */}
        <filter id="blurGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="28" />
        </filter>
        <filter id="blurGlowLarge" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="95" />
        </filter>

        {/* Photo Color Filters */}
        <filter id="filter-grayscale">
          <feColorMatrix
            type="matrix"
            values="0.33 0.33 0.33 0 0
                    0.33 0.33 0.33 0 0
                    0.33 0.33 0.33 0 0
                    0    0    0    1 0"
          />
        </filter>
        <filter id="filter-duotone-blue">
          <feColorMatrix
            type="matrix"
            values="0.25 0.45 0.15 0 0.05
                    0.30 0.55 0.20 0 0.12
                    0.50 0.70 0.40 0 0.30
                    0    0    0    1 0"
          />
        </filter>
        <filter id="filter-duotone-warm">
          <feColorMatrix
            type="matrix"
            values="0.60 0.40 0.20 0 0.15
                    0.35 0.45 0.15 0 0.05
                    0.20 0.25 0.20 0 0.02
                    0    0    0    1 0"
          />
        </filter>
        <filter id="filter-contrast">
          <feComponentTransfer>
            <feFuncR type="linear" slope="1.22" intercept="-0.08" />
            <feFuncG type="linear" slope="1.22" intercept="-0.08" />
            <feFuncB type="linear" slope="1.22" intercept="-0.08" />
          </feComponentTransfer>
        </filter>
      </defs>

      {/* 1. Base Canvas Background */}
      {!transparentBg && <rect x="0" y="0" width={W} height={H} fill={colors.background} />}

      {/* 2. Design System Pattern Layer */}
      {!transparentBg && renderPatternOverlay()}

      {/* 3. Uploaded Background Base Assets */}
      {backgroundAssets.map((asset) => {
        const assetW = W * asset.scale;
        const assetH = H * asset.scale;
        const assetX = (asset.x / 100) * W - assetW / 2;
        const assetY = (asset.y / 100) * H - assetH / 2;
        return (
          <image
            key={asset.id}
            href={asset.dataUrl}
            x={assetX}
            y={assetY}
            width={assetW}
            height={assetH}
            opacity={asset.opacity}
            preserveAspectRatio="xMidYMid slice"
          />
        );
      })}

      {/* 4. Core Template & Merged Speaker Layout */}
      {renderLayoutContent()}

      {/* 5. Uploaded Frame Overlay Assets */}
      {frameAssets.map((asset) => (
        <image
          key={asset.id}
          href={asset.dataUrl}
          x={0}
          y={0}
          width={W}
          height={H}
          opacity={asset.opacity}
          preserveAspectRatio="none"
        />
      ))}

      {/* 6. Foreground Base Assets (Logos, Stickers, Sponsor Bars) */}
      {foregroundAssets.map((asset) => {
        const baseSize =
          asset.type === 'sponsor'
            ? W * 0.42
            : asset.type === 'logo'
            ? Math.min(W, H) * 0.18
            : Math.min(W, H) * 0.16;
        const w = baseSize * asset.scale;
        const h = baseSize * 0.45 * asset.scale;
        const x = (asset.x / 100) * W;
        const y = (asset.y / 100) * H;
        return (
          <image
            key={asset.id}
            href={asset.dataUrl}
            x={x}
            y={y}
            width={w}
            height={h}
            opacity={asset.opacity}
            preserveAspectRatio="xMidYMid meet"
          />
        );
      })}

      {/* 7. Print Guides (Bleed Line, Safe Area, Tri-fold Lines, X-Banner Grommets) */}
      {showPrintGuides && (
        <g pointerEvents="none">
          {/* Bleed Margin (Red Dashed) */}
          {preset.bleedPx && (
            <g>
              <rect
                x={preset.bleedPx}
                y={preset.bleedPx}
                width={W - preset.bleedPx * 2}
                height={H - preset.bleedPx * 2}
                fill="none"
                stroke="#EF4444"
                strokeWidth="3"
                strokeDasharray="14 10"
              />
              <text
                x={preset.bleedPx + 14}
                y={preset.bleedPx + 28}
                fontFamily="monospace"
                fontWeight="700"
                fontSize="20"
                fill="#EF4444"
              >
                재단선 (BLEED LINE)
              </text>
            </g>
          )}

          {/* Safe Area Margin (Cyan Dashed) */}
          {preset.safeMarginPx && (
            <g>
              <rect
                x={preset.safeMarginPx}
                y={preset.safeMarginPx}
                width={W - preset.safeMarginPx * 2}
                height={H - preset.safeMarginPx * 2}
                fill="none"
                stroke="#06B6D4"
                strokeWidth="2.5"
                strokeDasharray="8 8"
              />
              <text
                x={preset.safeMarginPx + 14}
                y={preset.safeMarginPx + 28}
                fontFamily="monospace"
                fontWeight="700"
                fontSize="18"
                fill="#06B6D4"
              >
                안전 영역 (SAFE ZONE)
              </text>
            </g>
          )}

          {/* Pamphlet Fold Lines (Magenta Center-Dash) */}
          {preset.foldLines &&
            preset.foldLines.map((ratio, idx) => {
              const fx = Math.round(W * ratio);
              return (
                <g key={idx}>
                  <line
                    x1={fx}
                    y1={0}
                    x2={fx}
                    y2={H}
                    stroke="#EC4899"
                    strokeWidth="3"
                    strokeDasharray="20 10 6 10"
                  />
                  <rect x={fx - 75} y={18} width={150} height={32} rx={8} fill="#EC4899" />
                  <text
                    x={fx}
                    y={40}
                    textAnchor="middle"
                    fontFamily="monospace"
                    fontWeight="800"
                    fontSize="16"
                    fill="#FFFFFF"
                  >
                    접지선 (FOLD {idx + 1})
                  </text>
                </g>
              );
            })}

          {/* X-Banner Corner Grommets (타공 아일렛 위치 표시) */}
          {preset.hasGrommets && (
            <g>
              {[
                [75, 75],
                [W - 75, 75],
                [75, H - 75],
                [W - 75, H - 75],
              ].map(([gx, gy], idx) => (
                <g key={idx}>
                  <circle
                    cx={gx}
                    cy={gy}
                    r={28}
                    fill="rgba(239,68,68,0.18)"
                    stroke="#EF4444"
                    strokeWidth="4"
                  />
                  <circle cx={gx} cy={gy} r={10} fill="#EF4444" />
                </g>
              ))}
            </g>
          )}
        </g>
      )}
    </svg>
  );
};
