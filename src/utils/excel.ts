import { SAMPLE_PORTRAITS } from '@/data/presets';
import { SpeakerSessionItem } from '@/types/studio';

export type SampleExcelRow = Omit<
  SpeakerSessionItem,
  'id' | 'photoDataUrl' | 'photoOffsetX' | 'photoOffsetY' | 'photoScale' | 'photoFilter'
>;

/**
 * Sample speaker & session rows used for `sample.xlsx` download.
 */
export const SAMPLE_EXCEL_ROWS: SampleExcelRow[] = [
  {
    name: '김지훈',
    affiliation: 'Google Cloud Korea',
    role: 'Staff Customer Engineer',
    title: 'Gemini 2.5와 Vertex AI로 구축하는 프로덕션 멀티 에이전트 아키텍처',
    description:
      '실제 엔터프라이즈 환경에서 컨텍스트 압축, 도구 호출 안정성, 레이턴시 최적화를 달성한 설계 패턴을 공유합니다.',
    track: 'AI & Cloud',
    room: 'Hall A (오디토리움)',
    time: '13:00 - 13:50',
  },
  {
    name: '박소연',
    affiliation: 'Toss (Viva Republic)',
    role: 'Frontend Platform Lead',
    title: '대규모 웹 애플리케이션을 위한 디자인 시스템 토큰 파이프라인',
    description:
      'Figma 변수부터 CSS 런타임, SVG 에셋 자동 생성까지 디자이너와 엔지니어의 간극을 줄인 실전 워크플로우를 다룹니다.',
    track: 'Web & Design',
    room: 'Hall B (세미나실 101)',
    time: '14:00 - 14:50',
  },
  {
    name: '이도현',
    affiliation: 'Karrot (당근)',
    role: 'Staff Android Engineer',
    title: 'Kotlin Multiplatform과 Compose로 하나의 코드베이스에서 60fps 달성하기',
    description:
      '안드로이드와 iOS 양쪽에서 네이티브 수준의 렌더링 성능과 메모리 안정성을 확보한 프로파일링 사례를 소개합니다.',
    track: 'Mobile',
    room: 'Hall A (오디토리움)',
    time: '15:10 - 16:00',
  },
  {
    name: '최윤서',
    affiliation: 'DeepMind Open Source Contributor',
    role: 'ML Systems Engineer',
    title: '온디바이스 추론 최적화: WebGPU와 경량 모델 양자화 실전 가이드',
    description:
      '서버 비용 없이 브라우저와 모바일 기기에서 실시간 추론을 구동하기 위한 양자화 및 셰이더 튜닝 기법을 알아봅니다.',
    track: 'AI & Cloud',
    room: 'Hall A (오디토리움)',
    time: '16:10 - 17:00',
  },
  {
    name: '정현우',
    affiliation: 'LINE Plus',
    role: 'Principal Infrastructure Engineer',
    title: 'Kubernetes 멀티 클러스터 환경에서의 Zero-Downtime 메시 마이그레이션',
    description:
      '수억 건의 일일 트래픽을 무중단으로 전환하기 위해 설계한 카나리 검증 파이프라인과 관측성(Observability) 체계를 설명합니다.',
    track: 'Cloud & Infra',
    room: 'Hall B (세미나실 101)',
    time: '17:10 - 18:00',
  },
];

// ============================================================================
// Minimal, Standards-Compliant OpenXML (.xlsx) Generator & Parser
// Works in browser and Node without external npm dependencies.
// ============================================================================

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function escapeXml(str: string): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function colLetter(colIdx: number): string {
  let s = '';
  let n = colIdx + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function createZipArchive(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const dataBytes = file.data;
    const crc = crc32(dataBytes);
    const size = dataBytes.length;

    // Local file header (30 bytes + name)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true); // signature
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0x0800, true); // UTF-8 flag
    lv.setUint16(8, 0, true); // compression: 0 (stored)
    lv.setUint16(10, 0, true); // mod time
    lv.setUint16(12, 0x5421, true); // mod date
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, dataBytes);

    // Central directory header (46 bytes + name)
    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0x5421, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    centralParts.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  }

  const centralSize = centralParts.reduce((acc, p) => acc + p.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const totalLength = offset + centralSize + eocd.length;
  const out = new Uint8Array(totalLength);
  let pos = 0;
  for (const part of localParts) {
    out.set(part, pos);
    pos += part.length;
  }
  for (const part of centralParts) {
    out.set(part, pos);
    pos += part.length;
  }
  out.set(eocd, pos);
  return out;
}

/**
 * Builds a valid `.xlsx` binary Uint8Array from speaker/session items.
 */
export function generateSampleXlsxBytes(
  rows: SampleExcelRow[] = SAMPLE_EXCEL_ROWS
): Uint8Array {
  const encoder = new TextEncoder();

  const headers = ['이름', '소속', '직함', '세션 제목', '설명', '트랙', '장소', '시간'];
  const allRows: string[][] = [
    headers,
    ...rows.map((r) => [
      r.name,
      r.affiliation,
      r.role,
      r.title,
      r.description,
      r.track,
      r.room,
      r.time,
    ]),
  ];

  // Build sharedStrings.xml and sheet1.xml
  const sharedStrings: string[] = [];
  const stringMap = new Map<string, number>();
  const getStringIndex = (val: string) => {
    const key = String(val ?? '');
    const existing = stringMap.get(key);
    if (existing !== undefined) return existing;
    const idx = sharedStrings.length;
    sharedStrings.push(key);
    stringMap.set(key, idx);
    return idx;
  };

  let sheetRowsXml = '';
  allRows.forEach((rowCells, rIdx) => {
    const rowNum = rIdx + 1;
    const isHeader = rIdx === 0;
    const rowHeight = isHeader ? '26' : '22';
    let cellsXml = '';
    rowCells.forEach((cellVal, cIdx) => {
      const ref = `${colLetter(cIdx)}${rowNum}`;
      const sIdx = getStringIndex(cellVal);
      const styleAttr = isHeader ? ' s="1"' : ' s="0"';
      cellsXml += `<c r="${ref}" t="s"${styleAttr}><v>${sIdx}</v></c>`;
    });
    sheetRowsXml += `<row r="${rowNum}" ht="${rowHeight}" customHeight="1">${cellsXml}</row>`;
  });

  const sharedStringsXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${sharedStrings.length}" uniqueCount="${sharedStrings.length}">` +
    sharedStrings.map((s) => `<si><t xml:space="preserve">${escapeXml(s)}</t></si>`).join('') +
    `</sst>`;

  const sheetXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<cols>` +
    `<col min="1" max="1" width="16" customWidth="1"/>` +
    `<col min="2" max="2" width="32" customWidth="1"/>` +
    `<col min="3" max="3" width="48" customWidth="1"/>` +
    `<col min="4" max="4" width="60" customWidth="1"/>` +
    `<col min="5" max="5" width="24" customWidth="1"/>` +
    `<col min="6" max="6" width="14" customWidth="1"/>` +
    `<col min="7" max="7" width="18" customWidth="1"/>` +
    `</cols>` +
    `<sheetData>${sheetRowsXml}</sheetData>` +
    `</worksheet>`;

  const stylesXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<fonts count="2">` +
    `<font><sz val="11"/><color rgb="FF1E1E1E"/><name val="Pretendard"/></font>` +
    `<font><b/><sz val="11"/><color rgb="FF1E1E1E"/><name val="Pretendard"/></font>` +
    `</fonts>` +
    `<fills count="3">` +
    `<fill><patternFill patternType="none"/></fill>` +
    `<fill><patternFill patternType="gray125"/></fill>` +
    `<fill><patternFill patternType="solid"><fgColor rgb="FFC3ECF6"/><bgColor indexed="64"/></patternFill></fill>` +
    `</fills>` +
    `<borders count="2">` +
    `<border><left/><right/><top/><bottom/><diagonal/></border>` +
    `<border>` +
    `<left style="thin"><color rgb="FF1E1E1E"/></left>` +
    `<right style="thin"><color rgb="FF1E1E1E"/></right>` +
    `<top style="thin"><color rgb="FF1E1E1E"/></top>` +
    `<bottom style="medium"><color rgb="FF1E1E1E"/></bottom>` +
    `</border>` +
    `</borders>` +
    `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
    `<cellXfs count="2">` +
    `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"><alignment vertical="center" wrapText="1"/></xf>` +
    `<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center"/></xf>` +
    `</cellXfs>` +
    `</styleSheet>`;

  const workbookXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<sheets><sheet name="Speakers_Agenda" sheetId="1" r:id="rId1"/></sheets>` +
    `</workbook>`;

  const workbookRelsXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
    `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
    `<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>` +
    `</Relationships>`;

  const rootRelsXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
    `</Relationships>`;

  const contentTypesXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
    `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
    `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
    `<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>` +
    `</Types>`;

  return createZipArchive([
    { name: '[Content_Types].xml', data: encoder.encode(contentTypesXml) },
    { name: '_rels/.rels', data: encoder.encode(rootRelsXml) },
    { name: 'xl/workbook.xml', data: encoder.encode(workbookXml) },
    { name: 'xl/_rels/workbook.xml.rels', data: encoder.encode(workbookRelsXml) },
    { name: 'xl/styles.xml', data: encoder.encode(stylesXml) },
    { name: 'xl/sharedStrings.xml', data: encoder.encode(sharedStringsXml) },
    { name: 'xl/worksheets/sheet1.xml', data: encoder.encode(sheetXml) },
  ]);
}

/**
 * Triggers a browser download of `sample.xlsx`.
 */
export function downloadSampleXlsx(): void {
  const bytes = generateSampleXlsxBytes(SAMPLE_EXCEL_ROWS);
  const blob = new Blob([bytes.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sample.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ============================================================================
// ZIP / OpenXML (.xlsx) & CSV Reader in Browser
// ============================================================================

async function inflateRawBytes(compressed: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream !== 'undefined') {
    const ds = new DecompressionStream('deflate-raw');
    const writer = ds.writable.getWriter();
    writer.write(compressed as unknown as BufferSource);
    writer.close();
    const reader = ds.readable.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        total += value.length;
      }
    }
    const out = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) {
      out.set(c, offset);
      offset += c.length;
    }
    return out;
  }
  throw new Error('DecompressionStream not available');
}

async function unzipXlsxEntries(buffer: ArrayBuffer): Promise<Map<string, string>> {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const decoder = new TextDecoder('utf-8');
  const entries = new Map<string, string>();

  // Locate End of Central Directory (EOCD) scanning backwards
  let eocdOffset = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) {
    throw new Error('유효한 Excel (.xlsx) 파일이 아닙니다.');
  }

  const totalEntries = view.getUint16(eocdOffset + 10, true);
  let cdOffset = view.getUint32(eocdOffset + 16, true);

  for (let idx = 0; idx < totalEntries; idx++) {
    if (view.getUint32(cdOffset, true) !== 0x02014b50) break;
    const compressionMethod = view.getUint16(cdOffset + 10, true);
    const compressedSize = view.getUint32(cdOffset + 20, true);
    const nameLen = view.getUint16(cdOffset + 28, true);
    const extraLen = view.getUint16(cdOffset + 30, true);
    const commentLen = view.getUint16(cdOffset + 32, true);
    const localHeaderOffset = view.getUint32(cdOffset + 42, true);

    const fileName = decoder.decode(bytes.subarray(cdOffset + 46, cdOffset + 46 + nameLen));
    cdOffset += 46 + nameLen + extraLen + commentLen;

    if (!fileName.endsWith('.xml') && !fileName.endsWith('.rels')) continue;

    const localNameLen = view.getUint16(localHeaderOffset + 26, true);
    const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
    const rawSlice = bytes.subarray(dataStart, dataStart + compressedSize);

    let uncompressed: Uint8Array;
    if (compressionMethod === 0) {
      uncompressed = rawSlice;
    } else if (compressionMethod === 8) {
      uncompressed = await inflateRawBytes(rawSlice);
    } else {
      continue;
    }

    entries.set(fileName, decoder.decode(uncompressed));
  }

  return entries;
}

function colRefToIndex(ref: string): number {
  const match = ref.match(/^[A-Z]+/i);
  if (!match) return 0;
  const letters = match[0].toUpperCase();
  let idx = 0;
  for (let i = 0; i < letters.length; i++) {
    idx = idx * 26 + (letters.charCodeAt(i) - 64);
  }
  return idx - 1;
}

function parseXmlRows(entries: Map<string, string>): string[][] {
  const sharedStrings: string[] = [];
  const sstXml = entries.get('xl/sharedStrings.xml');
  if (sstXml) {
    const siMatches = [...sstXml.matchAll(/<si[\s>][\s\S]*?<\/si>/g)];
    for (const m of siMatches) {
      const tMatches = [...m[0].matchAll(/<t(?:\s+[^>]*)?>([\s\S]*?)<\/t>/g)];
      const combined = tMatches.map((tm) => unescapeXml(tm[1])).join('');
      sharedStrings.push(combined);
    }
  }

  // Find first worksheet
  const sheetXml =
    entries.get('xl/worksheets/sheet1.xml') ||
    [...entries.entries()].find(([k]) => k.startsWith('xl/worksheets/sheet'))?.[1];

  if (!sheetXml) {
    throw new Error('엑셀 워크시트(sheet1.xml)를 찾을 수 없습니다.');
  }

  const rows: string[][] = [];
  const rowMatches = [...sheetXml.matchAll(/<row(?:\s+[^>]*)?>([\s\S]*?)<\/row>/g)];

  for (const rm of rowMatches) {
    const rowContent = rm[1];
    const rowCells: string[] = [];
    const cellMatches = [...rowContent.matchAll(/<c(\s+[^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)];
    let fallbackCol = 0;

    for (const cm of cellMatches) {
      const attrs = cm[1] || '';
      const inner = cm[2] || '';
      const rMatch = attrs.match(/\br="([A-Z]+\d+)"/i);
      const tMatch = attrs.match(/\bt="([^"]+)"/);
      const colIdx = rMatch ? colRefToIndex(rMatch[1]) : fallbackCol;
      fallbackCol = colIdx + 1;

      const cellType = tMatch ? tMatch[1] : '';
      let value = '';

      if (cellType === 'inlineStr') {
        const tMatches = [...inner.matchAll(/<t(?:\s+[^>]*)?>([\s\S]*?)<\/t>/g)];
        value = tMatches.map((tm) => unescapeXml(tm[1])).join('');
      } else {
        const vMatch = inner.match(/<v(?:\s+[^>]*)?>([\s\S]*?)<\/v>/);
        const rawVal = vMatch ? unescapeXml(vMatch[1]).trim() : '';
        if (cellType === 's') {
          const sIdx = parseInt(rawVal, 10);
          value = !Number.isNaN(sIdx) && sharedStrings[sIdx] !== undefined ? sharedStrings[sIdx] : rawVal;
        } else {
          value = rawVal;
        }
      }

      while (rowCells.length <= colIdx) {
        rowCells.push('');
      }
      rowCells[colIdx] = value.trim();
    }

    if (rowCells.some((c) => c !== '')) {
      rows.push(rowCells);
    }
  }

  return rows;
}

function unescapeXml(str: string): string {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',' || ch === '\t') {
        current.push(field.trim());
        field = '';
      } else if (ch === '\r' && next === '\n') {
        current.push(field.trim());
        if (current.some((c) => c !== '')) rows.push(current);
        current = [];
        field = '';
        i++;
      } else if (ch === '\n' || ch === '\r') {
        current.push(field.trim());
        if (current.some((c) => c !== '')) rows.push(current);
        current = [];
        field = '';
      } else {
        field += ch;
      }
    }
  }
  if (field !== '' || current.length > 0) {
    current.push(field.trim());
    if (current.some((c) => c !== '')) rows.push(current);
  }
  return rows;
}

function mapRawTableToSpeakers(table: string[][]): SpeakerSessionItem[] {
  if (table.length === 0) return [];

  const headerRow = table[0].map((h) => h.toLowerCase().replace(/\s+/g, ''));
  const findCol = (keywords: string[], fallbackIdx: number): number => {
    const found = headerRow.findIndex((h) => keywords.some((k) => h.includes(k)));
    return found !== -1 ? found : fallbackIdx;
  };

  // Detect if row 0 is a header row
  const hasHeader = headerRow.some((h) =>
    ['이름', '연사', 'name', 'speaker', '세션', '제목', 'title', '소속', 'company', '시간', 'time'].some((k) =>
      h.includes(k)
    )
  );

  const hasExplicitRoleCol =
    hasHeader &&
    headerRow.some((h) => ['직함', '역할', '직책', 'role', 'position'].some((k) => h.includes(k)));

  const nameIdx = hasHeader ? findCol(['이름', '연사', '성명', 'name', 'speaker'], 0) : 0;
  const affiliationIdx = hasHeader
    ? findCol(['소속', '회사', '조직', 'affiliation', 'company', 'org'], 1)
    : 1;
  const roleIdx = hasExplicitRoleCol
    ? findCol(['직함', '역할', '직책', 'role', 'position'], 2)
    : -1;
  const shift = hasExplicitRoleCol ? 1 : 0;
  const titleIdx = hasHeader
    ? findCol(
        ['세션제목', '발표제목', '제목', '세션', '주제', 'talktitle', 'session', 'title', 'topic'],
        2 + shift
      )
    : 2 + shift;
  const descIdx = hasHeader
    ? findCol(['설명', '소개', '요약', '내용', 'description', 'summary', 'abstract', 'bio'], 3 + shift)
    : 3 + shift;
  const trackIdx = hasHeader ? findCol(['트랙', '카테고리', '분류', 'track', 'category'], 4 + shift) : 4 + shift;
  const roomIdx = hasHeader ? findCol(['장소', '룸', '홀', '강의실', 'room', 'hall', 'venue'], 5 + shift) : 5 + shift;
  const timeIdx = hasHeader
    ? findCol(['시간', '발표시간', '타임', '일정', 'time', 'slot', 'schedule'], 6 + shift)
    : 6 + shift;

  const dataRows = hasHeader ? table.slice(1) : table;

  return dataRows
    .map((row, idx): SpeakerSessionItem | null => {
      const name = (row[nameIdx] ?? '').trim();
      const rawAffiliation = (row[affiliationIdx] ?? '').trim();
      const explicitRole = roleIdx >= 0 ? (row[roleIdx] ?? '').trim() : '';
      const title = (row[titleIdx] ?? '').trim();
      const description = (row[descIdx] ?? '').trim();
      const track = (row[trackIdx] ?? '').trim() || 'AI & Cloud';
      const room = (row[roomIdx] ?? '').trim() || 'Hall A';
      const time = (row[timeIdx] ?? '').trim() || `${13 + (idx % 5)}:00 - ${13 + (idx % 5)}:50`;

      if (!name && !title) return null;

      let affiliation = rawAffiliation || 'Google Developer Groups';
      let role = explicitRole;
      if (!role && rawAffiliation.includes('·')) {
        const parts = rawAffiliation.split('·').map((s) => s.trim());
        affiliation = parts[0] || affiliation;
        role = parts.slice(1).join(' · ');
      }

      return {
        id: `spk-xlsx-${Date.now()}-${idx}`,
        name: name || `연사자 ${idx + 1}`,
        affiliation,
        role,
        title: title || '세션 제목을 입력해 주세요',
        description: description || '',
        track,
        room,
        time,
        photoDataUrl: SAMPLE_PORTRAITS[idx % SAMPLE_PORTRAITS.length],
        photoOffsetX: 0,
        photoOffsetY: 0,
        photoScale: 1,
        photoFilter: 'none',
      };
    })
    .filter((item): item is SpeakerSessionItem => item !== null);
}

/**
 * Parses an uploaded `.xlsx` or `.csv` / `.tsv` File into `SpeakerSessionItem[]`.
 */
export async function parseUploadedSpeakerExcel(file: File): Promise<SpeakerSessionItem[]> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.csv') || lower.endsWith('.tsv') || lower.endsWith('.txt')) {
    const text = await file.text();
    const table = parseCsvText(text);
    return mapRawTableToSpeakers(table);
  }

  const buffer = await file.arrayBuffer();
  const entries = await unzipXlsxEntries(buffer);
  const table = parseXmlRows(entries);
  return mapRawTableToSpeakers(table);
}
