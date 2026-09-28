# Jamal Amer — portfolio

Astro 7, fully static. The only client JS is the work timeline (~2 KB, inlined)
and the video dialog; lite-youtube-embed loads only when a video link is hovered or clicked.

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # → dist/
npm run check    # type-check .astro + .ts
```

## Where things live

| What | File |
|---|---|
| Name, email, nav, socials, showreel | `src/site.ts` |
| Projects (one per file) | `src/content/projects/*.md` |
| Project schema | `src/content.config.ts` |
| Timeline layout math | `src/lib/timeline.ts` |
| Video URL parsing (YouTube / Vimeo / .mp4) | `src/lib/video.ts` |
| Design tokens | `src/styles/global.css` |

## Adding a project

Create `src/content/projects/<program_name>.md`. The file name shows as `PROGRAM:` in the viewer.

```yaml
---
title: "Paper Kites"
client: "Dir. Omar Reyes"
type: Short film            # Short film → V1, YouTube → V2, Shorts → V3
len: "18:05"
role: "Editor"
note: "Drama shot on 16mm. Assembly to picture lock over eight weeks."
startDate: 2024-08-15       # clip position/width on the timeline come from these
endDate: 2025-07-15
preview: /previews/paper_kites.mp4   # muted 16:9 loop in public/ (optional)
poster: /posters/paper_kites.jpg     # optional
full: https://vimeo.com/123456789/abcdef   # YouTube, Vimeo (unlisted hash ok) or .mp4
featured: true              # selected on page load — mark exactly one
aspect: "9:16"              # optional; Shorts are 9:16 by default, everything else 16:9
---
```

Each project can be linked directly as `jamalamer.com/#<file name>` with underscores as hyphens,
e.g. `slowkitchen_1920s.md` → `/#slowkitchen-1920s` (the underscore form works too).
The address follows the selection, and the link button next to ‹ › copies it (or opens the share sheet on phones).
Renaming a project file changes its link.

Projects are ordered by track, then start date. That order drives ‹ ›, arrow keys and the `08 / 10` counter.

## Video

- **Muted loops** (hero and previews): native `<video>`. Aim for 6–15 s, 720p, no audio track, 1–3 MB each.
  Put them in `public/`, then set `site.reel.loop` / `poster` and each project's `preview` / `poster`.
- **Full videos with sound**: any `<a data-video href="…">` opens the shared dialog.
  YouTube uses lite-youtube-embed, Vimeo uses a plain iframe (with `dnt=1`), `.mp4`/`.webm` use a native player.
  Cmd/ctrl-click, or an unrecognised URL, just follows the link.

## Demo footage

Until Jamal's clips arrive, the site uses the Blender Foundation open movies (Big Buck Bunny,
Elephants Dream, Sintel, Tears of Steel), all CC BY, which requires the credit line in the footer:

- `public/media/showreel-loop.mp4` + `showreel-poster.jpg`: 17 s of Big Buck Bunny, 720p, no audio
- `public/previews/*.mp4` + `public/posters/*.jpg`: one 8 s, 640×360 loop per project
- `full` links go to the official uploads on YouTube (and Big Buck Bunny on Vimeo, for the Vimeo player)

Every demo entry is marked `# DEMO` / `// DEMO`. Encoding used, if you want to match it for real clips:

```sh
ffmpeg -ss <start> -i source.mp4 -t 8 -an \
  -vf "scale=640:360:force_original_aspect_ratio=increase,crop=640:360" \
  -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -movflags +faststart previews/<id>.mp4
```

## TODO before launch

- Replace the demo footage and `full` links, then clear `site.credits` in `src/site.ts`
- Add real social links in `src/site.ts`
- There's no About section in the design, but the nav links to `#about`
