import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, output, signal } from '@angular/core';
import { LanguageService } from '../../../../core/services/language.service';
import { ShadowingGateway } from '../../data-access/shadowing.gateway';
import { VideoSearchResult } from '../../data-access/models/video-search-result.model';

const DEFAULT_DURATION_MINUTES = 10;
const BLUR_SEARCH_DELAY_MS = 150;

const RECOMMENDED_PLACEHOLDER: VideoSearchResult[] = [
  {
    youTubeVideoId: 'placeholder-1',
    title: 'Everyday English Conversations for Beginners',
    thumbnailUrl: '',
    durationSeconds: 312,
    viewCount: 850_000,
    likeCount: 42_000,
    popularityTier: 'Grande',
  },
  {
    youTubeVideoId: 'placeholder-2',
    title: 'How to Sound More Natural in English',
    thumbnailUrl: '',
    durationSeconds: 480,
    viewCount: 1_200_000,
    likeCount: 67_000,
    popularityTier: 'Viral',
  },
];

@Component({
  selector: 'app-video-search-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  templateUrl: './video-search-bar.component.html',
  styleUrl: './video-search-bar.component.scss',
})
export class VideoSearchBarComponent {
  private readonly gateway = inject(ShadowingGateway);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  protected readonly languageService = inject(LanguageService);

  protected readonly query = signal('');
  protected readonly dropdownOpen = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly results = signal<VideoSearchResult[] | null>(null);
  protected readonly singleResult = signal<VideoSearchResult | null>(null);
  protected readonly errorKey = signal<string | null>(null);
  protected readonly durationMinutes = signal(DEFAULT_DURATION_MINUTES);
  protected readonly recommendedPlaceholder = RECOMMENDED_PLACEHOLDER;

  readonly videoSelected = output<VideoSearchResult>();

  private lastLookedUpValue = '';

  protected onInput(value: string): void {
    this.query.set(value);
    this.errorKey.set(null);

    if (!value) {
      this.showRecommended();
      return;
    }

    const trimmed = value.trim();
    if (this.isVideoUrl(trimmed) && trimmed !== this.lastLookedUpValue) {
      this.lookupByUrl(trimmed);
    }
  }

  protected onFocus(): void {
    if (!this.query()) {
      this.showRecommended();
    } else {
      this.dropdownOpen.set(true);
    }
  }

  protected onSubmit(): void {
    this.executeSearch();
  }

  protected onDurationInput(value: string): void {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      this.durationMinutes.set(parsed);
    }
  }

  protected onBlur(): void {
    setTimeout(() => this.executeSearch(), BLUR_SEARCH_DELAY_MS);
  }

  protected selectResult(video: VideoSearchResult): void {
    this.dropdownOpen.set(false);
    this.videoSelected.emit(video);
  }

  protected formatDuration(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  protected formatCount(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return `${value}`;
  }

  private executeSearch(): void {
    const value = this.query().trim();
    if (!value || this.isVideoUrl(value)) {
      return;
    }

    this.isLoading.set(true);
    this.dropdownOpen.set(true);
    this.singleResult.set(null);

    this.gateway
      .searchVideos({ subject: value, desiredDurationMinutes: this.durationMinutes() })
      .subscribe((result) => {
        this.isLoading.set(false);

        if (result.isSuccess && result.value) {
          this.results.set(result.value.videos);
          return;
        }

        this.results.set(null);
        this.errorKey.set('shadowing.search.errors.searchFailed');
      });
  }

  private lookupByUrl(value: string): void {
    this.lastLookedUpValue = value;
    this.isLoading.set(true);
    this.dropdownOpen.set(true);
    this.results.set(null);

    this.gateway.getVideoByUrl({ url: value }).subscribe((result) => {
      this.isLoading.set(false);

      if (result.isSuccess && result.value) {
        this.singleResult.set(result.value);
        return;
      }

      this.singleResult.set(null);
      this.errorKey.set(this.errorKeyFor(result.error?.code));
    });
  }

  private showRecommended(): void {
    this.results.set(null);
    this.singleResult.set(null);
    this.errorKey.set(null);
    this.dropdownOpen.set(true);
  }

  private isVideoUrl(value: string): boolean {
    return /youtube\.com|youtu\.be/i.test(value) || /^[A-Za-z0-9_-]{11}$/.test(value);
  }

  private errorKeyFor(code?: string): string {
    switch (code) {
      case 'InvalidVideoUrl':
        return 'shadowing.search.errors.invalidUrl';
      case 'VideoNotFound':
        return 'shadowing.search.errors.videoNotFound';
      case 'VideoNotEligible':
        return 'shadowing.search.errors.videoNotEligible';
      case 'YouTubeQuotaExhausted':
        return 'shadowing.search.errors.quotaExhausted';
      default:
        return 'shadowing.search.errors.unexpected';
    }
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (this.dropdownOpen() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.dropdownOpen.set(false);
    }
  }
}
