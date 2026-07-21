import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { LanguageSelectorComponent } from '../../../core/components/language-selector/language-selector.component';
import { ProfileMenuComponent } from '../../../core/components/profile-menu/profile-menu.component';
import { ThemeToggleComponent } from '../../../core/components/theme-toggle/theme-toggle.component';
import { LanguageService } from '../../../core/services/language.service';
import { ShellLayoutService } from '../../../core/services/shell-layout.service';
import { VideoSearchResult } from '../data-access/models/video-search-result.model';
import { Scene } from '../data-access/models/video-import.model';
import { PronunciationEvaluation } from '../data-access/models/pronunciation-evaluation.model';
import { ShadowingGateway } from '../data-access/shadowing.gateway';
import { HistoryDropdownComponent } from '../components/history-dropdown/history-dropdown.component';
import { VideoSearchBarComponent } from '../components/video-search-bar/video-search-bar.component';
import { YoutubePlayerService } from '../services/youtube-player.service';
import { AudioRecorderService } from '../services/audio-recorder.service';

type SessionPhase =
  | 'idle'
  | 'importing'
  | 'comprehension'
  | 'playing'
  | 'recording'
  | 'evaluating'
  | 'feedback'
  | 'completed';

const COMPREHENSION_SECONDS = 5;
const FEEDBACK_DISPLAY_MS = 2500;
const MIN_RECORDING_MS = 3000;
const RECORDING_MS_PER_WORD = 600;
const MAX_RECORDING_MS = 15000;

@Component({
  selector: 'app-shadowing-session-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    VideoSearchBarComponent,
    ThemeToggleComponent,
    LanguageSelectorComponent,
    HistoryDropdownComponent,
    ProfileMenuComponent,
  ],
  templateUrl: './shadowing-session.page.html',
  styleUrl: './shadowing-session.page.scss',
})
export class ShadowingSessionPage {
  protected readonly languageService = inject(LanguageService);
  protected readonly shellLayout = inject(ShellLayoutService);
  private readonly gateway = inject(ShadowingGateway);
  private readonly youtubePlayer = inject(YoutubePlayerService);
  private readonly audioRecorder = inject(AudioRecorderService);

  @ViewChild('videoFrameHost') private videoFrameHost!: ElementRef<HTMLDivElement>;

  protected readonly selectedVideo = signal<VideoSearchResult | null>(null);
  protected readonly scenes = signal<Scene[]>([]);
  protected readonly currentSceneIndex = signal(0);
  protected readonly phase = signal<SessionPhase>('idle');
  protected readonly comprehensionSecondsLeft = signal(COMPREHENSION_SECONDS);
  protected readonly lastEvaluation = signal<PronunciationEvaluation | null>(null);
  protected readonly completedSceneIds = signal<Set<number>>(new Set());
  protected readonly errorKey = signal<string | null>(null);

  private readonly seenSceneIds = new Set<number>();

  protected readonly currentScene = computed<Scene | null>(() => this.scenes()[this.currentSceneIndex()] ?? null);

  protected readonly comprehensionPercent = computed(
    () => (this.comprehensionSecondsLeft() / COMPREHENSION_SECONDS) * 100,
  );

  protected async onVideoSelected(video: VideoSearchResult): Promise<void> {
    this.selectedVideo.set(video);
    this.phase.set('importing');
    this.errorKey.set(null);
    this.scenes.set([]);
    this.completedSceneIds.set(new Set());
    this.seenSceneIds.clear();

    this.gateway.importVideo({ youTubeVideoId: video.youTubeVideoId }).subscribe(async (result) => {
      if (!result.isSuccess || !result.value) {
        this.phase.set('idle');
        this.errorKey.set(this.importErrorKeyFor(result.error?.code));
        return;
      }

      this.scenes.set(result.value.scenes);
      this.currentSceneIndex.set(0);

      try {
        await this.youtubePlayer.createPlayer(this.videoFrameHost.nativeElement, video.youTubeVideoId);
      } catch {
        this.phase.set('idle');
        this.errorKey.set('shadowing.session.errors.playbackFailed');
        return;
      }

      this.beginScene();
    });
  }

  private beginScene(): void {
    const scene = this.currentScene();
    if (!scene) {
      this.phase.set('completed');
      return;
    }

    this.lastEvaluation.set(null);
    const firstExposure = !this.seenSceneIds.has(scene.id);
    this.seenSceneIds.add(scene.id);

    if (firstExposure) {
      this.phase.set('comprehension');
      this.youtubePlayer.playClip(scene.startSeconds, scene.endSeconds, () => this.runComprehensionCountdown());
      return;
    }

    this.beginRepetitionRound(scene);
  }

  private runComprehensionCountdown(): void {
    this.comprehensionSecondsLeft.set(COMPREHENSION_SECONDS);

    const interval = setInterval(() => {
      const remaining = this.comprehensionSecondsLeft() - 1;
      this.comprehensionSecondsLeft.set(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        const scene = this.currentScene();
        if (scene) {
          this.beginRepetitionRound(scene);
        }
      }
    }, 1000);
  }

  private beginRepetitionRound(scene: Scene): void {
    this.phase.set('playing');
    this.youtubePlayer.playClip(scene.startSeconds, scene.endSeconds, () => this.startRecording());
  }

  private async startRecording(): Promise<void> {
    const scene = this.currentScene();
    if (!scene) {
      return;
    }

    this.phase.set('recording');
    const wordCount = scene.text.split(' ').filter(Boolean).length;
    const maxDurationMs = Math.min(MAX_RECORDING_MS, MIN_RECORDING_MS + wordCount * RECORDING_MS_PER_WORD);

    try {
      await this.audioRecorder.start(maxDurationMs, (audio) => this.onRecordingStopped(audio));
    } catch {
      this.errorKey.set('shadowing.session.errors.microphoneDenied');
      this.phase.set('idle');
    }
  }

  private onRecordingStopped(audio: Blob): void {
    const scene = this.currentScene();
    if (!scene) {
      return;
    }

    this.phase.set('evaluating');

    this.gateway.evaluatePronunciation(audio, scene.text).subscribe((result) => {
      if (!result.isSuccess || !result.value) {
        this.errorKey.set(this.evaluateErrorKeyFor(result.error?.code));
        this.beginRepetitionRound(scene);
        return;
      }

      this.lastEvaluation.set(result.value);
      this.phase.set('feedback');

      setTimeout(() => this.afterFeedback(result.value!, scene), FEEDBACK_DISPLAY_MS);
    });
  }

  private afterFeedback(evaluation: PronunciationEvaluation, scene: Scene): void {
    if (evaluation.shouldRepeat) {
      this.beginRepetitionRound(scene);
      return;
    }

    this.completedSceneIds.update((ids) => new Set(ids).add(scene.id));
    this.advanceToNextScene();
  }

  private advanceToNextScene(): void {
    const nextIndex = this.currentSceneIndex() + 1;
    if (nextIndex >= this.scenes().length) {
      this.phase.set('completed');
      return;
    }

    this.currentSceneIndex.set(nextIndex);
    this.beginScene();
  }

  private importErrorKeyFor(code?: string): string {
    switch (code) {
      case 'InvalidVideoUrl':
        return 'shadowing.search.errors.invalidUrl';
      case 'VideoNotFound':
        return 'shadowing.search.errors.videoNotFound';
      case 'VideoNotEligible':
        return 'shadowing.search.errors.videoNotEligible';
      case 'YouTubeQuotaExhausted':
        return 'shadowing.search.errors.quotaExhausted';
      case 'TranscriptUnavailable':
      case 'ImportFailed':
      case 'PersistenceError':
        return 'shadowing.session.errors.importFailed';
      default:
        return 'shadowing.search.errors.unexpected';
    }
  }

  private evaluateErrorKeyFor(code?: string): string {
    switch (code) {
      case 'NoSpeechDetected':
        return 'shadowing.session.errors.noSpeechDetected';
      default:
        return 'shadowing.session.errors.evaluateFailed';
    }
  }
}
