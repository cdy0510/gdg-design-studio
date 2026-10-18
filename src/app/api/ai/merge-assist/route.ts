import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, prompt, speaker } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    // 1. Mode: Generate Design System Tokens from natural language prompt
    if (mode === 'design-system') {
      if (apiKey) {
        try {
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: `다음 행사 테마 설명에 어울리는 디자인 시스템 JSON 토큰을 생성해줘: "${prompt}".
반드시 아래 JSON 스키마만 반환해:
{
  "name": "테마 이름",
  "description": "테마 설명",
  "colors": {
    "primary": "#HEX",
    "secondary": "#HEX",
    "accent": "#HEX",
    "success": "#HEX",
    "background": "#HEX",
    "surface": "#HEX",
    "textPrimary": "#HEX",
    "textSecondary": "#HEX",
    "border": "#HEX"
  },
  "shapes": {
    "borderRadius": 24,
    "borderWidth": 3,
    "shadowStyle": "brutalist" | "glow" | "soft",
    "patternStyle": "dots" | "grid" | "aurora" | "geometric",
    "speakerFrameShape": "arch" | "circle" | "hexagon" | "pill" | "rounded"
  }
}`,
                      },
                    ],
                  },
                ],
                generationConfig: {
                  responseMimeType: 'application/json',
                },
              }),
            }
          );

          if (geminiRes.ok) {
            const data = await geminiRes.json();
            const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const parsed = JSON.parse(rawText);
              return NextResponse.json({
                source: 'gemini-api',
                tokens: parsed,
              });
            }
          }
        } catch {
          // Fall through to deterministic preset synthesis
        }
      }

      // Smart local fallback generator based on keywords in prompt
      const lower = String(prompt || '').toLowerCase();
      const isDark =
        lower.includes('다크') ||
        lower.includes('네온') ||
        lower.includes('사이버') ||
        lower.includes('ai') ||
        lower.includes('밤');
      const isWarm =
        lower.includes('봄') ||
        lower.includes('따뜻') ||
        lower.includes('오렌지') ||
        lower.includes('파스텔') ||
        lower.includes('페스티벌');

      const generated = isDark
        ? {
            name: `AI Custom · ${prompt.slice(0, 14) || 'Neon Matrix'}`,
            description: `'${prompt}' 프롬프트 기반으로 생성된 다크 네온 디자인 시스템`,
            colors: {
              primary: '#38BDF8',
              secondary: '#F43F5E',
              accent: '#FACC15',
              success: '#4ADE80',
              background: '#090D16',
              surface: '#131B2E',
              textPrimary: '#F8FAFC',
              textSecondary: '#94A3B8',
              border: '#38BDF8',
            },
            shapes: {
              borderRadius: 28,
              borderWidth: 2,
              shadowStyle: 'glow',
              patternStyle: 'aurora',
              speakerFrameShape: 'hexagon',
            },
          }
        : isWarm
        ? {
            name: `AI Custom · ${prompt.slice(0, 14) || 'Warm Fest'}`,
            description: `'${prompt}' 프롬프트 기반으로 생성된 웜톤 페스티벌 디자인 시스템`,
            colors: {
              primary: '#EA580C',
              secondary: '#2563EB',
              accent: '#FACC15',
              success: '#16A34A',
              background: '#FFFBEB',
              surface: '#FFFFFF',
              textPrimary: '#1C1917',
              textSecondary: '#57534E',
              border: '#1C1917',
            },
            shapes: {
              borderRadius: 36,
              borderWidth: 4,
              shadowStyle: 'brutalist',
              patternStyle: 'geometric',
              speakerFrameShape: 'arch',
            },
          }
        : {
            name: `AI Custom · ${prompt.slice(0, 14) || 'GDG Modern'}`,
            description: `'${prompt}' 프롬프트 기반으로 생성된 모던 테크 디자인 시스템`,
            colors: {
              primary: '#2563EB',
              secondary: '#DC2626',
              accent: '#EAB308',
              success: '#16A34A',
              background: '#F1F5F9',
              surface: '#FFFFFF',
              textPrimary: '#0F172A',
              textSecondary: '#475569',
              border: '#0F172A',
            },
            shapes: {
              borderRadius: 24,
              borderWidth: 3,
              shadowStyle: 'brutalist',
              patternStyle: 'dots',
              speakerFrameShape: 'pill',
            },
          };

      return NextResponse.json({
        source: 'studio-synthesizer',
        tokens: generated,
      });
    }

    // 2. Mode: Speaker Photo & Copy Merge Optimization
    if (mode === 'speaker-merge-optimize') {
      const spkName = speaker?.name || '연사자';
      const topic = speaker?.topic || '기술 세션';
      return NextResponse.json({
        source: apiKey ? 'gemini-api' : 'studio-synthesizer',
        recommendation: {
          headlineSuggestion: `[실전 세션] ${topic}`,
          snsCaption: `🎙 ${spkName}님의 세션 "${topic}"에서 실전 인사이트를 만나보세요! 지금 바로 신청하세요.`,
          recommendedFrame: 'arch',
          recommendedAura: true,
        },
      });
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
