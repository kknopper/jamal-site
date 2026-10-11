/**
 * A muted, looping preview that plays a few seconds of a YouTube video, using
 * the YouTube IFrame API. The player is only created the first time it is
 * asked to play, so the page loads nothing from YouTube until the viewer
 * is on screen.
 */
export interface YtClip {
  id: string;
  /** Seconds into the video where the loop starts and ends. */
  start: number;
  end: number;
}

export interface YtPreview {
  setClip(clip: YtClip): void;
  play(): void;
  pause(): void;
  /** Jump to `seconds` after the start of the clip. */
  seek(seconds: number): void;
  /** Length of the loop in seconds. */
  readonly length: number;
}

// Minimal slice of the YouTube IFrame API that we use.
interface YTPlayer {
  loadVideoById(o: { videoId: string; startSeconds: number }): void;
  cueVideoById(o: { videoId: string; startSeconds: number }): void;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  mute(): void;
}
interface YTNamespace {
  Player: new (el: HTMLElement, opts: object) => YTPlayer;
}
declare global {
  interface Window {
    YT?: YTNamespace;
  }
}

let apiPromise: Promise<YTNamespace> | undefined;

/** Loads https://www.youtube.com/iframe_api once and resolves when `YT.Player` exists. */
function loadApi(): Promise<YTNamespace> {
  return (apiPromise ??= new Promise((resolve, reject) => {
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.onerror = () => reject(new Error('YouTube API failed to load'));
      document.head.append(script);
    }
    // Poll instead of using onYouTubeIframeAPIReady: lite-youtube also sets that callback.
    const started = performance.now();
    const check = () => {
      if (window.YT?.Player) resolve(window.YT);
      else if (performance.now() - started > 15_000) reject(new Error('YouTube API timed out'));
      else setTimeout(check, 50);
    };
    check();
  }));
}

/**
 * `host` is an empty element the player is built inside.
 * `onTime` is called every frame while playing, with seconds since the clip start.
 */
export function createYtPreview(host: HTMLElement, onTime: (seconds: number) => void): YtPreview {
  let clip: YtClip | null = null;
  let player: YTPlayer | null = null;
  let creating = false;
  let wantPlay = false;
  let frame = 0;

  const length = () => (clip ? clip.end - clip.start : 0);

  const tick = () => {
    if (!player || !clip || !wantPlay) return;
    const t = player.getCurrentTime();
    // Past the end (or before the start, after a seek elsewhere): back to the start of the loop.
    if (t >= clip.end - 0.05 || t < clip.start - 1) {
      player.seekTo(clip.start, true);
      onTime(0);
    } else {
      onTime(Math.max(0, t - clip.start));
    }
    frame = requestAnimationFrame(tick);
  };

  const start = () => {
    cancelAnimationFrame(frame);
    if (!player || !clip) return;
    wantPlay = true;
    player.playVideo();
    frame = requestAnimationFrame(tick);
  };

  const load = () => {
    if (!player || !clip) return;
    const args = { videoId: clip.id, startSeconds: clip.start };
    if (wantPlay) {
      player.loadVideoById(args);
      start();
    } else {
      player.cueVideoById(args);
    }
  };

  const create = async () => {
    if (creating || player) return;
    creating = true;
    try {
      const YT = await loadApi();
      const mount = document.createElement('div');
      host.append(mount);
      new YT.Player(mount, {
        videoId: clip?.id,
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          start: clip?.start ?? 0,
        },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            player = e.target;
            player.mute();
            load();
          },
        },
      });
    } catch {
      creating = false; // The poster stays visible; try again next time it's asked to play.
    }
  };

  return {
    setClip(next) {
      clip = next;
      host.style.backgroundImage = `url(https://i.ytimg.com/vi/${next.id}/hqdefault.jpg)`;
      load();
    },
    play() {
      wantPlay = true;
      if (player) start();
      else void create();
    },
    pause() {
      wantPlay = false;
      cancelAnimationFrame(frame);
      player?.pauseVideo();
    },
    seek(seconds) {
      if (clip) player?.seekTo(clip.start + seconds, true);
    },
    get length() {
      return length();
    },
  };
}
