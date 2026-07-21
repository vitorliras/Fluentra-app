import { Injectable, NgZone, inject } from '@angular/core';

interface YouTubePlayer {
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  playVideo(): void;
  pauseVideo(): void;
  destroy(): void;
}

interface YouTubePlayerOptions {
  videoId: string;
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
  private clipEndTimer: ReturnType<typeof setTimeout> | null = null;

  async createPlayer(host: HTMLElement, youTubeVideoId: string): Promise<void> {
    await loadYouTubeApi();

    this.player?.destroy();
    this.player = null;
    host.innerHTML = '';
    const mount = document.createElement('div');
    host.appendChild(mount);

    await new Promise<void>((resolve, reject) => {
      this.player = new window.YT!.Player(mount, {
        videoId: youTubeVideoId,
        playerVars: { controls: 0, disablekb: 1, modestbranding: 1 },
        events: {
          onReady: () => this.zone.run(() => resolve()),
          onError: () => this.zone.run(() => reject(new Error('YouTubePlayerError'))),
        },
      });
    });
  }

  playClip(startSeconds: number, endSeconds: number, onEnded: () => void): void {
    if (!this.player) {
      return;
    }

    this.clearClipEndTimer();
    this.player.seekTo(startSeconds, true);
    this.player.playVideo();

    const durationMs = Math.max(0, (endSeconds - startSeconds) * 1000);
    this.clipEndTimer = setTimeout(() => {
      this.player?.pauseVideo();
      this.zone.run(() => onEnded());
    }, durationMs);
  }

  destroy(): void {
    this.clearClipEndTimer();
    this.player?.destroy();
    this.player = null;
  }

  private clearClipEndTimer(): void {
    if (this.clipEndTimer) {
      clearTimeout(this.clipEndTimer);
      this.clipEndTimer = null;
    }
  }
}
