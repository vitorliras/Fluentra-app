import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly configSignal = signal<Record<string, unknown> | null>(null);

  constructor(private readonly http: HttpClient) {}

  async load(): Promise<void> {
    const config = await firstValueFrom(
      this.http.get<Record<string, unknown>>('/config.json'),
    );

    this.configSignal.set(config);
  }

  get config(): Record<string, unknown> {
    const value = this.configSignal();

    if (!value) {
      throw new Error('Configuração não carregada');
    }

    return value;
  }
}
