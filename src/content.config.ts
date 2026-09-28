import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * One Markdown file per project in src/content/projects/.
 * The file name becomes the project's id, shown as "PROGRAM: <id>" in the viewer.
 * Track (V1/V2/V3) comes from `type`; clip position and length on the timeline
 * are computed from `startDate`/`endDate` in src/lib/timeline.ts.
 */
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z
    .object({
      title: z.string(),
      client: z.string(),
      type: z.enum(['Short film', 'YouTube', 'Shorts']),
      /** Display duration, e.g. "24:15" or "12 × 0:59". */
      len: z.string(),
      role: z.string(),
      note: z.string(),
      startDate: z.coerce.date(),
      endDate: z.coerce.date(),
      /** Muted 16:9 preview loop in /public, e.g. "/previews/northbound.mp4". */
      preview: z.string().optional(),
      /** Poster frame in /public, e.g. "/posters/northbound.jpg". */
      poster: z.string().optional(),
      /** Full video: YouTube or Vimeo URL, or a self-hosted .mp4. */
      full: z.string().optional(),
      /**
       * Frame shape. Defaults to 9:16 for Shorts and 16:9 for everything else;
       * set it to override (e.g. a vertical short film).
       */
      aspect: z.enum(['16:9', '9:16']).optional(),
      /** Selected when the page loads. Mark exactly one project. */
      featured: z.boolean().default(false),
    })
    .refine((p) => p.endDate >= p.startDate, {
      message: 'endDate must be on or after startDate',
      path: ['endDate'],
    }),
});

export const collections = { projects };
