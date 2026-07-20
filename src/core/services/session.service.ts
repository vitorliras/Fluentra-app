import { Injectable, signal } from '@angular/core';

const TOKEN_STORAGE_KEY = 'fluentra-access-token';
const NAME_STORAGE_KEY = 'fluentra-user-name';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly tokenSignal = signal<string | null>(localStorage.getItem(TOKEN_STORAGE_KEY));
  private readonly nameSignal = signal<string | null>(localStorage.getItem(NAME_STORAGE_KEY));

  token(): string | null {
    return this.tokenSignal();
  }

  name(): string | null {
    return this.nameSignal();
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

  setName(name: string | null): void {
    this.nameSignal.set(name);

    if (name) {
      localStorage.setItem(NAME_STORAGE_KEY, name);
    } else {
      localStorage.removeItem(NAME_STORAGE_KEY);
    }
  }
}
