import { Injectable, NgZone, inject } from '@angular/core';

interface YouTubePlayer {
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  playVideo(): void;
  pauseVideo(): void;
  setPlaybackRate(rate: number): void;
  getCurrentTime(): number;
  getIframe(): HTMLIFrameElement;
  destroy(): void;
}

interface YouTubePlayerOptions {
  videoId: string;
  width: string;
  height: string;
  playerVars: Record<string, number>;
  events: {
    onReady: () => void;
    onError: (event: { data: number }) => void;
  };
}

interface YouTubeNamespace {
  Player: new (element: HTMLElement, options: YouTubePlayerOptions) => YouTubePlayer;
}

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const API_SCRIPT_URL = 'https://www.youtube.com/iframe_api';
const POLL_INTERVAL_MS = 100;

let apiLoadPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) {
    return Promise.resolve();
  }

  if (!apiLoadPromise) {
    apiLoadPromise = new Promise((resolve) => {
      window.onYouTubeIframeAPIReady = () => resolve();
      const script = document.createElement('script');
      script.src = API_SCRIPT_URL;
      document.head.appendChild(script);
    });
  }

  return apiLoadPromise;
}

@Injectable({ providedIn: 'root' })
export class YoutubePlayerService {
  private readonly zone = inject(NgZone);
  private player: YouTubePlayer | null = null;
  private pollHandle: ReturnType<typeof setInterval> | null = null;
  private clipEndSeconds: number | null = null;
  private onTick: ((currentSeconds: number) => void) | null = null;
  private onClipEnded: (() => void) | null = null;
  private playbackRate = 1;

  async createPlayer(host: HTMLElement, youTubeVideoId: string): Promise<void> {
    await loadYouTubeApi();

    this.stopPolling();
    this.player?.destroy();
    this.player = null;
    host.innerHTML = '';
    const mount = document.createElement('div');
    host.appendChild(mount);

    await new Promise<void>((resolve, reject) => {
      this.player = new window.YT!.Player(mount, {
        videoId: youTubeVideoId,
        width: '100%',
        height: '100%',
        playerVars: { controls: 0, disablekb: 1, modestbranding: 1, rel: 0 },
        events: {
          onReady: () => this.zone.run(() => resolve()),
          onError: () => this.zone.run(() => reject(new Error('YouTubePlayerError'))),
        },
      });
    });

    const iframe = this.player!.getIframe();
    iframe.style.position = 'absolute';
    iframe.style.inset = '0';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = '0';
    iframe.style.outline = 'none';
    iframe.style.pointerEvents = 'none';
    iframe.setAttribute('tabindex', '-1');
  }

  playClip(startSeconds: number, endSeconds: number, onTick: (currentSeconds: number) => void, onEnded: () => void): void {
    if (!this.player) {
      return;
    }

    this.stopPolling();
    this.player.seekTo(startSeconds, true);
    this.player.playVideo();
    this.player.setPlaybackRate(this.playbackRate);

    this.clipEndSeconds = endSeconds;
    this.onTick = onTick;
    this.onClipEnded = onEnded;
    this.pollHandle = setInterval(() => this.tick(), POLL_INTERVAL_MS);
  }

  resume(): void {
    this.player?.playVideo();
    this.player?.setPlaybackRate(this.playbackRate);
    if (this.clipEndSeconds !== null && this.pollHandle === null) {
      this.pollHandle = setInterval(() => this.tick(), POLL_INTERVAL_MS);
    }
  }

  pause(): void {
    this.player?.pauseVideo();
    if (this.pollHandle !== null) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
  }

  setPlaybackRate(rate: number): void {
    this.playbackRate = rate;
    this.player?.setPlaybackRate(rate);
  }

  destroy(): void {
    this.stopPolling();
    this.player?.destroy();
    this.player = null;
  }

  private tick(): void {
    if (!this.player || this.clipEndSeconds === null) {
      return;
    }

    const current = this.player.getCurrentTime();
    this.onTick?.(current);

    if (current >= this.clipEndSeconds) {
      this.player.pauseVideo();
      const callback = this.onClipEnded;
      this.stopPolling();
      this.zone.run(() => callback?.());
    }
  }

  private stopPolling(): void {
    if (this.pollHandle !== null) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }

    this.clipEndSeconds = null;
    this.onTick = null;
    this.onClipEnded = null;
  }
}
