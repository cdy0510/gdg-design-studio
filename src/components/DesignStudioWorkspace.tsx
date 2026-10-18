'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Download,
  FileCode,
  FolderUp,
  Image as ImageIcon,
  Layers,
  LayoutTemplate,
  Palette,
  Plus,
  Printer,
  RefreshCw,
  Share2,
  Sparkles,
  Trash2,
  Upload,
  UserPlus,
  Users,
  Wand2,
  ZoomIn,
  ZoomOut,
  Cloud,
  CheckCircle2,
  Eye,
  EyeOff,
  Sliders,
  Calendar,
} from 'lucide-react';
import {
  AssetCategory,
  BaseAssetItem,
  BaseAssetType,
  CanvasPreset,
  DesignSystemTokens,
  EventInfo,
  ExportFormat,
  ExportOptions,
  LayoutTemplateId,
  PatternStyleType,
  PhotoFilterType,
  ShadowStyleType,
  SpeakerFrameShape,
  SpeakerProfile,
} from '@/types/studio';
import {
  CANVAS_PRESETS,
  DEFAULT_BASE_ASSETS,
  DEFAULT_EVENT_INFO,
  DEFAULT_SPEAKERS,
  DESIGN_SYSTEM_PRESETS,
} from '@/data/presets';
import { CanvasSvgRenderer } from './CanvasSvgRenderer';
import { exportSvgElement } from '@/utils/exportAsset';

type ActiveTab = 'speaker' | 'assets' | 'design-system' | 'event';

const LAYOUT_OPTIONS: { id: LayoutTemplateId; label: string; badge: string }[] = [
  { id: 'speaker-card', label: '연사자 스포트라이트 카드', badge: 'SNS 최적' },
  { id: 'session-banner', label: '세션 와이드 홍보 배너', badge: '16:9 / OG' },
  { id: 'main-poster', label: '행사 메인 홍보 포스터', badge: 'SNS / A2' },
  { id: 'x-banner', label: 'X배너 스탠드 (600×1800mm)', badge: '인쇄 전용' },
  { id: 'pamphlet-trifold', label: '3단 접지 팜플렛 / 리플렛', badge: '인쇄 전용' },
  { id: 'nametag-badge', label: '연사자 네임택 / 패스 배지', badge: '인쇄 전용' },
];

export const DesignStudioWorkspace: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Studio Core State
  const [activeCategory, setActiveCategory] = useState<AssetCategory>('sns');
  const [selectedPreset, setSelectedPreset] = useState<CanvasPreset>(CANVAS_PRESETS[0]);
  const [selectedLayout, setSelectedLayout] = useState<LayoutTemplateId>(
    CANVAS_PRESETS[0].defaultLayout
  );
  const [designSystem, setDesignSystem] = useState<DesignSystemTokens>(
    DESIGN_SYSTEM_PRESETS[0]
  );

  // Speakers State
  const [speakers, setSpeakers] = useState<SpeakerProfile[]>(DEFAULT_SPEAKERS);
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>(DEFAULT_SPEAKERS[0].id);

  // Base Assets State
  const [baseAssets, setBaseAssets] = useState<BaseAssetItem[]>(DEFAULT_BASE_ASSETS);
  const [uploadAssetType, setUploadAssetType] = useState<BaseAssetType>('logo');

  // Event Info State
  const [eventInfo, setEventInfo] = useState<EventInfo>(DEFAULT_EVENT_INFO);

  // UI & Viewport State
  const [activeTab, setActiveTab] = useState<ActiveTab>('speaker');
  const [zoom, setZoom] = useState<number>(0.48);
  const [showPrintGuides, setShowPrintGuides] = useState<boolean>(false);

  // Export State
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'png',
    scale: 2,
    quality: 0.95,
    includePrintGuides: false,
    transparentBg: false,
  });
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // Design System JSON Injection & AI Prompt State
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);
  const [jsonInputText, setJsonInputText] = useState<string>('');
  const [aiThemePrompt, setAiThemePrompt] = useState<string>('');
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);

  // GCP Status Modal State
  const [showGcpModal, setShowGcpModal] = useState<boolean>(false);
  const [gcpStatus, setGcpStatus] = useState<{
    connected: boolean;
    environment: string;
    gcp?: {
      projectId: string;
      region: string;
      gcsBucket: string;
      vertexAiReady: boolean;
    };
  } | null>(null);

  const activeSpeaker =
    speakers.find((s) => s.id === selectedSpeakerId) || speakers[0];

  const showToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => {
      setStatusToast((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Fetch GCP status on mount
  useEffect(() => {
    fetch('/api/gcp/status')
      .then((r) => r.json())
      .then((data) => setGcpStatus(data))
      .catch(() => null);
  }, []);

  // Automatically adjust zoom and print guides when switching preset
  const handleSelectPreset = (preset: CanvasPreset) => {
    setSelectedPreset(preset);
    setActiveCategory(preset.category);
    setSelectedLayout(preset.defaultLayout);
    if (preset.category === 'print') {
      setShowPrintGuides(true);
      if (preset.height >= 3000) {
        setZoom(0.2);
      } else if (preset.width >= 2000) {
        setZoom(0.32);
      } else {
        setZoom(0.36);
      }
    } else {
      setShowPrintGuides(false);
      if (preset.height >= 1800) {
        setZoom(0.36);
      } else {
        setZoom(0.48);
      }
    }
  };

  // Update currently selected speaker fields
  const updateActiveSpeaker = (patch: Partial<SpeakerProfile>) => {
    setSpeakers((prev) =>
      prev.map((spk) => (spk.id === activeSpeaker.id ? { ...spk, ...patch } : spk))
    );
  };

  // Handle Speaker Photo Upload (Merge with Current Template)
  const handleSpeakerPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateActiveSpeaker({
          photoDataUrl: reader.result,
          photoScale: 1,
          photoOffsetX: 0,
          photoOffsetY: 0,
        });
        showToast(`✅ '${activeSpeaker.name}' 연사자 사진이 에셋에 머지되었습니다.`);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Add a New Speaker to the Roster
  const handleAddSpeaker = () => {
    const newId = `spk-${Date.now()}`;
    const newSpeaker: SpeakerProfile = {
      id: newId,
      name: `신규 연사자 ${speakers.length + 1}`,
      role: 'Senior Engineer',
      company: 'GDG Community',
      topic: '새로운 세션 주제를 입력하고 연사자 사진을 업로드해 머지하세요',
      track: 'Track A · AI & Cloud',
      dateTime: '2026. 11. 14 (토) 17:20 - 18:00',
      venue: '코엑스 그랜드볼룸',
      bio: '연사자 소개글',
      tags: ['#GDG', '#DevFest', '#Session'],
      photoDataUrl: DEFAULT_SPEAKERS[0].photoDataUrl,
      photoScale: 1,
      photoOffsetX: 0,
      photoOffsetY: 0,
      photoFilter: 'none',
      aiAuraEnabled: true,
    };
    setSpeakers((prev) => [...prev, newSpeaker]);
    setSelectedSpeakerId(newId);
    showToast('👤 새 연사자가 추가되었습니다. 사진을 업로드해 머지해보세요!');
  };

  // Handle Base Asset File Upload
  const handleBaseAssetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const newAsset: BaseAssetItem = {
            id: `asset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: file.name.replace(/\.[^.]+$/, ''),
            type: uploadAssetType,
            dataUrl: reader.result,
            opacity: 1,
            scale: uploadAssetType === 'background' ? 1 : 0.85,
            x:
              uploadAssetType === 'background'
                ? 50
                : uploadAssetType === 'logo'
                ? 8
                : uploadAssetType === 'sponsor'
                ? 50
                : 75,
            y:
              uploadAssetType === 'background'
                ? 50
                : uploadAssetType === 'logo'
                ? 7
                : uploadAssetType === 'sponsor'
                ? 92
                : 12,
            visible: true,
          };
          setBaseAssets((prev) => [...prev, newAsset]);
          showToast(`🖼 기본 에셋 '${file.name}' 업로드 완료!`);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // AI Design System Generator (Vertex AI / Gemini or local synthesis)
  const handleAiDesignSystemGenerate = async () => {
    if (!aiThemePrompt.trim()) {
      showToast('생성할 디자인 시스템 분위기나 키워드를 입력해주세요.');
      return;
    }
    setIsAiGenerating(true);
    try {
      const res = await fetch('/api/ai/merge-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'design-system',
          prompt: aiThemePrompt,
        }),
      });
      const data = await res.json();
      if (data?.tokens) {
        setDesignSystem((prev) => ({
          ...prev,
          id: `custom-${Date.now()}`,
          name: data.tokens.name || prev.name,
          description: data.tokens.description || prev.description,
          colors: { ...prev.colors, ...(data.tokens.colors || {}) },
          shapes: { ...prev.shapes, ...(data.tokens.shapes || {}) },
        }));
        showToast(`✨ AI 디자인 시스템 '${data.tokens.name}'이(가) 주입되었습니다!`);
      }
    } catch {
      showToast('디자인 시스템 생성 중 오류가 발생했습니다.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Open Design System JSON Injector Modal
  const handleOpenJsonInjector = () => {
    setJsonInputText(JSON.stringify(designSystem, null, 2));
    setShowJsonModal(true);
  };

  // Apply Injected Design System JSON
  const handleApplyJsonTokens = () => {
    try {
      const parsed = JSON.parse(jsonInputText);
      setDesignSystem((prev) => ({
        ...prev,
        ...parsed,
        colors: { ...prev.colors, ...(parsed.colors || {}) },
        typography: { ...prev.typography, ...(parsed.typography || {}) },
        shapes: { ...prev.shapes, ...(parsed.shapes || {}) },
      }));
      setShowJsonModal(false);
      showToast('🎨 커스텀 디자인 시스템 JSON 토큰이 성공적으로 주입되었습니다!');
    } catch {
      alert('유효한 JSON 형식이 아닙니다. 문법을 확인해주세요.');
    }
  };

  // Export Current Canvas Asset
  const handleExportCurrent = async () => {
    if (!svgRef.current) return;
    setIsExporting(true);
    const prevGuides = showPrintGuides;
    try {
      if (exportOptions.includePrintGuides !== showPrintGuides) {
        setShowPrintGuides(exportOptions.includePrintGuides);
        await new Promise((r) => setTimeout(r, 80));
      }

      const filename = `${eventInfo.eventName}-${selectedPreset.id}-${activeSpeaker.name}`;
      await exportSvgElement(
        svgRef.current,
        filename,
        selectedPreset.width,
        selectedPreset.height,
        designSystem.colors.background,
        exportOptions
      );
      showToast(
        `🚀 ${exportOptions.format.toUpperCase()} 포맷 (${
          selectedPreset.width * exportOptions.scale
        }×${selectedPreset.height * exportOptions.scale}px) Export 완료!`
      );
    } catch (err) {
      console.error(err);
      showToast('Export 중 오류가 발생했습니다.');
    } finally {
      setShowPrintGuides(prevGuides);
      setIsExporting(false);
    }
  };

  // Batch Export All Speakers sequentially
  const handleBatchExportAllSpeakers = async () => {
    if (!svgRef.current) return;
    setIsExporting(true);
    const originalSpeakerId = selectedSpeakerId;
    try {
      for (const spk of speakers) {
        setSelectedSpeakerId(spk.id);
        await new Promise((r) => setTimeout(r, 150));
        if (svgRef.current) {
          const filename = `${eventInfo.eventName}-${selectedPreset.id}-${spk.name}`;
          await exportSvgElement(
            svgRef.current,
            filename,
            selectedPreset.width,
            selectedPreset.height,
            designSystem.colors.background,
            exportOptions
          );
        }
      }
      showToast(`🎉 전체 연사자(${speakers.length}명) 에셋 일괄 머지 & Export 완료!`);
    } finally {
      setSelectedSpeakerId(originalSpeakerId);
      setIsExporting(false);
    }
  };

  const filteredPresets = CANVAS_PRESETS.filter((p) => p.category === activeCategory);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Studio Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          {/* GDG Studio Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4285F4]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#EA4335]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FBBC04]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#34A853]" />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-2">
                GDG Design Studio
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Event Asset &amp; Speaker Merge
                </span>
              </h1>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 mx-1 hidden md:block" />

          {/* Category Switcher: SNS vs Print (X-Banner / Pamphlet) */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                const firstSns = CANVAS_PRESETS.find((p) => p.category === 'sns')!;
                handleSelectPreset(firstSns);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeCategory === 'sns'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              SNS 홍보용
            </button>
            <button
              onClick={() => {
                const firstPrint = CANVAS_PRESETS.find((p) => p.category === 'print')!;
                handleSelectPreset(firstPrint);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeCategory === 'print'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              인쇄용 (X배너·팜플렛·포스터)
            </button>
          </div>

          {/* Preset Selector Dropdown */}
          <select
            value={selectedPreset.id}
            onChange={(e) => {
              const found = CANVAS_PRESETS.find((p) => p.id === e.target.value);
              if (found) handleSelectPreset(found);
            }}
            className="bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-100 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            {filteredPresets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.aspectLabel}
              </option>
            ))}
          </select>
        </div>

        {/* Right Actions: GCP Status & Quick Export */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowGcpModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            <span>GCP Cloud Run Ready</span>
          </button>

          <button
            onClick={handleOpenJsonInjector}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <FileCode className="w-3.5 h-3.5 text-amber-400" />
            <span>디자인 토큰 JSON 주입</span>
          </button>

          <button
            onClick={handleExportCurrent}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/25 transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? '렌더링 중...' : `${exportOptions.format.toUpperCase()} 내보내기`}</span>
          </button>
        </div>
      </header>

      {/* Main 3-Column Studio Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR: 4 Tabs (Speaker Merge / Base Assets / Design System / Event Info) */}
        <aside className="w-[410px] border-r border-slate-800 bg-slate-900 flex flex-col h-[calc(100vh-4rem)]">
          {/* Tab Navigation */}
          <div className="grid grid-cols-4 border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1">
            <button
              onClick={() => setActiveTab('speaker')}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[11px] font-bold transition ${
                activeTab === 'speaker'
                  ? 'bg-slate-800 text-blue-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4 mb-1" />
              연사자 머지
            </button>
            <button
              onClick={() => setActiveTab('assets')}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[11px] font-bold transition ${
                activeTab === 'assets'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4 mb-1" />
              기본 에셋
            </button>
            <button
              onClick={() => setActiveTab('design-system')}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[11px] font-bold transition ${
                activeTab === 'design-system'
                  ? 'bg-slate-800 text-amber-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Palette className="w-4 h-4 mb-1" />
              디자인 시스템
            </button>
            <button
              onClick={() => setActiveTab('event')}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[11px] font-bold transition ${
                activeTab === 'event'
                  ? 'bg-slate-800 text-purple-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-4 h-4 mb-1" />
              행사/팜플렛
            </button>
          </div>

          {/* Scrollable Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* ============================================================ */}
            {/* TAB 1: SPEAKER PHOTO UPLOAD & MERGE                          */}
            {/* ============================================================ */}
            {activeTab === 'speaker' && (
              <>
                {/* Speaker Roster Selector */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      연사자 선택 ({speakers.length}명)
                    </span>
                    <button
                      onClick={handleAddSpeaker}
                      className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30 transition"
                    >
                      <UserPlus className="w-3 h-3" />
                      연사자 추가
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5">
                    {speakers.map((spk) => (
                      <div
                        key={spk.id}
                        onClick={() => setSelectedSpeakerId(spk.id)}
                        className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition ${
                          spk.id === activeSpeaker.id
                            ? 'bg-blue-950/50 border-blue-500/60 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={spk.photoDataUrl}
                            alt={spk.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
                          />
                          <div className="truncate">
                            <p className="text-xs font-bold truncate text-slate-100">
                              {spk.name}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {spk.company} · {spk.track}
                            </p>
                          </div>
                        </div>
                        {speakers.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const remaining = speakers.filter((s) => s.id !== spk.id);
                              setSpeakers(remaining);
                              if (activeSpeaker.id === spk.id) {
                                setSelectedSpeakerId(remaining[0].id);
                              }
                            }}
                            className="p-1 text-slate-500 hover:text-rose-400"
                            title="연사자 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Speaker Photo Upload & Merge Controls */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                      연사자 사진 업로드 &amp; 프레임 머지
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                      Auto-Clip Merge
                    </span>
                  </div>

                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-blue-500 bg-slate-900/60 hover:bg-slate-900 rounded-xl p-4 cursor-pointer transition group">
                    <Upload className="w-6 h-6 text-blue-400 group-hover:scale-110 transition mb-1.5" />
                    <span className="text-xs font-bold text-slate-200">
                      연사자 프로필 사진 업로드 (클릭)
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      PNG, JPG, WebP, SVG → 선택한 프레임에 즉시 합성됩니다
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSpeakerPhotoUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Speaker Frame Shape Selector */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                      연사자 사진 마스크 프레임 모양
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {(
                        [
                          { id: 'arch', label: '아치형' },
                          { id: 'circle', label: '원형' },
                          { id: 'hexagon', label: '육각형' },
                          { id: 'pill', label: '캡슐형' },
                          { id: 'rounded', label: '라운드' },
                        ] as { id: SpeakerFrameShape; label: string }[]
                      ).map((shape) => (
                        <button
                          key={shape.id}
                          onClick={() =>
                            setDesignSystem((prev) => ({
                              ...prev,
                              shapes: { ...prev.shapes, speakerFrameShape: shape.id },
                            }))
                          }
                          className={`py-1.5 rounded-lg text-[11px] font-bold border transition ${
                            designSystem.shapes.speakerFrameShape === shape.id
                              ? 'bg-blue-600 text-white border-blue-500'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          {shape.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scale & Position Offset Sliders */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>크기 배율</span>
                        <span className="font-mono text-slate-200">
                          {Math.round(activeSpeaker.photoScale * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.6"
                        max="2.2"
                        step="0.05"
                        value={activeSpeaker.photoScale}
                        onChange={(e) =>
                          updateActiveSpeaker({ photoScale: parseFloat(e.target.value) })
                        }
                        className="w-full accent-blue-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>가로 위치(X)</span>
                        <span className="font-mono text-slate-200">
                          {activeSpeaker.photoOffsetX}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-40"
                        max="40"
                        step="1"
                        value={activeSpeaker.photoOffsetX}
                        onChange={(e) =>
                          updateActiveSpeaker({ photoOffsetX: parseInt(e.target.value, 10) })
                        }
                        className="w-full accent-blue-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>세로 위치(Y)</span>
                        <span className="font-mono text-slate-200">
                          {activeSpeaker.photoOffsetY}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-40"
                        max="40"
                        step="1"
                        value={activeSpeaker.photoOffsetY}
                        onChange={(e) =>
                          updateActiveSpeaker({ photoOffsetY: parseInt(e.target.value, 10) })
                        }
                        className="w-full accent-blue-500"
                      />
                    </div>
                  </div>

                  {/* Photo Filter & AI Studio Aura */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <select
                      value={activeSpeaker.photoFilter}
                      onChange={(e) =>
                        updateActiveSpeaker({
                          photoFilter: e.target.value as PhotoFilterType,
                        })
                      }
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    >
                      <option value="none">필터 없음 (원본 컬러)</option>
                      <option value="contrast">스튜디오 선명한 대비 (Contrast)</option>
                      <option value="grayscale">흑백 모노톤 (Grayscale)</option>
                      <option value="duotone-blue">GDG 블루 듀오톤</option>
                      <option value="duotone-warm">데브페스트 웜톤</option>
                    </select>

                    <button
                      onClick={() =>
                        updateActiveSpeaker({
                          aiAuraEnabled: !activeSpeaker.aiAuraEnabled,
                        })
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1 transition ${
                        activeSpeaker.aiAuraEnabled
                          ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      AI 오로라 조명
                    </button>
                  </div>
                </div>

                {/* Speaker & Session Text Fields */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-3">
                  <span className="text-xs font-bold text-slate-200 block">
                    연사자 프로필 &amp; 발표 세션 정보
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        연사자 성함
                      </label>
                      <input
                        type="text"
                        value={activeSpeaker.name}
                        onChange={(e) => updateActiveSpeaker({ name: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        소속 (회사/조직)
                      </label>
                      <input
                        type="text"
                        value={activeSpeaker.company}
                        onChange={(e) => updateActiveSpeaker({ company: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        직함 / 역할
                      </label>
                      <input
                        type="text"
                        value={activeSpeaker.role}
                        onChange={(e) => updateActiveSpeaker({ role: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        세션 트랙 배지
                      </label>
                      <input
                        type="text"
                        value={activeSpeaker.track}
                        onChange={(e) => updateActiveSpeaker({ track: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      발표 세션 제목
                    </label>
                    <textarea
                      rows={2}
                      value={activeSpeaker.topic}
                      onChange={(e) => updateActiveSpeaker({ topic: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        발표 일시
                      </label>
                      <input
                        type="text"
                        value={activeSpeaker.dateTime}
                        onChange={(e) => updateActiveSpeaker({ dateTime: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        발표 홀 / 장소
                      </label>
                      <input
                        type="text"
                        value={activeSpeaker.venue}
                        onChange={(e) => updateActiveSpeaker({ venue: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      세션 태그 (공백 또는 쉼표로 구분)
                    </label>
                    <input
                      type="text"
                      value={activeSpeaker.tags.join(' ')}
                      onChange={(e) =>
                        updateActiveSpeaker({
                          tags: e.target.value.split(/[\s,]+/).filter(Boolean),
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </>
            )}

            {/* ============================================================ */}
            {/* TAB 2: BASE ASSET UPLOAD & LAYER MANAGER                     */}
            {/* ============================================================ */}
            {activeTab === 'assets' && (
              <>
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-3">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <FolderUp className="w-4 h-4 text-emerald-400" />
                    기본 에셋 업로드 (로고·배경·프레임·스티커)
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    행사용 베이스 배경 이미지, 투명 PNG 프레임 오버레이, 주최 챕터 로고, 스폰서 로고 바 등을 업로드하여 연사자 사진과 함께 합성합니다.
                  </p>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      업로드할 에셋 레이어 역할 선택
                    </label>
                    <div className="grid grid-cols-5 gap-1">
                      {(
                        [
                          { id: 'logo', label: '로고' },
                          { id: 'background', label: '배경' },
                          { id: 'frame', label: '프레임' },
                          { id: 'sticker', label: '스티커' },
                          { id: 'sponsor', label: '스폰서' },
                        ] as { id: BaseAssetType; label: string }[]
                      ).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setUploadAssetType(item.id)}
                          className={`py-1.5 rounded-lg text-[11px] font-bold border transition ${
                            uploadAssetType === item.id
                              ? 'bg-emerald-600 text-white border-emerald-500'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-emerald-500 bg-slate-900/60 hover:bg-slate-900 rounded-xl p-4 cursor-pointer transition">
                    <Plus className="w-6 h-6 text-emerald-400 mb-1" />
                    <span className="text-xs font-bold text-slate-200">
                      에셋 파일 선택 (다중 업로드 가능)
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      SVG, PNG, JPG, WebP 지원
                    </span>
                    <input
                      type="file"
                      accept="image/*,.svg"
                      multiple
                      onChange={handleBaseAssetUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Active Base Assets Layer List */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-3">
                  <span className="text-xs font-bold text-slate-200 block">
                    에셋 레이어 목록 ({baseAssets.length})
                  </span>

                  <div className="space-y-2.5">
                    {baseAssets.map((asset) => (
                      <div
                        key={asset.id}
                        className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              onClick={() =>
                                setBaseAssets((prev) =>
                                  prev.map((a) =>
                                    a.id === asset.id ? { ...a, visible: !a.visible } : a
                                  )
                                )
                              }
                              className={`p-1 rounded ${
                                asset.visible ? 'text-emerald-400' : 'text-slate-600'
                              }`}
                            >
                              {asset.visible ? (
                                <Eye className="w-4 h-4" />
                              ) : (
                                <EyeOff className="w-4 h-4" />
                              )}
                            </button>
                            <div className="truncate">
                              <p className="text-xs font-bold text-slate-200 truncate">
                                {asset.name}
                              </p>
                              <span className="text-[10px] font-mono uppercase text-slate-400">
                                {asset.type}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              setBaseAssets((prev) => prev.filter((a) => a.id !== asset.id))
                            }
                            className="p-1 text-slate-500 hover:text-rose-400"
                            title="레이어 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {asset.visible && asset.type !== 'frame' && (
                          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/80">
                            <div>
                              <span className="text-[10px] text-slate-400 block">
                                크기 ({Math.round(asset.scale * 100)}%)
                              </span>
                              <input
                                type="range"
                                min="0.2"
                                max="2.5"
                                step="0.05"
                                value={asset.scale}
                                onChange={(e) =>
                                  setBaseAssets((prev) =>
                                    prev.map((a) =>
                                      a.id === asset.id
                                        ? { ...a, scale: parseFloat(e.target.value) }
                                        : a
                                    )
                                  )
                                }
                                className="w-full accent-emerald-500"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">
                                X 위치 ({asset.x}%)
                              </span>
                              <input
                                type="range"
                                min="0"
                                max="95"
                                step="1"
                                value={asset.x}
                                onChange={(e) =>
                                  setBaseAssets((prev) =>
                                    prev.map((a) =>
                                      a.id === asset.id
                                        ? { ...a, x: parseInt(e.target.value, 10) }
                                        : a
                                    )
                                  )
                                }
                                className="w-full accent-emerald-500"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">
                                Y 위치 ({asset.y}%)
                              </span>
                              <input
                                type="range"
                                min="0"
                                max="95"
                                step="1"
                                value={asset.y}
                                onChange={(e) =>
                                  setBaseAssets((prev) =>
                                    prev.map((a) =>
                                      a.id === asset.id
                                        ? { ...a, y: parseInt(e.target.value, 10) }
                                        : a
                                    )
                                  )
                                }
                                className="w-full accent-emerald-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ============================================================ */}
            {/* TAB 3: DESIGN SYSTEM INJECTOR                                */}
            {/* ============================================================ */}
            {activeTab === 'design-system' && (
              <>
                {/* Built-in Design System Presets */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Palette className="w-4 h-4 text-amber-400" />
                      디자인 시스템 테마 주입
                    </span>
                    <button
                      onClick={handleOpenJsonInjector}
                      className="text-[11px] font-bold text-amber-400 hover:underline"
                    >
                      JSON 직접 편집 →
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {DESIGN_SYSTEM_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          setDesignSystem(preset);
                          showToast(`🎨 '${preset.name}' 디자인 시스템이 적용되었습니다.`);
                        }}
                        className={`w-full text-left p-2.5 rounded-lg border transition flex items-center justify-between ${
                          designSystem.id === preset.id
                            ? 'bg-slate-800 border-amber-500/70 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-bold truncate">{preset.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {preset.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20"
                            style={{ backgroundColor: preset.colors.primary }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20"
                            style={{ backgroundColor: preset.colors.secondary }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20"
                            style={{ backgroundColor: preset.colors.accent }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20"
                            style={{ backgroundColor: preset.colors.background }}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Prompt Design System Generator */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                    AI 프롬프트로 디자인 시스템 생성 (Gemini / Vertex AI)
                  </span>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="예: 다크 네온 AI 해커톤 / 따뜻한 봄 파스텔"
                      value={aiThemePrompt}
                      onChange={(e) => setAiThemePrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAiDesignSystemGenerate();
                      }}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                    <button
                      onClick={handleAiDesignSystemGenerate}
                      disabled={isAiGenerating}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shrink-0 disabled:opacity-50"
                    >
                      {isAiGenerating ? '생성중' : '주입'}
                    </button>
                  </div>
                </div>

                {/* Color & Shape Token Fine-Tuning */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-3">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-blue-400" />
                    세부 컬러 &amp; 형태 토큰 커스텀
                  </span>

                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { key: 'primary', label: 'Primary' },
                        { key: 'secondary', label: 'Secondary' },
                        { key: 'accent', label: 'Accent' },
                        { key: 'background', label: '배경(BG)' },
                        { key: 'surface', label: '카드(Surface)' },
                        { key: 'textPrimary', label: '본문 텍스트' },
                      ] as { key: keyof DesignSystemTokens['colors']; label: string }[]
                    ).map((c) => (
                      <label
                        key={c.key}
                        className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-lg cursor-pointer"
                      >
                        <input
                          type="color"
                          value={designSystem.colors[c.key]}
                          onChange={(e) =>
                            setDesignSystem((prev) => ({
                              ...prev,
                              colors: { ...prev.colors, [c.key]: e.target.value },
                            }))
                          }
                          className="w-5 h-5 rounded border-0 bg-transparent cursor-pointer"
                        />
                        <span className="text-[11px] text-slate-300 truncate">{c.label}</span>
                      </label>
                    ))}
                  </div>

                  {/* Pattern & Shadow Style */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        배경 그래픽 패턴
                      </label>
                      <select
                        value={designSystem.shapes.patternStyle}
                        onChange={(e) =>
                          setDesignSystem((prev) => ({
                            ...prev,
                            shapes: {
                              ...prev.shapes,
                              patternStyle: e.target.value as PatternStyleType,
                            },
                          }))
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
                      >
                        <option value="dots">도트 패턴 (Dots)</option>
                        <option value="grid">테크 그리드 (Grid)</option>
                        <option value="aurora">AI 오로라 (Aurora)</option>
                        <option value="geometric">기하학 도형 (Geometric)</option>
                        <option value="none">패턴 없음 (Clean)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        카드 그림자/테두리 무드
                      </label>
                      <select
                        value={designSystem.shapes.shadowStyle}
                        onChange={(e) =>
                          setDesignSystem((prev) => ({
                            ...prev,
                            shapes: {
                              ...prev.shapes,
                              shadowStyle: e.target.value as ShadowStyleType,
                            },
                          }))
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
                      >
                        <option value="brutalist">네오브루탈리즘 (GDG 오프셋)</option>
                        <option value="glow">네온 글로우 (Glow)</option>
                        <option value="soft">소프트 모던 (Soft)</option>
                        <option value="none">플랫 (Flat)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1">
                        모서리 곡률 ({designSystem.shapes.borderRadius}px)
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="56"
                        value={designSystem.shapes.borderRadius}
                        onChange={(e) =>
                          setDesignSystem((prev) => ({
                            ...prev,
                            shapes: {
                              ...prev.shapes,
                              borderRadius: parseInt(e.target.value, 10),
                            },
                          }))
                        }
                        className="w-full accent-amber-500"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1">
                        테두리 두께 ({designSystem.shapes.borderWidth}px)
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="8"
                        value={designSystem.shapes.borderWidth}
                        onChange={(e) =>
                          setDesignSystem((prev) => ({
                            ...prev,
                            shapes: {
                              ...prev.shapes,
                              borderWidth: parseInt(e.target.value, 10),
                            },
                          }))
                        }
                        className="w-full accent-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ============================================================ */}
            {/* TAB 4: EVENT INFO & PAMPHLET SCHEDULE                        */}
            {/* ============================================================ */}
            {activeTab === 'event' && (
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-3">
                <span className="text-xs font-bold text-slate-200 block">
                  행사 공통 정보 &amp; 인쇄물(X배너·팜플렛) 텍스트
                </span>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">행사 타이틀</label>
                  <input
                    type="text"
                    value={eventInfo.eventName}
                    onChange={(e) =>
                      setEventInfo((prev) => ({ ...prev, eventName: e.target.value }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">행사 슬로건 / 부제</label>
                  <input
                    type="text"
                    value={eventInfo.subtitle}
                    onChange={(e) =>
                      setEventInfo((prev) => ({ ...prev, subtitle: e.target.value }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">주최 챕터명</label>
                    <input
                      type="text"
                      value={eventInfo.chapterName}
                      onChange={(e) =>
                        setEventInfo((prev) => ({ ...prev, chapterName: e.target.value }))
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">대표 해시태그</label>
                    <input
                      type="text"
                      value={eventInfo.hashtag}
                      onChange={(e) =>
                        setEventInfo((prev) => ({ ...prev, hashtag: e.target.value }))
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">행사 일시</label>
                  <input
                    type="text"
                    value={eventInfo.date}
                    onChange={(e) => setEventInfo((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">행사 장소</label>
                  <input
                    type="text"
                    value={eventInfo.location}
                    onChange={(e) =>
                      setEventInfo((prev) => ({ ...prev, location: e.target.value }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    하단 CTA 안내 문구 (X배너 하단 등)
                  </label>
                  <input
                    type="text"
                    value={eventInfo.ctaText}
                    onChange={(e) =>
                      setEventInfo((prev) => ({ ...prev, ctaText: e.target.value }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    팜플렛(리플렛) 행사 소개글
                  </label>
                  <textarea
                    rows={3}
                    value={eventInfo.pamphletIntro}
                    onChange={(e) =>
                      setEventInfo((prev) => ({ ...prev, pamphletIntro: e.target.value }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white resize-none"
                  />
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* CENTER WORKSPACE: Interactive Canvas Stage & Layout Bar */}
        <main className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden">
          {/* Sub-Toolbar: Layout Template Switcher & Print Guides */}
          <div className="border-b border-slate-800/80 bg-slate-900/50 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1">
                <LayoutTemplate className="w-3.5 h-3.5 text-blue-400" />
                레이아웃:
              </span>
              {LAYOUT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedLayout(opt.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 whitespace-nowrap ${
                    selectedLayout === opt.id
                      ? 'bg-blue-600/25 border-blue-500 text-blue-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                    {opt.badge}
                  </span>
                </button>
              ))}
            </div>

            {/* Right Controls: Print Guides & Zoom */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPrintGuides((v) => !v)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                  showPrintGuides
                    ? 'bg-rose-500/20 border-rose-500/60 text-rose-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                📏 인쇄 가이드(재단·접지·타공선) {showPrintGuides ? 'ON' : 'OFF'}
              </button>

              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-1.5 py-0.5">
                <button
                  onClick={() => setZoom((z) => Math.max(0.15, +(z - 0.08).toFixed(2)))}
                  className="p-1 text-slate-400 hover:text-white"
                  title="축소"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono px-2 text-slate-300">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom((z) => Math.min(1.2, +(z + 0.08).toFixed(2)))}
                  className="p-1 text-slate-400 hover:text-white"
                  title="확대"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Canvas Viewport Area */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]">
            <div
              className="shadow-2xl shadow-black/80 ring-1 ring-white/10 transition-all duration-150 origin-center bg-transparent"
              style={{
                width: Math.round(selectedPreset.width * zoom),
                height: Math.round(selectedPreset.height * zoom),
              }}
            >
              <CanvasSvgRenderer
                svgRef={svgRef}
                preset={selectedPreset}
                layout={selectedLayout}
                designSystem={designSystem}
                speaker={activeSpeaker}
                allSpeakers={speakers}
                eventInfo={eventInfo}
                baseAssets={baseAssets}
                showPrintGuides={showPrintGuides}
                transparentBg={exportOptions.transparentBg}
              />
            </div>
          </div>

          {/* Bottom Spec Info Bar */}
          <div className="h-9 border-t border-slate-800/80 bg-slate-900/80 px-4 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-4">
              <span>
                규격: <strong className="text-slate-200">{selectedPreset.name}</strong> (
                {selectedPreset.width} × {selectedPreset.height} px
                {selectedPreset.physicalSize ? ` · 인쇄 ${selectedPreset.physicalSize}` : ''})
              </span>
              <span>
                디자인 시스템: <strong className="text-amber-300">{designSystem.name}</strong>
              </span>
              <span>
                현재 머지 연사자: <strong className="text-blue-300">{activeSpeaker.name}</strong>
              </span>
            </div>

            {statusToast && (
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {statusToast}
              </div>
            )}
          </div>
        </main>

        {/* RIGHT PANEL: Multi-Format Export & Batch Speaker Merge */}
        <aside className="w-80 border-l border-slate-800 bg-slate-900 p-4 flex flex-col justify-between h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="space-y-5">
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-1">
                <Download className="w-4 h-4 text-blue-400" />
                포맷별 에셋 Export 설정
              </h2>
              <p className="text-[11px] text-slate-400">
                SVG 벡터 원본부터 인쇄용 300 DPI 고해상도 PNG/JPG까지 원하는 포맷으로 즉시 출력합니다.
              </p>
            </div>

            {/* Format Selection: SVG / PNG / JPG / WebP */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-300">
                파일 포맷 선택
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    {
                      id: 'svg',
                      label: 'SVG (벡터 원본)',
                      desc: '피그마·일러스트레이터·인쇄소용',
                    },
                    {
                      id: 'png',
                      label: 'PNG (무손실)',
                      desc: 'SNS 홍보·투명 배경 지원',
                    },
                    {
                      id: 'jpg',
                      label: 'JPG (고화질 압축)',
                      desc: '행사 페이지·경량 업로드',
                    },
                    {
                      id: 'webp',
                      label: 'WebP (웹 최적화)',
                      desc: '차세대 초경량 웹 에셋',
                    },
                  ] as { id: ExportFormat; label: string; desc: string }[]
                ).map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() =>
                      setExportOptions((prev) => ({ ...prev, format: fmt.id }))
                    }
                    className={`p-2.5 rounded-xl border text-left transition ${
                      exportOptions.format === fmt.id
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <p className="text-xs font-extrabold">{fmt.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{fmt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution Scale Multiplier */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-300">
                출력 해상도 배율 (DPI 스케일)
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {([1, 2, 3] as (1 | 2 | 3)[]).map((sc) => (
                  <button
                    key={sc}
                    onClick={() => setExportOptions((prev) => ({ ...prev, scale: sc }))}
                    className={`py-2 px-2 rounded-lg border text-center transition ${
                      exportOptions.scale === sc
                        ? 'bg-emerald-600/25 border-emerald-500 text-emerald-200 font-bold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-extrabold">{sc}x</div>
                    <div className="text-[10px] opacity-80">
                      {sc === 1 ? '웹 표준' : sc === 2 ? '고화질' : '인쇄급 300DPI'}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
                출력 픽셀:{' '}
                <strong className="text-white">
                  {selectedPreset.width * exportOptions.scale} ×{' '}
                  {selectedPreset.height * exportOptions.scale} px
                </strong>
              </p>
            </div>

            {/* Quality Slider for JPG / WebP */}
            {(exportOptions.format === 'jpg' || exportOptions.format === 'webp') && (
              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>압축 품질 (Quality)</span>
                  <span className="font-mono">{Math.round(exportOptions.quality * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1"
                  step="0.05"
                  value={exportOptions.quality}
                  onChange={(e) =>
                    setExportOptions((prev) => ({
                      ...prev,
                      quality: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full accent-blue-500"
                />
              </div>
            )}

            {/* Checkboxes: Transparent Background & Print Guides */}
            <div className="space-y-2 pt-1 border-t border-slate-800">
              {exportOptions.format !== 'jpg' && (
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exportOptions.transparentBg}
                    onChange={(e) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        transparentBg: e.target.checked,
                      }))
                    }
                    className="rounded accent-blue-500"
                  />
                  <span>배경 투명화 (Transparent Background)</span>
                </label>
              )}

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportOptions.includePrintGuides}
                  onChange={(e) =>
                    setExportOptions((prev) => ({
                      ...prev,
                      includePrintGuides: e.target.checked,
                    }))
                  }
                  className="rounded accent-rose-500"
                />
                <span>인쇄소용 재단선/접지선 포함하여 Export</span>
              </label>
            </div>

            {/* Primary Export Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleExportCurrent}
                disabled={isExporting}
                className="w-full py-3 px-4 rounded-xl font-extrabold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>
                  현재 에셋 {exportOptions.format.toUpperCase()} 다운로드
                </span>
              </button>

              <button
                onClick={handleBatchExportAllSpeakers}
                disabled={isExporting}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isExporting ? 'animate-spin' : ''}`} />
                <span>
                  전체 연사자 ({speakers.length}명) 일괄 머지 Export
                </span>
              </button>
            </div>
          </div>

          {/* Bottom Preset Summary Card */}
          <div className="mt-6 p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5 text-[11px] text-slate-400">
            <div className="font-bold text-slate-200 flex items-center justify-between">
              <span>💡 용도별 제작 팁</span>
              <span className="text-[10px] font-mono text-blue-400">{selectedPreset.category.toUpperCase()}</span>
            </div>
            <p className="leading-relaxed">{selectedPreset.description}</p>
          </div>
        </aside>
      </div>

      {/* ==================================================================== */}
      {/* MODAL 1: DESIGN SYSTEM JSON TOKEN INJECTOR                           */}
      {/* ==================================================================== */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <FileCode className="w-5 h-5 text-amber-400" />
                디자인 시스템 JSON 토큰 주입 (Design System Injector)
              </h3>
              <button
                onClick={() => setShowJsonModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                닫기 ✕
              </button>
            </div>
            <p className="text-xs text-slate-400">
              행사 브랜드 가이드라인의 컬러 팔레트(`colors`), 타이포그래피(`typography`), 프레임/도형(`shapes`) JSON 토큰을 붙여넣으면 모든 SNS 및 인쇄용 템플릿에 즉시 반영됩니다.
            </p>
            <textarea
              rows={15}
              value={jsonInputText}
              onChange={(e) => setJsonInputText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-emerald-300 focus:outline-none focus:border-amber-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowJsonModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                취소
              </button>
              <button
                onClick={handleApplyJsonTokens}
                className="px-5 py-2 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400"
              >
                디자인 시스템 토큰 주입하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: GCP CLOUD RUN & VERTEX AI DEPLOYMENT STATUS                 */}
      {/* ==================================================================== */}
      {showGcpModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Cloud className="w-5 h-5 text-emerald-400" />
                Google Cloud Platform (GCP) 배포 및 연동 준비 상태
              </h3>
              <button
                onClick={() => setShowGcpModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                닫기 ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block mb-1">현재 실행 환경</span>
                <strong className="text-emerald-400 font-mono text-sm">
                  {gcpStatus?.environment || 'local-dev'}
                </strong>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block mb-1">GCP Project / Region</span>
                <strong className="text-slate-200 font-mono text-sm">
                  {gcpStatus?.gcp?.projectId} ({gcpStatus?.gcp?.region})
                </strong>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-300">
              <p className="font-bold text-white">✅ 프로젝트 내 준비된 GCP 배포 구성 요소:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>
                  <code className="text-amber-300">Dockerfile</code> — Next.js Standalone 멀티스테이지 빌드 (Cloud Run 포트 8080 최적화)
                </li>
                <li>
                  <code className="text-amber-300">cloudbuild.yaml</code> — Artifact Registry 이미지 푸시 및 Cloud Run 자동 배포 파이프라인
                </li>
                <li>
                  <code className="text-amber-300">.github/workflows/deploy-gcp.yml</code> — GitHub main 브랜치 푸시 시 Cloud Run 자동 배포 워크플로우
                </li>
                <li>
                  <code className="text-amber-300">scripts/setup-gcp.sh</code> — GCP API 활성화, Artifact Registry, GCS 버킷 원클릭 생성 스크립트
                </li>
              </ul>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-[11px] text-blue-300 space-y-1">
              <p className="text-slate-400"># 1. GCP 초기 리소스 생성</p>
              <p>./scripts/setup-gcp.sh YOUR_GCP_PROJECT_ID asia-northeast3</p>
              <p className="text-slate-400 pt-1"># 2. Cloud Build로 즉시 Cloud Run 배포</p>
              <p>gcloud builds submit --config cloudbuild.yaml</p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowGcpModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-500"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
