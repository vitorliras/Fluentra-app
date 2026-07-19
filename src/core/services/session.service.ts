import { Injectable, signal } from '@angular/core';

const TOKEN_STORAGE_KEY = 'fluentra-access-token';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly tokenSignal = signal<string | null>(localStorage.getItem(TOKEN_STORAGE_KEY));

  token(): string | null {
    return this.tokenSignal();
  }

  isAuthenticated(): boolean {
    return this.tokenSignal() !== null;
  }

  setToken(token: string | null): void {
    this.tokenSignal.set(token);

    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }
}
