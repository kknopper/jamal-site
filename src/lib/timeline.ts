import type { CollectionEntry } from 'astro:content';
import { parseVideoUrl } from './video';

// One project as Astro loads it from src/content/projects/*.md
type Entry = CollectionEntry<'projects'>;
// 'YouTube' | 'Shorts', taken from the content schema
export type ProjectType = Entry['data']['type'];

// The timeline rows, top to bottom. A project's `type` picks its row.
export const TRACKS = [
  { id: 'V1', type: 'YouTube', color: 'var(--c-youtube)' }, // row 0: blue
  { id: 'V2', type: 'Shorts', color: 'var(--c-shorts)' }, // row 1: pale orange
] as const satisfies readonly { id: string; type: ProjectType; color: string }[];

// Everything the page needs about one project, ready to render.
export interface TimelineProject {
  index: number; // position in play order (drives ‹ ›, arrow keys and "08 / 10")
  slug: string; // file name without .md, e.g. "slowkitchen_1920s"
  title: string;
  client: string;
  type: ProjectType;
  len: string; // display duration, e.g. "13:14"
  year: string; // e.g. "2026"
  role: string;
  note: string;
  preview: string | null; // muted loop in /public, or null for the striped placeholder
  poster: string | null; // still frame shown before the preview loads
  full: string | null; // YouTube/Vimeo/.mp4 link for "Watch full"
  /** The muted loop played from YouTube: video id and start/end in seconds. */
  yt: { id: string; start: number; end: number } | null;
  playlist: string | null; // client's YouTube playlist for the link button
  /** Program monitor frame: vertical for Shorts unless overridden. */
  aspect: '16:9' | '9:16';
  track: number; // row index into TRACKS (0 = V1, 1 = V2, 2 = V3)
  /** Left edge as a fraction (0–1) of the lane. */
  start: number;
  /** Width as a fraction (0–1) of the lane. */
  width: number;
}

// What buildTimeline hands to WorkTimeline.astro.
export interface Timeline {
  projects: TimelineProject[];
  years: { label: string; pos: number }[]; // ruler labels: "2024" at 0.4, etc.
  defaultIndex: number; // which project is selected when the page loads
}

// Trim to 4 decimal places so the HTML stays short (0.8171 instead of 0.817118...).
const round = (n: number) => Math.round(n * 10_000) / 10_000;

/** "1:05" → 65 · "1:02:03" → 3723 */
function seconds(clock: string): number {
  return clock.split(':').reduce((total, part) => total * 60 + Number(part), 0);
}

/** "00:16-00:26" → { start: 16, end: 26 } */
export function parseTimecodeRange(range: string): { start: number; end: number } {
  const [a = '', b = ''] = range.split('-').map((t) => t.trim());
  return { start: seconds(a), end: seconds(b) };
}

/**
 * Lays projects out on the ruler by year. Each year that has projects gets a
 * stretch of the ruler as wide as its busiest track needs (years with nothing
 * in them are skipped), and the projects of a track in that year share it
 * equally, in `order`. Rows run V1 then V2; that order, oldest first within a
 * row, drives the ‹ › buttons and the "08 / 10" counter.
 */
export function buildTimeline(entries: Entry[]): Timeline {
  // No projects yet: return an empty timeline instead of dividing by zero below.
  if (entries.length === 0) return { projects: [], years: [], defaultIndex: 0 };

  // A project type → its row number (the index of the matching entry in TRACKS).
  const trackOf = (type: ProjectType) => TRACKS.findIndex((t) => t.type === type);
  const countIn = (year: number, track: number) =>
    entries.filter((e) => e.data.year === year && trackOf(e.data.type) === track).length;

  // Years that have work, oldest first, and how much ruler each one gets.
  const yearList = [...new Set(entries.map((e) => e.data.year))].sort((a, b) => a - b);
  const weights = yearList.map((y) => Math.max(1, ...TRACKS.map((_, ti) => countIn(y, ti))));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  // Each year's [start, width] as fractions (0–1) of the ruler.
  const segments = new Map<number, { start: number; width: number }>();
  let used = 0;
  yearList.forEach((y, i) => {
    segments.set(y, { start: used / totalWeight, width: weights[i]! / totalWeight });
    used += weights[i]!;
  });

  // Play order: all of V1 first, then V2; within a row, oldest year first, then `order`.
  const sorted = [...entries].sort(
    (a, b) =>
      trackOf(a.data.type) - trackOf(b.data.type) ||
      a.data.year - b.data.year ||
      a.data.order - b.data.order ||
      a.id.localeCompare(b.id),
  );

  // Small gap between neighbouring clips so they don't run together.
  const GAP = 0.004;

  const projects = sorted.map((e, index): TimelineProject => {
    const seg = segments.get(e.data.year)!;
    const n = countIn(e.data.year, trackOf(e.data.type));
    // Position among the clips of this track and year (they're already sorted).
    const slot = sorted
      .slice(0, index)
      .filter((o) => o.data.year === e.data.year && o.data.type === e.data.type).length;
    const slotWidth = seg.width / n;
    const source = e.data.full ? parseVideoUrl(e.data.full) : null;
    let yt: TimelineProject['yt'] = null;
    if (e.data.previewTimecode && source?.kind === 'youtube') {
      const { start, end } = parseTimecodeRange(e.data.previewTimecode);
      if (!(end > start)) throw new Error(`${e.id}: previewTimecode must end after it starts`);
      yt = { id: source.id, start, end };
    }
    return {
      index,
      slug: e.id, // Astro uses the file name as the id
      title: e.data.title,
      // Non-breaking spaces keep a channel name on one line wherever it's shown.
      client: e.data.client.replace(/ /g, '\u00a0'),
      type: e.data.type,
      len: e.data.len,
      year: String(e.data.year),
      role: e.data.role,
      note: e.data.note,
      preview: e.data.preview ?? null, // `??` = use null when the field is missing
      // A self-hosted poster wins; otherwise the YouTube thumbnail.
      poster: e.data.poster ?? (yt ? `https://i.ytimg.com/vi/${yt.id}/hqdefault.jpg` : null),
      full: e.data.full ?? null,
      yt,
      playlist: e.data.playlist ?? null,
      // An explicit `aspect:` in the file wins; otherwise Shorts are vertical.
      aspect: e.data.aspect ?? (e.data.type === 'Shorts' ? '9:16' : '16:9'),
      track: trackOf(e.data.type),
      start: round(seg.start + slotWidth * slot),
      width: round(slotWidth - GAP),
    };
  });

  // One ruler label per year, at the left edge of that year's stretch.
  const years = yearList.map((y) => ({ label: String(y), pos: round(segments.get(y)!.start) }));

  // Start on the project marked `featured: true`, or the first one if none is.
  const featured = sorted.findIndex((e) => e.data.featured);
  return { projects, years, defaultIndex: featured === -1 ? 0 : featured };
}
