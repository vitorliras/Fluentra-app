import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ShellLayoutService {
  private readonly collapsedSignal = signal(false);

  readonly collapsed = this.collapsedSignal.asReadonly();
  readonly sidebarWidth = computed(() => (this.collapsedSignal() ? '4.75rem' : '15rem'));

  toggleCollapsed(): void {
    this.collapsedSignal.update((value) => !value);
  }
}
