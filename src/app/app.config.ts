import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from '../core/interceptors/auth.interceptor';
import { errorInterceptor } from '../core/interceptors/error.interceptor';
import { ConfigService } from '../core/services/config.service';
import { LanguageService } from '../core/services/language.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideAppInitializer(async () => {
      const config = inject(ConfigService);
      const language = inject(LanguageService);
      await Promise.all([config.load(), language.load()]);
    }),
  ],
};
