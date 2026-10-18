import { ExportOptions } from '@/types/studio';

export async function exportSvgElement(
  svgElement: SVGSVGElement,
  baseFilename: string,
  width: number,
  height: number,
  fallbackBgColor: string,
  options: ExportOptions
): Promise<void> {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  clone.setAttribute('width', String(width * options.scale));
  clone.setAttribute('height', String(height * options.scale));
  clone.setAttribute('viewBox', `0 0 ${width} ${height}`);

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  const fullSvgDocument = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n${svgString}`;

  const safeName = baseFilename
    .replace(/[^a-zA-Z0-9가-힣_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  // 1. Direct Vector SVG Export
  if (options.format === 'svg') {
    const svgBlob = new Blob([fullSvgDocument], {
      type: 'image/svg+xml;charset=utf-8',
    });
    triggerDownload(svgBlob, `${safeName}.svg`);
    return;
  }

  // 2. Raster Export (PNG / JPG / WebP) via Offscreen Canvas
  const targetW = width * options.scale;
  const targetH = height * options.scale;

  const svgBlob = new Blob([fullSvgDocument], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const blobUrl = URL.createObjectURL(svgBlob);

  try {
    const img = await loadImage(blobUrl);
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context를 초기화할 수 없습니다.');
    }

    // Fill solid background if JPG or if transparentBg is false
    if (options.format === 'jpg' || !options.transparentBg) {
      ctx.fillStyle = fallbackBgColor || '#FFFFFF';
      ctx.fillRect(0, 0, targetW, targetH);
    }

    ctx.drawImage(img, 0, 0, targetW, targetH);

    const mimeMap: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      webp: 'image/webp',
    };
    const mimeType = mimeMap[options.format] || 'image/png';

    const rasterBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('이미지 변환에 실패했습니다.'));
        },
        mimeType,
        options.quality
      );
    });

    triggerDownload(rasterBlob, `${safeName}-${targetW}x${targetH}.${options.format}`);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
