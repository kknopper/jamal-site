export type VideoSource =
  | { kind: 'youtube'; id: string; start?: number }
  | { kind: 'vimeo'; id: string; hash?: string }
  | { kind: 'file'; src: string };

/** "90", "90s", "1m30s", "1h2m3s" → seconds */
function parseTime(t: string | null): number | undefined {
  if (!t) return undefined;
  if (/^\d+s?$/.test(t)) return parseInt(t, 10);
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(t);
  if (!m) return undefined;
  const secs = +(m[1] ?? 0) * 3600 + +(m[2] ?? 0) * 60 + +(m[3] ?? 0);
  return secs || undefined;
}

/** Works out how to play a "Watch full" URL. Returns null for anything else, so the link just opens normally. */
export function parseVideoUrl(raw: string, base = 'https://jamalamer.com/'): VideoSource | null {
  let url: URL;
  try {
    url = new URL(raw, base);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m)\./, '');
  const parts = url.pathname.split('/').filter(Boolean);

  if (host === 'youtu.be' && parts[0]) {
    return { kind: 'youtube', id: parts[0], start: parseTime(url.searchParams.get('t')) };
  }
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const id =
      url.searchParams.get('v') ??
      (['embed', 'shorts', 'live', 'v'].includes(parts[0] ?? '') ? parts[1] : undefined);
    if (id) {
      return {
        kind: 'youtube',
        id,
        start: parseTime(url.searchParams.get('t') ?? url.searchParams.get('start')),
      };
    }
  }
  if (host === 'vimeo.com' && parts[0] && /^\d+$/.test(parts[0])) {
    return { kind: 'vimeo', id: parts[0], hash: parts[1] ?? url.searchParams.get('h') ?? undefined };
  }
  if (host === 'player.vimeo.com' && parts[0] === 'video' && parts[1]) {
    return { kind: 'vimeo', id: parts[1], hash: url.searchParams.get('h') ?? undefined };
  }
  if (/\.(mp4|webm|m4v|mov)$/i.test(url.pathname)) {
    return { kind: 'file', src: url.href };
  }
  return null;
}
