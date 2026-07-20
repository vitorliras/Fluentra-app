import { Injectable, computed, signal } from '@angular/core';

const MOBILE_BREAKPOINT_PX = 768;

@Injectable({ providedIn: 'root' })
export class ShellLayoutService {
  private readonly collapsedSignal = signal(window.innerWidth <= MOBILE_BREAKPOINT_PX);

  readonly collapsed = this.collapsedSignal.asReadonly();
  readonly sidebarWidth = computed(() => (this.collapsedSignal() ? '4.75rem' : '15rem'));

  toggleCollapsed(): void {
    this.collapsedSignal.update((value) => !value);
  }

  close(): void {
    this.collapsedSignal.set(true);
  }
}
