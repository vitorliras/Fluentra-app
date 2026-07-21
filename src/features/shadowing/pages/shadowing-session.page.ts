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
  | 'ready'
  | 'recording'
  | 'evaluating'
  | 'feedback'
  | 'completed';

const COMPREHENSION_SECONDS = 5;
const FEEDBACK_DISPLAY_MS = 2500;
const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5];
const REPEAT_COUNT_OPTIONS = [1, 2, 3, 4];
const WAIT_MODE_OPTIONS = [0, 25, 50, 75, 100];
const TRANSLATION_LANGUAGE_OPTIONS = ['pt', 'es', 'fr'];

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

  protected readonly speedOptions = SPEED_OPTIONS;
  protected readonly repeatCountOptions = REPEAT_COUNT_OPTIONS;
  protected readonly waitModeOptions = WAIT_MODE_OPTIONS;
  protected readonly translationLanguageOptions = TRANSLATION_LANGUAGE_OPTIONS;

  protected readonly selectedVideo = signal<VideoSearchResult | null>(null);
  protected readonly scenes = signal<Scene[]>([]);
  protected readonly currentSceneIndex = signal(0);
  protected readonly phase = signal<SessionPhase>('idle');
  protected readonly comprehensionSecondsLeft = signal(COMPREHENSION_SECONDS);
  protected readonly lastEvaluation = signal<PronunciationEvaluation | null>(null);
  protected readonly completedSceneIds = signal<Set<number>>(new Set());
  protected readonly errorKey = signal<string | null>(null);
  protected readonly isPlaying = signal(false);
  protected readonly currentPlaybackSeconds = signal(0);
  protected readonly speed = signal(1);
  protected readonly repeatCount = signal(1);
  protected readonly waitModePercent = signal(50);
  protected readonly showTranslation = signal(true);
  protected readonly translationLanguage = signal('pt');

  private readonly seenSceneIds = new Set<number>();
  private readonly sceneAttemptCounts = new Map<number, number>();
  private comprehensionInterval: ReturnType<typeof setInterval> | null = null;

  protected readonly currentScene = computed<Scene | null>(() => this.scenes()[this.currentSceneIndex()] ?? null);

  protected readonly comprehensionPercent = computed(
    () => (this.comprehensionSecondsLeft() / COMPREHENSION_SECONDS) * 100,
  );

  protected readonly highlightedWordIndex = computed<number>(() => {
    const scene = this.currentScene();
    if (!scene) {
      return -1;
    }

    const words = scene.text.split(' ').filter(Boolean);
    const sceneDuration = scene.endSeconds - scene.startSeconds;
    if (words.length === 0 || sceneDuration <= 0) {
      return -1;
    }

    const elapsed = this.currentPlaybackSeconds() - scene.startSeconds;
    if (elapsed < 0) {
      return -1;
    }

    const perWord = sceneDuration / words.length;
    return Math.min(words.length - 1, Math.floor(elapsed / perWord));
  });

  protected sceneWords(scene: Scene): string[] {
    return scene.text.split(' ').filter(Boolean);
  }

  protected sceneTranslation(scene: Scene): string | null {
    return scene.translations[this.translationLanguage()] ?? null;
  }

  protected onToggleTranslation(): void {
    this.showTranslation.update((value) => !value);
  }

  protected onTranslationLanguageChange(value: string): void {
    this.translationLanguage.set(value);
  }

  protected async onVideoSelected(video: VideoSearchResult): Promise<void> {
    this.selectedVideo.set(video);
    this.phase.set('importing');
    this.errorKey.set(null);
    this.scenes.set([]);
    this.completedSceneIds.set(new Set());
    this.seenSceneIds.clear();
    this.sceneAttemptCounts.clear();

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

      this.youtubePlayer.setPlaybackRate(this.speed());
      this.beginScene();
    });
  }

  protected onSpeedChange(value: string): void {
    const rate = Number(value);
    this.speed.set(rate);
    this.youtubePlayer.setPlaybackRate(rate);
  }

  protected onRepeatCountChange(value: string): void {
    this.repeatCount.set(Number(value));
  }

  protected onWaitModeChange(value: string): void {
    this.waitModePercent.set(Number(value));
  }

  protected onPlayPauseClick(): void {
    if (this.isPlaying()) {
      this.youtubePlayer.pause();
      this.isPlaying.set(false);
      return;
    }

    this.youtubePlayer.resume();
    this.isPlaying.set(true);
  }

  private isBusyPhase(): boolean {
    const phase = this.phase();
    return phase === 'recording' || phase === 'evaluating' || phase === 'feedback';
  }

  protected onRestartClick(): void {
    const scene = this.currentScene();
    if (!scene || this.isBusyPhase()) {
      return;
    }

    this.playCurrentClip(scene, this.phase() === 'comprehension');
  }

  protected onNextClick(): void {
    const scene = this.currentScene();
    if (!scene || this.isBusyPhase()) {
      return;
    }

    this.completedSceneIds.update((ids) => new Set(ids).add(scene.id));
    this.advanceToNextScene();
  }

  protected onPhraseClick(index: number): void {
    if (this.isBusyPhase()) {
      return;
    }

    this.currentSceneIndex.set(index);
    this.beginScene();
  }

  protected async onRecordClick(): Promise<void> {
    const scene = this.currentScene();
    if (!scene || this.phase() !== 'ready') {
      return;
    }

    this.phase.set('recording');
    this.errorKey.set(null);

    const sceneDurationMs = (scene.endSeconds - scene.startSeconds) * 1000;
    const maxDurationMs = sceneDurationMs * (1 + this.waitModePercent() / 100);

    try {
      await this.audioRecorder.start(maxDurationMs, (audio) => this.onRecordingStopped(audio));
    } catch {
      this.errorKey.set('shadowing.session.errors.microphoneDenied');
      this.phase.set('ready');
    }
  }

  private beginScene(): void {
    const scene = this.currentScene();
    if (!scene) {
      this.phase.set('completed');
      return;
    }

    this.lastEvaluation.set(null);
    this.errorKey.set(null);
    const firstExposure = !this.seenSceneIds.has(scene.id);
    this.seenSceneIds.add(scene.id);

    this.playCurrentClip(scene, firstExposure);
  }

  private playCurrentClip(scene: Scene, isComprehension: boolean): void {
    this.clearComprehensionInterval();
    this.phase.set(isComprehension ? 'comprehension' : 'ready');
    this.isPlaying.set(true);

    this.youtubePlayer.playClip(
      scene.startSeconds,
      scene.endSeconds,
      (currentSeconds) => this.currentPlaybackSeconds.set(currentSeconds),
      () => {
        this.isPlaying.set(false);
        if (isComprehension) {
          this.runComprehensionCountdown(scene);
        } else {
          this.phase.set('ready');
        }
      },
    );
  }

  private runComprehensionCountdown(scene: Scene): void {
    this.comprehensionSecondsLeft.set(COMPREHENSION_SECONDS);
    this.clearComprehensionInterval();

    this.comprehensionInterval = setInterval(() => {
      const remaining = this.comprehensionSecondsLeft() - 1;
      this.comprehensionSecondsLeft.set(remaining);

      if (remaining <= 0) {
        this.clearComprehensionInterval();
        this.playCurrentClip(scene, false);
      }
    }, 1000);
  }

  private clearComprehensionInterval(): void {
    if (this.comprehensionInterval !== null) {
      clearInterval(this.comprehensionInterval);
      this.comprehensionInterval = null;
    }
  }

  private onRecordingStopped(audio: Blob): void {
    const scene = this.currentScene();
    if (!scene) {
      return;
    }

    this.sceneAttemptCounts.set(scene.id, (this.sceneAttemptCounts.get(scene.id) ?? 0) + 1);
    this.phase.set('evaluating');

    this.gateway.evaluatePronunciation(audio, scene.text).subscribe((result) => {
      if (this.currentScene()?.id !== scene.id) {
        return;
      }

      if (!result.isSuccess || !result.value) {
        this.errorKey.set(this.evaluateErrorKeyFor(result.error?.code));
        this.phase.set('ready');
        return;
      }

      this.lastEvaluation.set(result.value);
      this.phase.set('feedback');

      setTimeout(() => this.afterFeedback(result.value!, scene), FEEDBACK_DISPLAY_MS);
    });
  }

  private afterFeedback(evaluation: PronunciationEvaluation, scene: Scene): void {
    if (this.currentScene()?.id !== scene.id) {
      return;
    }

    const attempts = this.sceneAttemptCounts.get(scene.id) ?? 0;
    const belowMinimumRepeats = attempts < this.repeatCount();

    if (evaluation.shouldRepeat || belowMinimumRepeats) {
      this.playCurrentClip(scene, false);
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
