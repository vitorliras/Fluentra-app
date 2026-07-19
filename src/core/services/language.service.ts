import { HttpClient } from '@angular/common/http';
import { Injectable, computed, isDevMode, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export type Language = 'pt-BR' | 'en' | 'es' | 'fr';

type Dictionary = Record<string, unknown>;

const STORAGE_KEY = 'fluentra-language';
export const SUPPORTED_LANGUAGES: readonly Language[] = ['pt-BR', 'en', 'es', 'fr'];
const FALLBACK_LANGUAGE: Language = 'pt-BR';

// Mecanismo central de idioma (ver discussão registrada em .claude/decisions) — dicionários
// estáticos em assets/i18n/, carregados uma única vez no boot via provideAppInitializer
// (mesmo padrão do ConfigService), sem nenhuma chamada ao backend. Chaves resolvidas por
// caminho ("auth.login.title"), com fallback silencioso para pt-BR quando uma chave falta
// num idioma ainda incompleto.
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly languageSignal = signal<Language>(this.readInitialLanguage());
  private readonly dictionariesSignal = signal<Partial<Record<Language, Dictionary>>>({});

  readonly language = this.languageSignal.asReadonly();

  private readonly currentDictionary = computed(() => this.dictionariesSignal()[this.languageSignal()]);
  private readonly fallbackDictionary = computed(() => this.dictionariesSignal()[FALLBACK_LANGUAGE]);

  constructor(private readonly http: HttpClient) {}

  async load(): Promise<void> {
    const entries = await Promise.all(
      SUPPORTED_LANGUAGES.map(async (language) => {
        const dictionary = await firstValueFrom(this.http.get<Dictionary>(`assets/i18n/${language}.json`));
        return [language, dictionary] as const;
      }),
    );

    this.dictionariesSignal.set(Object.fromEntries(entries) as Partial<Record<Language, Dictionary>>);
  }

  setLanguage(language: Language): void {
    this.languageSignal.set(language);
    localStorage.setItem(STORAGE_KEY, language);
  }

  t(key: string, params?: Record<string, string>): string {
    const value = this.lookup(key, this.currentDictionary()) ?? this.lookup(key, this.fallbackDictionary());

    if (value === undefined) {
      if (isDevMode()) {
        console.warn(`[LanguageService] Chave de tradução ausente: "${key}"`);
      }
      return key;
    }

    return params ? this.interpolate(value, params) : value;
  }

  private lookup(key: string, dictionary: Dictionary | undefined): string | undefined {
    if (!dictionary) {
      return undefined;
    }

    const result = key.split('.').reduce<unknown>((node, segment) => {
      if (node && typeof node === 'object' && segment in (node as Record<string, unknown>)) {
        return (node as Record<string, unknown>)[segment];
      }
      return undefined;
    }, dictionary);

    return typeof result === 'string' ? result : undefined;
  }

  private interpolate(text: string, params: Record<string, string>): string {
    return text.replace(/\{(\w+)\}/g, (match, token) => params[token] ?? match);
  }

  private readInitialLanguage(): Language {
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;

    if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
      return stored;
    }

    const browserLanguage = navigator.language.toLowerCase();

    if (browserLanguage.startsWith('pt')) return 'pt-BR';
    if (browserLanguage.startsWith('es')) return 'es';
    if (browserLanguage.startsWith('fr')) return 'fr';
    if (browserLanguage.startsWith('en')) return 'en';

    return FALLBACK_LANGUAGE;
  }
}
