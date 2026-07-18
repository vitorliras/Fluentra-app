import { Injectable, signal } from '@angular/core';

export type NotificationTone = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  readonly id: number;
  readonly tone: NotificationTone;
  readonly message: string;
}

const DEFAULT_DURATION_MS = 5000;

// Sistema de notificação próprio do Design System — nunca uma lib de terceiro
// (ex.: um "toastr" de mercado). Canal padrão de feedback de sucesso/erro/aviso
// para toda ação de Container.
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly queueSignal = signal<Notification[]>([]);
  private nextId = 0;

  readonly queue = this.queueSignal.asReadonly();

  success(message: string, durationMs = DEFAULT_DURATION_MS): void {
    this.push('success', message, durationMs);
  }

  error(message: string, durationMs = DEFAULT_DURATION_MS): void {
    this.push('error', message, durationMs);
  }

  warning(message: string, durationMs = DEFAULT_DURATION_MS): void {
    this.push('warning', message, durationMs);
  }

  info(message: string, durationMs = DEFAULT_DURATION_MS): void {
    this.push('info', message, durationMs);
  }

  dismiss(id: number): void {
    this.queueSignal.update((queue) => queue.filter((notification) => notification.id !== id));
  }

  private push(tone: NotificationTone, message: string, durationMs: number): void {
    const id = this.nextId++;

    this.queueSignal.update((queue) => [...queue, { id, tone, message }]);

    if (durationMs > 0) {
      setTimeout(() => this.dismiss(id), durationMs);
    }
  }
}
