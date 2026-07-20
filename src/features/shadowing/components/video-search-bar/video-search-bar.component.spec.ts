import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageService } from '../../../../core/services/language.service';
import { Result } from '../../../../shared/results/result';
import { ResultError } from '../../../../shared/results/error';
import { ShadowingGateway } from '../../data-access/shadowing.gateway';
import { VideoSearchResult } from '../../data-access/models/video-search-result.model';
import { VideoSearchBarComponent } from './video-search-bar.component';

const fakeLanguageService = { t: (key: string) => key };

function createComponent(gateway: Partial<ShadowingGateway>) {
  TestBed.configureTestingModule({
    providers: [
      { provide: ShadowingGateway, useValue: gateway },
      { provide: LanguageService, useValue: fakeLanguageService },
    ],
  });

  return TestBed.createComponent(VideoSearchBarComponent).componentInstance;
}

function video(overrides: Partial<VideoSearchResult> = {}): VideoSearchResult {
  return {
    youTubeVideoId: 'abcdefghijk',
    title: 'Some Video',
    thumbnailUrl: '',
    durationSeconds: 300,
    viewCount: 50_000,
    likeCount: 2_000,
    popularityTier: 'Grande',
    ...overrides,
  };
}

describe('VideoSearchBarComponent', () => {
  beforeEach(() => localStorage.clear());

  it('should look up a video directly when a YouTube URL is typed', () => {
    const getVideoByUrl = vi.fn(() => of(Result.success(video())));
    const component = createComponent({ getVideoByUrl, searchVideos: vi.fn() });

    component['onInput']('https://www.youtube.com/watch?v=abcdefghijk');

    expect(getVideoByUrl).toHaveBeenCalledWith({ url: 'https://www.youtube.com/watch?v=abcdefghijk' });
    expect(component['singleResult']()).toEqual(video());
    expect(component['dropdownOpen']()).toBe(true);
  });

  it('should search by subject when the user presses enter on plain text', () => {
    const searchVideos = vi.fn(() => of(Result.success({ videos: [video()], quotaNearLimit: false })));
    const component = createComponent({ searchVideos, getVideoByUrl: vi.fn() });

    component['query'].set('daily routine');
    component['onSubmit']();

    expect(searchVideos).toHaveBeenCalledWith({ subject: 'daily routine', desiredDurationMinutes: 10 });
    expect(component['results']()).toEqual([video()]);
  });

  it('should not search when the field is empty', () => {
    const searchVideos = vi.fn();
    const component = createComponent({ searchVideos, getVideoByUrl: vi.fn() });

    component['query'].set('');
    component['onSubmit']();

    expect(searchVideos).not.toHaveBeenCalled();
  });

  it('should show an error when the video URL is not eligible', () => {
    const getVideoByUrl = vi.fn(() => of(Result.failure<VideoSearchResult>(ResultError.from('VideoNotEligible'))));
    const component = createComponent({ getVideoByUrl, searchVideos: vi.fn() });

    component['onInput']('https://youtu.be/abcdefghijk');

    expect(component['singleResult']()).toBeNull();
    expect(component['errorKey']()).toBe('shadowing.search.errors.videoNotEligible');
  });

  it('should show the recommended placeholder when the field is focused empty', () => {
    const component = createComponent({ searchVideos: vi.fn(), getVideoByUrl: vi.fn() });

    component['onFocus']();

    expect(component['dropdownOpen']()).toBe(true);
    expect(component['results']()).toBeNull();
    expect(component['recommendedPlaceholder'].length).toBe(2);
  });
});
