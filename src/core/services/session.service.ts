import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly tokenSignal = signal<string | null>(null);

  token(): string | null {
    return this.tokenSignal();
  }

  isAuthenticated(): boolean {
    return this.tokenSignal() !== null;
  }

  setToken(token: string | null): void {
    this.tokenSignal.set(token);
  }
}
