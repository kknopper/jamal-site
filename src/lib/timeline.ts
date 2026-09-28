import type { CollectionEntry } from 'astro:content';

// One project as Astro loads it from src/content/projects/*.md
type Entry = CollectionEntry<'projects'>;
// 'Short film' | 'YouTube' | 'Shorts', taken from the content schema
export type ProjectType = Entry['data']['type'];

// The three timeline rows, top to bottom. A project's `type` picks its row.
export const TRACKS = [
  { id: 'V1', type: 'Short film', color: 'var(--c-short)' }, // row 0: green
  { id: 'V2', type: 'YouTube', color: 'var(--c-youtube)' }, // row 1: blue
  { id: 'V3', type: 'Shorts', color: 'var(--c-shorts)' }, // row 2: pale orange
] as const satisfies readonly { id: string; type: ProjectType; color: string }[];

// Everything the page needs about one project, ready to render.
export interface TimelineProject {
  index: number; // position in play order (drives ‹ ›, arrow keys and "08 / 10")
  slug: string; // file name without .md, e.g. "slowkitchen_1920s"
  title: string;
  client: string;
  type: ProjectType;
  len: string; // display duration, e.g. "24:15"
  /** "2026" or "2024–25", from startDate/endDate */
  year: string;
  role: string;
  note: string;
  preview: string | null; // muted loop in /public, or null for the striped placeholder
  poster: string | null; // still frame shown before the preview loads
  full: string | null; // YouTube/Vimeo/.mp4 link for "Watch full"
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

/** 2026 · 2024–25 · 2019–2023 (short form only within the same century) */
export function yearLabel(start: Date, end: Date): string {
  const a = start.getUTCFullYear(); // e.g. 2024
  const b = end.getUTCFullYear(); // e.g. 2025
  if (a === b) return String(a); // one year: "2026"
  const sameCentury = Math.floor(a / 100) === Math.floor(b / 100); // 20xx and 20xx?
  return `${a}–${sameCentury ? String(b).slice(-2) : b}`; // "2024–25" ("1999–2001" across centuries)
}

/**
 * Lays projects out on a ruler that runs from 1 January of the earliest start
 * year to 1 January after the latest end year. Projects are ordered by track,
 * then start date; that order drives the ‹ › buttons and the "08 / 10" counter.
 */
export function buildTimeline(entries: Entry[]): Timeline {
  // No projects yet: return an empty timeline instead of dividing by zero below.
  if (entries.length === 0) return { projects: [], years: [], defaultIndex: 0 };

  // Earliest start year and latest end year across all projects (e.g. 2022 and 2026).
  const firstYear = Math.min(...entries.map((e) => e.data.startDate.getUTCFullYear()));
  const lastYear = Math.max(...entries.map((e) => e.data.endDate.getUTCFullYear()));

  // Where the ruler starts: 1 Jan of the first year, in milliseconds since 1970.
  // (Months are 0-based in JavaScript: 0 = January. UTC avoids time-zone shifts.)
  const t0 = Date.UTC(firstYear, 0, 1);
  // How long the ruler is: up to 1 Jan of the year AFTER the last one, so that year fits.
  const span = Date.UTC(lastYear + 1, 0, 1) - t0;
  // Any date → how far along the ruler it is, from 0 (start) to 1 (end).
  const frac = (d: Date) => (d.getTime() - t0) / span;
  // A project type → its row number (the index of the matching entry in TRACKS).
  const trackOf = (type: ProjectType) => TRACKS.findIndex((t) => t.type === type);

  // Play order: all of V1 first, then V2, then V3; within a row, oldest first.
  // (If the rows are equal the first subtraction is 0, so `||` falls through to the dates.)
  const sorted = [...entries].sort(
    (a, b) =>
      trackOf(a.data.type) - trackOf(b.data.type) ||
      a.data.startDate.getTime() - b.data.startDate.getTime(),
  );

  // Turn each Markdown entry into a ready-to-render project.
  const projects = sorted.map((e, index): TimelineProject => {
    // Left edge: how far along the ruler the project starts.
    const start = frac(e.data.startDate);
    // Length: end minus start. Very short jobs get at least 6% so they're still clickable and readable.
    const width = Math.max(frac(e.data.endDate) - start, 0.06);
    return {
      index,
      slug: e.id, // Astro uses the file name as the id
      title: e.data.title,
      client: e.data.client,
      type: e.data.type,
      len: e.data.len,
      year: yearLabel(e.data.startDate, e.data.endDate),
      role: e.data.role,
      note: e.data.note,
      preview: e.data.preview ?? null, // `??` = use null when the field is missing
      poster: e.data.poster ?? null,
      full: e.data.full ?? null,
      // An explicit `aspect:` in the file wins; otherwise Shorts are vertical.
      aspect: e.data.aspect ?? (e.data.type === 'Shorts' ? '9:16' : '16:9'),
      track: trackOf(e.data.type),
      start: round(start),
      width: round(width),
    };
  });

  // One ruler label per year, placed where 1 January of that year falls.
  // e.g. 2022 → 0, 2023 → 0.2, 2024 → 0.4 … (a 5-year ruler)
  const years = Array.from({ length: lastYear - firstYear + 1 }, (_, i) => ({
    label: String(firstYear + i),
    pos: round(frac(new Date(Date.UTC(firstYear + i, 0, 1)))),
  }));

  // Start on the project marked `featured: true`, or the first one if none is.
  const featured = sorted.findIndex((e) => e.data.featured);
  return { projects, years, defaultIndex: featured === -1 ? 0 : featured };
}
