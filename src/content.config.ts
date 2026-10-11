import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * One Markdown file per project in src/content/projects/.
 * The file name becomes the project's id, shown as "PROGRAM: <id>" in the viewer.
 * Track (V1/V2) comes from `type`; clip position and length on the timeline
 * come from `year` and `order` in src/lib/timeline.ts.
 */
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    client: z.string(),
    type: z.enum(['YouTube', 'Shorts']),
    /** Display duration, e.g. "13:14" or "0:26". */
    len: z.string(),
    role: z.string(),
    /** Optional one-liner under the title. Hidden when empty. */
    note: z.string().default(''),
    /** Year published. Clips are grouped by year along the timeline ruler. */
    year: z.number().int(),
    /** Left-to-right order among clips on the same track and year. */
    order: z.number().default(0),
    /** Full video: YouTube or Vimeo URL, or a self-hosted .mp4. */
    full: z.string().optional(),
    /**
     * The ~10 s that loops, muted, in the viewer: "00:16-00:26" (mm:ss or h:mm:ss).
     * Played straight from the YouTube link in `full`.
     */
    previewTimecode: z
      .string()
      .regex(/^\d{1,2}(:\d{2}){1,2}\s*-\s*\d{1,2}(:\d{2}){1,2}$/, 'Use "mm:ss-mm:ss", e.g. "00:16-00:26"')
      .optional(),
    /** Link-button target: the client's YouTube playlist. Button is hidden when empty. */
    playlist: z.url().optional(),
    /** Self-hosted muted 16:9 loop in /public. Used instead of `previewTimecode` when set. */
    preview: z.string().optional(),
    /** Poster frame in /public. Defaults to the YouTube thumbnail. */
    poster: z.string().optional(),
    /**
     * Frame shape. Defaults to 9:16 for Shorts and 16:9 for everything else;
     * set it to override.
     */
    aspect: z.enum(['16:9', '9:16']).optional(),
    /** Selected when the page loads. Mark exactly one project. */
    featured: z.boolean().default(false),
  }),
});

export const collections = { projects };
