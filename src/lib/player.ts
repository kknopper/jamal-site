import type { VideoSource } from './video';

/**
 * A running full-length player the page can read the time from and seek.
 * Times are in seconds; `time()` is smoothed between the player's own
 * (a few times a second) updates so a playhead can move every frame.
 */
export interface PlaybackClock {
  time(): number | null;
  duration(): number | null;
  /** `final` = false while dragging (cheap seek), true on release. */
  seek(seconds: number, final: boolean): void;
  destroy(): void;
}

/** Fired on document when a player starts; `detail` is its container. */
export const PLAYER_START = 'player:start';

// Minimal slice of the YouTube IFrame API that we use.
interface YTPlayer {
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
}
type LiteYT = HTMLElement & { activate(): Promise<void>; getYTPlayer(): Promise<YTPlayer> };
const YT_PLAYING = 1;

let liteYT: Promise<unknown> | undefined;

/** Fetch the lite-youtube module ahead of a click so autoplay keeps the user gesture. */
export const preloadPlayer = () => (liteYT ??= import('lite-youtube-embed'));

/**
 * Smooths a clock that only reports a few times a second: between reports it
 * advances with wall time while playing, and never runs ahead of the next report by much.
 */
function smoother() {
  let base = 0;
  let at = 0;
  let playing = false;
  return {
    report(seconds: number, isPlaying: boolean) {
      if (seconds !== base || isPlaying !== playing) {
        base = seconds;
        at = performance.now();
        playing = isPlaying;
      }
    },
    now() {
      return playing ? base + Math.min((performance.now() - at) / 1000, 1) : base;
    },
  };
}

function youtubeClock(yt: YTPlayer): PlaybackClock {
  const s = smoother();
  let lastSeek = 0;
  return {
    time() {
      s.report(yt.getCurrentTime(), yt.getPlayerState() === YT_PLAYING);
      return s.now();
    },
    duration: () => yt.getDuration() || null,
    seek(seconds, final) {
      // Throttle seeks while dragging; YouTube has to buffer after each one.
      const now = performance.now();
      if (!final && now - lastSeek < 200) return;
      lastSeek = now;
      yt.seekTo(seconds, final);
      s.report(seconds, false);
    },
    destroy() {},
  };
}

async function vimeoClock(iframe: HTMLIFrameElement): Promise<PlaybackClock> {
  const { default: Player } = await import('@vimeo/player');
  const player = new Player(iframe);
  const s = smoother();
  let dur: number | null = null;
  let playing = true;
  let lastSeek = 0;
  player.on('timeupdate', (d: { seconds: number; duration: number }) => {
    dur = d.duration;
    s.report(d.seconds, playing);
  });
  player.on('play', () => (playing = true));
  player.on('pause', (d: { seconds: number }) => {
    playing = false;
    s.report(d.seconds, false);
  });
  player.getDuration().then((d) => (dur = d)).catch(() => {});
  return {
    time: () => s.now(),
    duration: () => dur,
    seek(seconds, final) {
      const now = performance.now();
      if (!final && now - lastSeek < 200) return;
      lastSeek = now;
      s.report(seconds, false);
      player.setCurrentTime(seconds).catch(() => {});
    },
    destroy: () => void player.destroy().catch(() => {}),
  };
}

function fileClock(video: HTMLVideoElement): PlaybackClock {
  return {
    time: () => video.currentTime,
    duration: () => (Number.isFinite(video.duration) ? video.duration : null),
    seek(seconds, final) {
      if (final || !('fastSeek' in video)) video.currentTime = seconds;
      else video.fastSeek(seconds);
    },
    destroy() {},
  };
}

async function createPlayer(src: VideoSource, title: string): Promise<HTMLElement> {
  switch (src.kind) {
    case 'youtube': {
      await preloadPlayer();
      const el = document.createElement('lite-youtube');
      el.setAttribute('videoid', src.id);
      el.setAttribute('playlabel', `Play ${title}`);
      // Use the IFrame API everywhere so the page can read the time and seek.
      el.setAttribute('js-api', '');
      const params = new URLSearchParams({ rel: '0' });
      if (src.start) params.set('start', String(src.start));
      el.setAttribute('params', params.toString());
      return el;
    }
    case 'vimeo': {
      const iframe = document.createElement('iframe');
      const params = new URLSearchParams({ autoplay: '1', dnt: '1', title: '0', byline: '0', portrait: '0' });
      if (src.hash) params.set('h', src.hash);
      iframe.src = `https://player.vimeo.com/video/${src.id}?${params}`;
      iframe.allow = 'autoplay; fullscreen; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.title = title;
      return iframe;
    }
    case 'file': {
      const video = document.createElement('video');
      video.src = src.src;
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      return video;
    }
  }
}

const mounts = new WeakMap<HTMLElement, symbol>();
const clocks = new WeakMap<HTMLElement, PlaybackClock>();

/**
 * Replace the contents of `container` with a playing player for `src`.
 * Resolves with a clock for it, or null if the player couldn't be read or
 * another mount/unmount on the same container superseded this one.
 */
export async function mountPlayer(
  container: HTMLElement,
  src: VideoSource,
  title: string,
): Promise<PlaybackClock | null> {
  const token = Symbol();
  const current = () => mounts.get(container) === token;
  unmountPlayer(container);
  mounts.set(container, token);
  // Only one player with sound at a time: other players listen and stop.
  document.dispatchEvent(new CustomEvent<HTMLElement>(PLAYER_START, { detail: container }));

  const player = await createPlayer(src, title);
  if (!current()) return null;
  container.append(player);

  let clock: PlaybackClock | null = null;
  try {
    if (src.kind === 'youtube') {
      const el = player as LiteYT;
      await el.activate();
      clock = youtubeClock(await el.getYTPlayer());
    } else if (src.kind === 'vimeo') {
      clock = await vimeoClock(player as HTMLIFrameElement);
    } else {
      clock = fileClock(player as HTMLVideoElement);
    }
  } catch {
    clock = null; // playback still works; the page just can't follow it
  }
  if (!current()) {
    clock?.destroy();
    return null;
  }
  if (clock) clocks.set(container, clock);
  return clock;
}

/** Remove the player (stops audio). */
export function unmountPlayer(container: HTMLElement) {
  mounts.set(container, Symbol());
  clocks.get(container)?.destroy();
  clocks.delete(container);
  container.replaceChildren();
}
