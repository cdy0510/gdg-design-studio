import {
  AgendaCustomItem,
  AgendaCustomKind,
  SpeakerSessionItem,
} from '@/types/studio';

export const AGENDA_CUSTOM_KIND_META: Record<
  AgendaCustomKind,
  { label: string; defaultTitle: string; emoji: string }
> = {
  registration: { label: '등록/체크인', defaultTitle: 'Registration & Check-in', emoji: '🎫' },
  break: { label: '쉬는시간', defaultTitle: 'Coffee Break', emoji: '☕' },
  lunch: { label: '점심', defaultTitle: 'Lunch', emoji: '🍱' },
  networking: { label: '네트워킹', defaultTitle: 'Networking Session', emoji: '🤝' },
  custom: { label: '직접 입력', defaultTitle: '커스텀 세션', emoji: '✏️' },
};

export type AgendaEntry =
  | { kind: 'session'; id: string; start: number; time: string; track: string; session: SpeakerSessionItem }
  | { kind: 'custom'; id: string; start: number; time: string; track: string; item: AgendaCustomItem };

/** Parses the first HH:MM in a time string into minutes; unparseable → Infinity (sorted last). */
export function parseStartMinutes(time: string): number {
  const m = /(\d{1,2})\s*:\s*(\d{2})/.exec(time || '');
  return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : Number.POSITIVE_INFINITY;
}

/** Merges speaker sessions and custom slots into one list, stable-sorted by start time. */
export function buildAgendaEntries(
  sessions: SpeakerSessionItem[],
  customItems: AgendaCustomItem[]
): AgendaEntry[] {
  const entries: AgendaEntry[] = [
    ...sessions.map((s) => ({
      kind: 'session' as const,
      id: s.id,
      start: parseStartMinutes(s.time),
      time: s.time,
      track: s.track.trim(),
      session: s,
    })),
    ...customItems.map((c) => ({
      kind: 'custom' as const,
      id: c.id,
      start: parseStartMinutes(c.time),
      time: c.time,
      track: c.track.trim(),
      item: c,
    })),
  ];
  return entries
    .map((e, i) => ({ e, i }))
    .sort((a, b) => (a.e.start === b.e.start ? a.i - b.i : a.e.start - b.e.start))
    .map(({ e }) => e);
}

/** Tracks in user order, followed by any track names used by sessions but not yet listed. */
export function resolveTrackList(
  trackOrder: string[],
  sessions: SpeakerSessionItem[]
): string[] {
  const result: string[] = [];
  const push = (t: string) => {
    const name = t.trim();
    if (name && !result.includes(name)) result.push(name);
  };
  trackOrder.forEach(push);
  sessions.forEach((s) => push(s.track));
  return result;
}

export interface AgendaTimeSlot {
  start: number;
  time: string;
  // An all-track custom item turns the whole row into a band
  band?: AgendaEntry;
  cells: Record<string, AgendaEntry[]>;
}

/** Groups entries by start time into rows for the multi-track grid. */
export function buildTrackSlots(entries: AgendaEntry[], tracks: string[]): AgendaTimeSlot[] {
  const slots: AgendaTimeSlot[] = [];
  for (const entry of entries) {
    const isBand = entry.kind === 'custom' && !tracks.includes(entry.track);
    let slot = slots.find(
      (s) => s.start === entry.start && Number.isFinite(entry.start) && !s.band && !isBand
    );
    if (!slot || isBand) {
      slot = { start: entry.start, time: entry.time, cells: {} };
      slots.push(slot);
    }
    if (isBand) {
      slot.band = entry;
    } else {
      const key = tracks.includes(entry.track) ? entry.track : tracks[0] ?? '';
      (slot.cells[key] ||= []).push(entry);
    }
  }
  return slots;
}
