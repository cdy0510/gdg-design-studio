'use client';

import React, { useRef, useState } from 'react';
import CanvasSvgRenderer from '@/components/CanvasSvgRenderer';
import {
  DEVFEST_COLORWAYS,
  INITIAL_EVENT_META,
  INITIAL_SPEAKER_SESSIONS,
  SAMPLE_PORTRAITS,
  SIZE_PRESETS,
} from '@/data/presets';
import {
  AssetMode,
  DevFestColorwayId,
  DevFestEventMeta,
  ExportFormat,
  PhotoFilterType,
  SpeakerSessionItem,
  SpeakerTemplateVariant,
  TimetableTemplateVariant,
} from '@/types/studio';
import { downloadSampleXlsx, parseUploadedSpeakerExcel } from '@/utils/excel';
import { exportSvgElement } from '@/utils/exportAsset';

export function DesignStudioWorkspace() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const excelInputRef = useRef<HTMLInputElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const batchPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const devfestLogoInputRef = useRef<HTMLInputElement | null>(null);
  const gdgLogoInputRef = useRef<HTMLInputElement | null>(null);

  // 1. Canvas Size State: Draft numeric inputs vs. Generated canvas size
  const [inputWidth, setInputWidth] = useState<string>('800');
  const [inputHeight, setInputHeight] = useState<string>('1000');
  const [canvasWidth, setCanvasWidth] = useState<number>(800);
  const [canvasHeight, setCanvasHeight] = useState<number>(1000);
  const [activePresetId, setActivePresetId] = useState<string>('custom-800x1000');
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string>('800 × 1000 px');

  // 2. Asset Mode & Official DevFest 2026 Template Variant
  const [mode, setMode] = useState<AssetMode>('speaker');
  const [speakerVariant, setSpeakerVariant] =
    useState<SpeakerTemplateVariant>('devfest-bracket');
  const [timetableVariant, setTimetableVariant] =
    useState<TimetableTemplateVariant>('agenda-digital');
  const [colorwayId, setColorwayId] = useState<DevFestColorwayId>('pastel-blue');

  // 3. Speakers / Sessions Data (populated initially & via Excel upload)
  const [sessions, setSessions] = useState<SpeakerSessionItem[]>(
    INITIAL_SPEAKER_SESSIONS
  );
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>(
    INITIAL_SPEAKER_SESSIONS[0].id
  );
  const [excelStatusMsg, setExcelStatusMsg] = useState<string | null>(null);

  // 4. Event Header Metadata
  const [eventMeta, setEventMeta] = useState<DevFestEventMeta>(INITIAL_EVENT_META);

  // 5. Export & Zoom Controls
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [exportScale, setExportScale] = useState<1 | 2 | 3>(1);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [zoomPercent, setZoomPercent] = useState<number>(100);

  const activeColorway =
    DEVFEST_COLORWAYS.find((c) => c.id === colorwayId) || DEVFEST_COLORWAYS[0];

  const activeSpeaker =
    sessions.find((s) => s.id === selectedSpeakerId) || sessions[0];

  // Apply numeric W x H and reflow template when clicking "Generate"
  const handleGenerateBySize = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsedW = Math.min(6000, Math.max(320, parseInt(inputWidth, 10) || 800));
    const parsedH = Math.min(6000, Math.max(320, parseInt(inputHeight, 10) || 1000));
    setInputWidth(String(parsedW));
    setInputHeight(String(parsedH));
    setCanvasWidth(parsedW);
    setCanvasHeight(parsedH);

    // Match preset if identical, otherwise mark custom
    const matched = SIZE_PRESETS.find(
      (p) => p.width === parsedW && p.height === parsedH
    );
    setActivePresetId(matched ? matched.id : 'custom');

    // Auto-select X-banner layout if very tall ratio (e.g., 1:2.4 or taller)
    if (parsedH / parsedW >= 2.3) {
      if (mode === 'speaker') {
        setSpeakerVariant('xbanner-meterboard');
      } else {
        setTimetableVariant('agenda-xbanner');
      }
    }
    setLastGeneratedAt(`${parsedW} × ${parsedH} px`);
  };

  // Apply a size preset immediately
  const handleSelectSizePreset = (presetId: string) => {
    const preset = SIZE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePresetId(preset.id);
    setInputWidth(String(preset.width));
    setInputHeight(String(preset.height));
    setCanvasWidth(preset.width);
    setCanvasHeight(preset.height);
    if (preset.category === 'xbanner') {
      if (mode === 'speaker') setSpeakerVariant('xbanner-meterboard');
      if (mode === 'timetable') setTimetableVariant('agenda-xbanner');
    } else if (preset.category === 'print') {
      if (mode === 'timetable') setTimetableVariant('agenda-print');
    }
    setLastGeneratedAt(`${preset.width} × ${preset.height} px`);
  };

  // Excel upload handler (.xlsx / .csv)
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseUploadedSpeakerExcel(file);
      if (parsed.length === 0) {
        setExcelStatusMsg('파일에서 유효한 연사자/세션 행을 찾지 못했습니다.');
        return;
      }
      setSessions(parsed);
      setSelectedSpeakerId(parsed[0].id);
      setExcelStatusMsg(
        `✓ ${file.name}에서 연사자/세션 ${parsed.length}명을 불러왔습니다.`
      );
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : '엑셀 파일을 읽는 중 오류가 발생했습니다.';
      setExcelStatusMsg(`오류: ${msg}`);
    } finally {
      e.target.value = '';
    }
  };

  // Active speaker profile photo upload
  const handleSpeakerPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeSpeaker) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateActiveSpeaker({
          photoDataUrl: reader.result,
          photoScale: 1,
          photoOffsetX: 0,
          photoOffsetY: 0,
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Batch speaker photos upload (matches by speaker name in filename or sequential index)
  const handleBatchPhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    const readAsDataUrl = (f: File) =>
      new Promise<{ name: string; dataUrl: string }>((resolve) => {
        const reader = new FileReader();
        reader.onload = () =>
          resolve({
            name: f.name.replace(/\.[^.]+$/, '').normalize('NFC'),
            dataUrl: typeof reader.result === 'string' ? reader.result : '',
          });
        reader.readAsDataURL(f);
      });

    const loaded = await Promise.all(files.map(readAsDataUrl));
    let matchedCount = 0;

    setSessions((prev) =>
      prev.map((spk, idx) => {
        const normalizedSpkName = spk.name.normalize('NFC').trim();
        const byName = loaded.find(
          (item) =>
            normalizedSpkName &&
            (item.name.includes(normalizedSpkName) ||
              normalizedSpkName.includes(item.name))
        );
        const chosen = byName || loaded[idx];
        if (chosen && chosen.dataUrl) {
          matchedCount++;
          return {
            ...spk,
            photoDataUrl: chosen.dataUrl,
            photoScale: 1,
            photoOffsetX: 0,
            photoOffsetY: 0,
          };
        }
        return spk;
      })
    );

    setExcelStatusMsg(
      `✓ 프로필 사진 ${matchedCount}장을 연사자 목록에 매칭했습니다.`
    );
    e.target.value = '';
  };

  // Custom chapter/sponsor logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEventMeta((prev) => ({
          ...prev,
          customLogoDataUrl: reader.result as string,
        }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Custom DevFest Event Logo upload
  const handleDevFestLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEventMeta((prev) => ({
          ...prev,
          devfestLogoDataUrl: reader.result as string,
          devfestLogoScale: prev.devfestLogoScale ?? 1,
        }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Custom GDG Logo upload
  const handleGdgLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEventMeta((prev) => ({
          ...prev,
          gdgLogoDataUrl: reader.result as string,
          gdgLogoScale: prev.gdgLogoScale ?? 1,
        }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const updateActiveSpeaker = (patch: Partial<SpeakerSessionItem>) => {
    if (!activeSpeaker) return;
    setSessions((prev) =>
      prev.map((item) =>
        item.id === activeSpeaker.id ? { ...item, ...patch } : item
      )
    );
  };

  const handleAddSpeakerRow = () => {
    const nextIdx = sessions.length + 1;
    const newItem: SpeakerSessionItem = {
      id: `spk-${Date.now()}`,
      name: `신규 연사 ${nextIdx}`,
      affiliation: 'GDG Chapter',
      role: 'Speaker',
      title: '발표 세션 제목을 입력하세요',
      description: '세션 핵심 내용을 요약해 주세요.',
      track: 'AI & Cloud',
      room: 'Hall A',
      time: `${12 + nextIdx}:00 - ${12 + nextIdx}:50`,
      photoDataUrl: SAMPLE_PORTRAITS[(nextIdx - 1) % SAMPLE_PORTRAITS.length],
      photoScale: 1,
      photoOffsetX: 0,
      photoOffsetY: 0,
      photoFilter: 'none',
    };
    setSessions((prev) => [...prev, newItem]);
    setSelectedSpeakerId(newItem.id);
  };

  const handleDeleteSpeakerRow = (id: string) => {
    if (sessions.length <= 1) return;
    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);
    if (selectedSpeakerId === id) {
      setSelectedSpeakerId(remaining[0].id);
    }
  };

  // Export current SVG canvas
  const handleExportCurrent = async () => {
    if (!svgRef.current) return;
    setIsExporting(true);
    try {
      const baseFilename =
        mode === 'speaker'
          ? `devfest2026-speaker-${activeSpeaker.name}-${canvasWidth}x${canvasHeight}`
          : `devfest2026-timetable-${timetableVariant}-${canvasWidth}x${canvasHeight}`;

      await exportSvgElement(
        svgRef.current,
        baseFilename,
        canvasWidth,
        canvasHeight,
        activeColorway.canvasBg,
        {
          format: exportFormat,
          scale: exportScale,
          quality: 0.95,
          transparentBg: false,
        }
      );
    } finally {
      setIsExporting(false);
    }
  };

  // Compute preview container dimensions so any W x H fits nicely in the viewport
  const maxPreviewW = 680;
  const maxPreviewH = 660;
  const fitScale =
    Math.min(maxPreviewW / canvasWidth, maxPreviewH / canvasHeight) *
    (zoomPercent / 100);
  const displayW = Math.max(180, Math.round(canvasWidth * fitScale));
  const displayH = Math.max(180, Math.round(canvasHeight * fitScale));

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f0f0] text-[#1e1e1e]">
      {/* =================================================================== */}
      {/* TOP BAR: Brand Identity + W × H Numeric Generator + Export Action    */}
      {/* =================================================================== */}
      <header className="sticky top-0 z-30 bg-white border-b-2 border-[#1e1e1e] px-4 py-2.5">
        <div className="max-w-[1800px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Official { DevFest } 2026 Studio Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 font-extrabold text-xl tracking-tight">
              <span className="text-[#4285f4] text-2xl leading-none">{'{'}</span>
              <span>DevFest</span>
              <span className="text-[#4285f4] text-2xl leading-none">{'}'}</span>
            </div>
            <span className="px-2 py-0.5 text-xs font-mono font-bold bg-[#ffd427] border-[1.5px] border-[#1e1e1e] rounded-full">
              2026
            </span>
            <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-[#5cdb6d] border-[1.5px] border-[#1e1e1e] rounded-md">
              Asset Studio
            </span>
          </div>

          {/* Center: Mode Switch (발표자료 SNS 홍보 카드 vs 시간표 에셋) */}
          <div className="flex items-center bg-[#f0f0f0] p-1 rounded-lg border-[1.5px] border-[#1e1e1e]">
            <button
              type="button"
              onClick={() => setMode('speaker')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors ${
                mode === 'speaker'
                  ? 'bg-[#1e1e1e] text-white'
                  : 'text-[#1e1e1e] hover:bg-black/5'
              }`}
            >
              연사 발표 홍보 카드 / X배너
            </button>
            <button
              type="button"
              onClick={() => setMode('timetable')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors ${
                mode === 'timetable'
                  ? 'bg-[#1e1e1e] text-white'
                  : 'text-[#1e1e1e] hover:bg-black/5'
              }`}
            >
              시간표 (SNS 카드 / X배너 / 인쇄)
            </button>
          </div>

          {/* Right: W x H Numeric Size Input + Generate Button + Export */}
          <div className="flex flex-wrap items-center gap-2.5">
            <form
              onSubmit={handleGenerateBySize}
              className="flex items-center gap-1.5 bg-[#f0f0f0] px-2.5 py-1 rounded-lg border-[1.5px] border-[#1e1e1e]"
            >
              <span className="text-[11px] font-mono font-bold text-[#595959] mr-1">
                SIZE (px)
              </span>
              <input
                type="number"
                min={320}
                max={6000}
                value={inputWidth}
                onChange={(e) => setInputWidth(e.target.value)}
                aria-label="출력 가로 사이즈 (Width)"
                className="w-16 px-1.5 py-1 text-xs font-mono font-bold text-center bg-white border border-[#1e1e1e] rounded"
              />
              <span className="text-xs font-mono font-bold">×</span>
              <input
                type="number"
                min={320}
                max={6000}
                value={inputHeight}
                onChange={(e) => setInputHeight(e.target.value)}
                aria-label="출력 세로 사이즈 (Height)"
                className="w-16 px-1.5 py-1 text-xs font-mono font-bold text-center bg-white border border-[#1e1e1e] rounded"
              />
              <button
                type="submit"
                className="ml-1 px-3 py-1 bg-[#ffd427] hover:bg-[#f9ab00] text-[#1e1e1e] font-bold text-xs rounded border-[1.5px] border-[#1e1e1e] shadow-[2px_2px_0px_#1e1e1e] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
              >
                Generate
              </button>
            </form>

            {/* Format & Export */}
            <div className="flex items-center gap-1.5">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                aria-label="내보내기 포맷"
                className="px-2.5 py-1.5 text-xs font-mono font-bold bg-white border-[1.5px] border-[#1e1e1e] rounded-lg cursor-pointer"
              >
                <option value="png">PNG</option>
                <option value="jpg">JPG</option>
                <option value="svg">SVG (벡터)</option>
                <option value="webp">WebP</option>
              </select>
              <button
                type="button"
                onClick={handleExportCurrent}
                disabled={isExporting}
                className="px-4 py-1.5 bg-[#4285f4] hover:bg-[#3367d6] text-white font-bold text-xs rounded-lg border-[1.5px] border-[#1e1e1e] shadow-[2px_2px_0px_#1e1e1e] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer disabled:opacity-50"
              >
                {isExporting ? '생성 중...' : '이미지 다운로드'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* =================================================================== */}
      {/* MAIN 3-COLUMN STUDIO BODY                                           */}
      {/* =================================================================== */}
      <div className="flex-1 max-w-[1800px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 p-4">
        {/* ----------------------------------------------------------------- */}
        {/* LEFT COLUMN (4 cols): Excel Upload, sample.xlsx, Speaker & Photos */}
        {/* ----------------------------------------------------------------- */}
        <aside className="lg:col-span-4 flex flex-col gap-4">
          {/* Card 1: Excel Upload & sample.xlsx Download */}
          <section className="bg-white border-2 border-[#1e1e1e] rounded-xl p-4 shadow-[3px_3px_0px_#1e1e1e]">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-extrabold text-sm tracking-tight flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#34a853] border border-[#1e1e1e]" />
                1. 연사자 목록 Excel 업로드
              </h2>
              <button
                type="button"
                onClick={downloadSampleXlsx}
                className="px-2.5 py-1 bg-[#c3ecf6] hover:bg-[#57caff] text-[#1e1e1e] font-mono font-bold text-xs rounded-md border-[1.5px] border-[#1e1e1e] transition-colors cursor-pointer"
              >
                ↓ sample.xlsx 다운로드
              </button>
            </div>
            <p className="text-xs text-[#595959] mb-3 leading-relaxed">
              <code className="font-mono bg-[#f0f0f0] px-1 py-0.5 rounded">
                sample.xlsx
              </code>{' '}
              양식(이름, 소속, 직함, 세션 제목, 설명, 트랙, 장소, 시간)을 채워 업로드하면
              연사 홍보 카드와 시간표가 즉시 생성됩니다.
            </p>

            <input
              ref={excelInputRef}
              type="file"
              accept=".xlsx,.csv,.tsv"
              onChange={handleExcelUpload}
              className="hidden"
            />
            <input
              ref={batchPhotoInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleBatchPhotoUpload}
              className="hidden"
            />

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => excelInputRef.current?.click()}
                className="py-2.5 px-3 bg-[#f0f0f0] hover:bg-[#ffe7a5] text-[#1e1e1e] font-bold text-xs rounded-lg border-[1.5px] border-dashed border-[#1e1e1e] transition-colors cursor-pointer text-center"
              >
                📄 연사 목록 (.xlsx / .csv) 업로드
              </button>
              <button
                type="button"
                onClick={() => batchPhotoInputRef.current?.click()}
                className="py-2.5 px-3 bg-[#f0f0f0] hover:bg-[#ccf6c5] text-[#1e1e1e] font-bold text-xs rounded-lg border-[1.5px] border-dashed border-[#1e1e1e] transition-colors cursor-pointer text-center"
              >
                🖼️ 프로필 사진 일괄 매칭 업로드
              </button>
            </div>

            {excelStatusMsg && (
              <div className="mt-2.5 px-3 py-1.5 bg-[#ccf6c5] border border-[#1e1e1e] rounded-md text-xs font-mono font-semibold text-[#1e1e1e]">
                {excelStatusMsg}
              </div>
            )}
          </section>

          {/* Card 2: Speaker / Session Roster & Active Speaker Profile Edit */}
          <section className="bg-white border-2 border-[#1e1e1e] rounded-xl p-4 shadow-[3px_3px_0px_#1e1e1e] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-sm tracking-tight flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#4285f4] border border-[#1e1e1e]" />
                2. 연사자 / 세션 목록 ({sessions.length}명)
              </h2>
              <button
                type="button"
                onClick={handleAddSpeakerRow}
                className="px-2.5 py-1 bg-[#f0f0f0] hover:bg-[#ffd427] text-xs font-bold border-[1.5px] border-[#1e1e1e] rounded-md cursor-pointer"
              >
                + 연사 추가
              </button>
            </div>

            {/* Speaker Selector List */}
            <div className="max-h-48 overflow-y-auto flex flex-col gap-1.5 pr-1">
              {sessions.map((spk, idx) => {
                const isSelected = spk.id === activeSpeaker?.id;
                return (
                  <div
                    key={spk.id}
                    onClick={() => setSelectedSpeakerId(spk.id)}
                    className={`flex items-center justify-between p-2 rounded-lg border-[1.5px] cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#ffe7a5] border-[#1e1e1e] font-bold'
                        : 'bg-[#f8f9fa] border-transparent hover:border-[#1e1e1e]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={spk.photoDataUrl}
                        alt={spk.name}
                        className="w-9 h-9 rounded-md object-cover border border-[#1e1e1e] bg-white shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">
                          {idx + 1}. {spk.name}{' '}
                          <span className="font-mono font-normal text-[11px] text-[#595959]">
                            · {spk.affiliation}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#595959] truncate">
                          [{spk.time}] {spk.title}
                        </div>
                      </div>
                    </div>
                    {sessions.length > 1 && (
                      <button
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          handleDeleteSpeakerRow(spk.id);
                        }}
                        title="연사 삭제"
                        className="ml-2 px-1.5 py-0.5 text-xs text-[#595959] hover:text-[#ea4335] font-mono"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selected Speaker Detail & Profile Photo Upload */}
            {activeSpeaker && (
              <div className="pt-3 border-t-[1.5px] border-[#1e1e1e]/15 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold">
                    선택된 연사 프로필 & 발표 정보 편집
                  </span>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSpeakerPhotoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="px-2.5 py-1 bg-[#5cdb6d] hover:bg-[#34a853] hover:text-white text-[#1e1e1e] font-bold text-xs rounded-md border-[1.5px] border-[#1e1e1e] transition-colors cursor-pointer"
                  >
                    📷 연사자 프로필 사진 업로드
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-mono font-semibold text-[#595959] mb-0.5">
                      이름
                    </label>
                    <input
                      type="text"
                      value={activeSpeaker.name}
                      onChange={(e) =>
                        updateActiveSpeaker({ name: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-[#f8f9fa] border-[1.5px] border-[#1e1e1e] rounded-md font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono font-semibold text-[#595959] mb-0.5">
                      소속 (Company/Org)
                    </label>
                    <input
                      type="text"
                      value={activeSpeaker.affiliation}
                      onChange={(e) =>
                        updateActiveSpeaker({ affiliation: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-[#f8f9fa] border-[1.5px] border-[#1e1e1e] rounded-md font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-mono font-semibold text-[#595959] mb-0.5">
                      직함 / 역할
                    </label>
                    <input
                      type="text"
                      value={activeSpeaker.role}
                      onChange={(e) =>
                        updateActiveSpeaker({ role: e.target.value })
                      }
                      className="w-full px-2 py-1.5 text-xs bg-[#f8f9fa] border-[1.5px] border-[#1e1e1e] rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono font-semibold text-[#595959] mb-0.5">
                      트랙
                    </label>
                    <input
                      type="text"
                      value={activeSpeaker.track}
                      onChange={(e) =>
                        updateActiveSpeaker({ track: e.target.value })
                      }
                      className="w-full px-2 py-1.5 text-xs bg-[#f8f9fa] border-[1.5px] border-[#1e1e1e] rounded-md font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono font-semibold text-[#595959] mb-0.5">
                      시간 / 장소
                    </label>
                    <input
                      type="text"
                      value={activeSpeaker.time}
                      onChange={(e) =>
                        updateActiveSpeaker({ time: e.target.value })
                      }
                      className="w-full px-2 py-1.5 text-xs bg-[#f8f9fa] border-[1.5px] border-[#1e1e1e] rounded-md font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-semibold text-[#595959] mb-0.5">
                    세션 제목
                  </label>
                  <input
                    type="text"
                    value={activeSpeaker.title}
                    onChange={(e) =>
                      updateActiveSpeaker({ title: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-[#f8f9fa] border-[1.5px] border-[#1e1e1e] rounded-md font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-semibold text-[#595959] mb-0.5">
                    세션 설명
                  </label>
                  <textarea
                    rows={2}
                    value={activeSpeaker.description}
                    onChange={(e) =>
                      updateActiveSpeaker({ description: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-[#f8f9fa] border-[1.5px] border-[#1e1e1e] rounded-md resize-none"
                  />
                </div>

                {/* Photo Framing & Filter Controls */}
                <div className="bg-[#f0f0f0] p-2.5 rounded-lg border border-[#1e1e1e]/30 grid grid-cols-3 gap-2 items-center">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-[#595959]">
                      사진 확대 ({Math.round(activeSpeaker.photoScale * 100)}%)
                    </label>
                    <input
                      type="range"
                      min={0.8}
                      max={2.0}
                      step={0.05}
                      value={activeSpeaker.photoScale}
                      onChange={(e) =>
                        updateActiveSpeaker({
                          photoScale: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-[#1e1e1e]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-[#595959]">
                      좌우/상하 위치
                    </label>
                    <div className="flex gap-1">
                      <input
                        type="range"
                        min={-80}
                        max={80}
                        value={activeSpeaker.photoOffsetX}
                        onChange={(e) =>
                          updateActiveSpeaker({
                            photoOffsetX: parseInt(e.target.value, 10),
                          })
                        }
                        className="w-1/2 accent-[#1e1e1e]"
                      />
                      <input
                        type="range"
                        min={-80}
                        max={80}
                        value={activeSpeaker.photoOffsetY}
                        onChange={(e) =>
                          updateActiveSpeaker({
                            photoOffsetY: parseInt(e.target.value, 10),
                          })
                        }
                        className="w-1/2 accent-[#1e1e1e]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-[#595959] mb-0.5">
                      사진 톤
                    </label>
                    <select
                      value={activeSpeaker.photoFilter}
                      onChange={(e) =>
                        updateActiveSpeaker({
                          photoFilter: e.target.value as PhotoFilterType,
                        })
                      }
                      className="w-full px-1.5 py-1 text-[11px] font-mono bg-white border border-[#1e1e1e] rounded"
                    >
                      <option value="none">원본 컬러</option>
                      <option value="grayscale">흑백 (B&W)</option>
                      <option value="contrast">고대비</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </section>
        </aside>

        {/* ----------------------------------------------------------------- */}
        {/* CENTER COLUMN (5 cols): Live DevFest 2026 SVG Canvas Preview      */}
        {/* ----------------------------------------------------------------- */}
        <main className="lg:col-span-5 flex flex-col bg-[#e4e6ea] border-2 border-[#1e1e1e] rounded-xl shadow-[3px_3px_0px_#1e1e1e] overflow-hidden">
          {/* Canvas Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-white border-b-2 border-[#1e1e1e]">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#1e1e1e] text-white font-mono font-bold text-xs rounded">
                {canvasWidth} × {canvasHeight} px
              </span>
              <span className="text-xs font-mono text-[#595959]">
                비율 {(canvasWidth / canvasHeight).toFixed(2)}:1
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setZoomPercent((z) => Math.max(50, z - 15))}
                className="px-2 py-0.5 text-xs font-mono font-bold bg-[#f0f0f0] border border-[#1e1e1e] rounded cursor-pointer"
              >
                -
              </button>
              <span className="text-xs font-mono font-bold w-12 text-center">
                {zoomPercent}%
              </span>
              <button
                type="button"
                onClick={() => setZoomPercent((z) => Math.min(160, z + 15))}
                className="px-2 py-0.5 text-xs font-mono font-bold bg-[#f0f0f0] border border-[#1e1e1e] rounded cursor-pointer"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setZoomPercent(100)}
                className="px-2 py-0.5 text-[11px] font-mono bg-white border border-[#1e1e1e] rounded cursor-pointer"
              >
                Fit
              </button>
            </div>
          </div>

          {/* Canvas Viewport */}
          <div className="flex-1 min-h-[540px] flex items-center justify-center p-6 overflow-auto">
            <div
              style={{
                width: `${displayW}px`,
                height: `${displayH}px`,
              }}
              className="relative bg-white shadow-[6px_6px_0px_rgba(30,30,30,0.22)] border border-[#1e1e1e] transition-all duration-150 shrink-0"
            >
              <CanvasSvgRenderer
                svgRef={svgRef}
                width={canvasWidth}
                height={canvasHeight}
                mode={mode}
                speakerVariant={speakerVariant}
                timetableVariant={timetableVariant}
                colorway={activeColorway}
                activeSpeaker={activeSpeaker}
                sessions={sessions}
                eventMeta={eventMeta}
              />
            </div>
          </div>

          {/* Bottom Quick Speaker Switcher Bar */}
          <div className="px-4 py-2 bg-white border-t-2 border-[#1e1e1e] flex items-center justify-between text-xs">
            <span className="font-mono text-[#595959]">
              마지막 생성 규격: <strong className="text-[#1e1e1e]">{lastGeneratedAt}</strong>
            </span>
            {mode === 'speaker' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[#595959] font-mono">연사 전환:</span>
                {sessions.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSpeakerId(s.id)}
                    className={`px-2 py-0.5 rounded font-mono text-xs border ${
                      s.id === activeSpeaker.id
                        ? 'bg-[#1e1e1e] text-white border-[#1e1e1e]'
                        : 'bg-[#f0f0f0] text-[#1e1e1e] border-[#1e1e1e]/40'
                    } cursor-pointer`}
                  >
                    {idx + 1}.{s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* ----------------------------------------------------------------- */}
        {/* RIGHT COLUMN (3 cols): Size Presets, DevFest 2026 Templates & Colors */}
        {/* ----------------------------------------------------------------- */}
        <aside className="lg:col-span-3 flex flex-col gap-4">
          {/* Card 3: Output Size Generator & Presets */}
          <section className="bg-white border-2 border-[#1e1e1e] rounded-xl p-4 shadow-[3px_3px_0px_#1e1e1e]">
            <h2 className="font-extrabold text-sm tracking-tight flex items-center gap-2 mb-2.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#f9ab00] border border-[#1e1e1e]" />
              3. 출력 사이즈 지정 & 프리셋
            </h2>

            {/* Direct W x H input form */}
            <form onSubmit={handleGenerateBySize} className="mb-3">
              <div className="grid grid-cols-12 gap-1.5 items-end">
                <div className="col-span-4">
                  <label className="block text-[10px] font-mono font-bold text-[#595959] mb-1">
                    가로 W (px)
                  </label>
                  <input
                    type="number"
                    min={320}
                    max={6000}
                    value={inputWidth}
                    onChange={(e) => setInputWidth(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs font-mono font-bold bg-[#f8f9fa] border-[1.5px] border-[#1e1e1e] rounded-md"
                  />
                </div>
                <div className="col-span-4">
                  <label className="block text-[10px] font-mono font-bold text-[#595959] mb-1">
                    세로 H (px)
                  </label>
                  <input
                    type="number"
                    min={320}
                    max={6000}
                    value={inputHeight}
                    onChange={(e) => setInputHeight(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs font-mono font-bold bg-[#f8f9fa] border-[1.5px] border-[#1e1e1e] rounded-md"
                  />
                </div>
                <div className="col-span-4">
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-[#ffd427] hover:bg-[#f9ab00] text-[#1e1e1e] font-extrabold text-xs rounded-md border-[1.5px] border-[#1e1e1e] shadow-[2px_2px_0px_#1e1e1e] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
                  >
                    Generate
                  </button>
                </div>
              </div>
            </form>

            {/* Quick Size Presets */}
            <div className="flex flex-col gap-1.5">
              {SIZE_PRESETS.map((preset) => {
                const active = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectSizePreset(preset.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg border-[1.5px] transition-colors flex items-center justify-between cursor-pointer ${
                      active
                        ? 'bg-[#c3ecf6] border-[#1e1e1e] font-bold'
                        : 'bg-[#f8f9fa] border-transparent hover:border-[#1e1e1e]'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{preset.name}</div>
                      <div className="text-[11px] text-[#595959]">
                        {preset.usageLabel}
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white border border-[#1e1e1e] rounded">
                      {preset.aspectLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Card 4: Official DevFest 2026 Template & Colorway */}
          <section className="bg-white border-2 border-[#1e1e1e] rounded-xl p-4 shadow-[3px_3px_0px_#1e1e1e] flex flex-col gap-3">
            <h2 className="font-extrabold text-sm tracking-tight flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#ea4335] border border-[#1e1e1e]" />
              4. DevFest 2026 템플릿 & 컬러
            </h2>

            {/* Template Variant Picker */}
            {mode === 'speaker' ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono font-bold text-[#595959]">
                  연사 홍보 레이아웃 스타일
                </label>
                {(
                  [
                    {
                      id: 'devfest-bracket',
                      label: '{ DevFest } 2026 스텝 프레임형',
                      desc: '공식 가이드 기본 중괄호 헤더 + 스텝 포토 + GDG 노치',
                    },
                    {
                      id: 'track-notch',
                      label: 'Track @DevFest + 슬래시(//)형',
                      desc: '트랙명 강조 헤더 + 더블 슬래시 그래픽 + 스텝 포토',
                    },
                    {
                      id: 'xbanner-meterboard',
                      label: 'X배너 / 스탠딩 배너 (Meterboard)',
                      desc: '우상단 노치 에스터리스크(*) + 대형 사진 + 하단 세션 카드',
                    },
                  ] as const
                ).map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSpeakerVariant(v.id)}
                    className={`text-left px-3 py-2 rounded-lg border-[1.5px] cursor-pointer ${
                      speakerVariant === v.id
                        ? 'bg-[#ffe7a5] border-[#1e1e1e]'
                        : 'bg-[#f8f9fa] border-transparent hover:border-[#1e1e1e]'
                    }`}
                  >
                    <div className="text-xs font-bold">{v.label}</div>
                    <div className="text-[11px] text-[#595959]">{v.desc}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono font-bold text-[#595959]">
                  시간표 (Agenda) 레이아웃 스타일
                </label>
                {(
                  [
                    {
                      id: 'agenda-digital',
                      label: 'SNS 디지털 시간표 (스텝 카드형)',
                      desc: '좌상단 Agenda 탭 + 우상단 Track @DevFest + 좌하단 GDG 로고',
                    },
                    {
                      id: 'agenda-xbanner',
                      label: 'X배너 세로 스탠딩 시간표',
                      desc: '현장 거치형 세로 타임테이블 + 연사 썸네일 & 세션 요약',
                    },
                    {
                      id: 'agenda-print',
                      label: 'A4 / 와이드 멀티트랙 인쇄용 시간표',
                      desc: '스캘럽 아치 스티커 + 2단/다단 그리드 인쇄 최적화',
                    },
                  ] as const
                ).map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setTimetableVariant(v.id)}
                    className={`text-left px-3 py-2 rounded-lg border-[1.5px] cursor-pointer ${
                      timetableVariant === v.id
                        ? 'bg-[#ffe7a5] border-[#1e1e1e]'
                        : 'bg-[#f8f9fa] border-transparent hover:border-[#1e1e1e]'
                    }`}
                  >
                    <div className="text-xs font-bold">{v.label}</div>
                    <div className="text-[11px] text-[#595959]">{v.desc}</div>
                  </button>
                ))}
              </div>
            )}

            {/* Official Colorway Picker */}
            <div>
              <label className="block text-[11px] font-mono font-bold text-[#595959] mb-1.5">
                공식 가이드 컬러 팔레트
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {DEVFEST_COLORWAYS.map((cw) => {
                  const selected = cw.id === colorwayId;
                  return (
                    <button
                      key={cw.id}
                      type="button"
                      onClick={() => setColorwayId(cw.id)}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border-[1.5px] text-left cursor-pointer ${
                        selected
                          ? 'bg-[#1e1e1e] text-white border-[#1e1e1e]'
                          : 'bg-[#f8f9fa] text-[#1e1e1e] border-[#1e1e1e]/30 hover:border-[#1e1e1e]'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-[#1e1e1e] shrink-0"
                        style={{ backgroundColor: cw.canvasBg }}
                      />
                      <span className="text-[11px] font-bold truncate">
                        {cw.name.replace(/\s*\([^)]*\)/, '')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Event Header Metadata Controls */}
            <div className="pt-2 border-t border-[#1e1e1e]/15 flex flex-col gap-2">
              <label className="text-[11px] font-mono font-bold text-[#595959]">
                행사 헤더 텍스트 & 그래픽 요소
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[10px] font-mono text-[#595959]">
                    지역 알약 (Location Pill)
                  </span>
                  <input
                    type="text"
                    value={eventMeta.locationText}
                    onChange={(e) =>
                      setEventMeta((m) => ({ ...m, locationText: e.target.value }))
                    }
                    className="w-full px-2 py-1 text-xs font-mono bg-[#f8f9fa] border border-[#1e1e1e] rounded"
                  />
                </div>
                <div>
                  <span className="block text-[10px] font-mono text-[#595959]">
                    연도 알약 (Year Pill)
                  </span>
                  <input
                    type="text"
                    value={eventMeta.yearText}
                    onChange={(e) =>
                      setEventMeta((m) => ({ ...m, yearText: e.target.value }))
                    }
                    className="w-full px-2 py-1 text-xs font-mono bg-[#f8f9fa] border border-[#1e1e1e] rounded"
                  />
                </div>
              </div>
              <div>
                <span className="block text-[10px] font-mono text-[#595959]">
                  일시 · 장소 안내 문구
                </span>
                <input
                  type="text"
                  value={eventMeta.dateVenueSubtext}
                  onChange={(e) =>
                    setEventMeta((m) => ({
                      ...m,
                      dateVenueSubtext: e.target.value,
                    }))
                  }
                  className="w-full px-2 py-1 text-xs font-mono bg-[#f8f9fa] border border-[#1e1e1e] rounded"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eventMeta.showWireframeGlobe}
                    onChange={(e) =>
                      setEventMeta((m) => ({
                        ...m,
                        showWireframeGlobe: e.target.checked,
                      }))
                    }
                    className="accent-[#1e1e1e]"
                  />
                  <span>와이어프레임 지구본</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eventMeta.showAsteriskSticker}
                    onChange={(e) =>
                      setEventMeta((m) => ({
                        ...m,
                        showAsteriskSticker: e.target.checked,
                      }))
                    }
                    className="accent-[#1e1e1e]"
                  />
                  <span>애스터리스크(*)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eventMeta.showCropMarks}
                    onChange={(e) =>
                      setEventMeta((m) => ({
                        ...m,
                        showCropMarks: e.target.checked,
                      }))
                    }
                    className="accent-[#1e1e1e]"
                  />
                  <span>인쇄 재단선/타공선</span>
                </label>
              </div>

              {/* DevFest / GDG Logo Replacement */}
              <input
                ref={devfestLogoInputRef}
                type="file"
                accept="image/*"
                onChange={handleDevFestLogoUpload}
                className="hidden"
              />
              <input
                ref={gdgLogoInputRef}
                type="file"
                accept="image/*"
                onChange={handleGdgLogoUpload}
                className="hidden"
              />
              <div className="space-y-2 pt-2 border-t border-[#1e1e1e]/15">
                {(
                  [
                    {
                      label: 'DevFest 로고',
                      url: eventMeta.devfestLogoDataUrl,
                      scale: eventMeta.devfestLogoScale ?? 1,
                      inputRef: devfestLogoInputRef,
                      urlKey: 'devfestLogoDataUrl',
                      scaleKey: 'devfestLogoScale',
                    },
                    {
                      label: 'GDG 로고',
                      url: eventMeta.gdgLogoDataUrl,
                      scale: eventMeta.gdgLogoScale ?? 1,
                      inputRef: gdgLogoInputRef,
                      urlKey: 'gdgLogoDataUrl',
                      scaleKey: 'gdgLogoScale',
                    },
                  ] as const
                ).map((logo) => (
                  <div key={logo.urlKey} className="flex items-center gap-2 text-[11px]">
                    <span className="w-20 shrink-0 font-bold">{logo.label}</span>
                    {logo.url ? (
                      <img
                        src={logo.url}
                        alt={`${logo.label} 미리보기`}
                        className="h-6 w-10 object-contain border border-[#1e1e1e]/20 rounded bg-white"
                      />
                    ) : (
                      <span className="h-6 w-10 flex items-center justify-center text-[10px] text-[#1e1e1e]/50 border border-dashed border-[#1e1e1e]/30 rounded">
                        기본
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => logo.inputRef.current?.click()}
                      className="px-2 py-0.5 font-bold bg-[#f0f0f0] hover:bg-[#e2e5e9] border border-[#1e1e1e] rounded cursor-pointer"
                    >
                      {logo.url ? '교체' : '업로드'}
                    </button>
                    {logo.url && (
                      <>
                        <input
                          type="range"
                          min={0.5}
                          max={2}
                          step={0.05}
                          value={logo.scale}
                          onChange={(e) =>
                            setEventMeta((m) => ({
                              ...m,
                              [logo.scaleKey]: Number(e.target.value),
                            }))
                          }
                          className="flex-1 min-w-0 accent-[#1e1e1e]"
                          aria-label={`${logo.label} 크기`}
                        />
                        <span className="font-mono w-9 text-right">
                          {Math.round(logo.scale * 100)}%
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setEventMeta((m) => ({
                              ...m,
                              [logo.urlKey]: undefined,
                              [logo.scaleKey]: 1,
                            }))
                          }
                          className="px-1.5 py-0.5 border border-[#1e1e1e]/40 rounded hover:bg-[#f0f0f0] cursor-pointer"
                          aria-label={`${logo.label} 제거`}
                        >
                          ✕
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Optional Custom Logo Upload + Export Scale */}
              <div className="flex items-center justify-between pt-2 border-t border-[#1e1e1e]/15">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="px-2.5 py-1 text-[11px] font-bold bg-[#f0f0f0] hover:bg-[#e2e5e9] border border-[#1e1e1e] rounded cursor-pointer"
                >
                  + 챕터/후원사 로고 추가
                </button>
                <div className="flex items-center gap-1 font-mono text-[11px]">
                  <span>해상도 배율:</span>
                  {([1, 2, 3] as const).map((sc) => (
                    <button
                      key={sc}
                      type="button"
                      onClick={() => setExportScale(sc)}
                      className={`px-1.5 py-0.5 rounded border ${
                        exportScale === sc
                          ? 'bg-[#1e1e1e] text-white border-[#1e1e1e]'
                          : 'bg-white text-[#1e1e1e] border-[#1e1e1e]/40'
                      } cursor-pointer`}
                    >
                      {sc}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
