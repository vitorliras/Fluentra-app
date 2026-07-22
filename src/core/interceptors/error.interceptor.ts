import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { LanguageService } from '../services/language.service';
import { NotificationService } from '../services/notification.service';
import { SessionService } from '../services/session.service';

let sessionExpiredHandled = false;

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notification = inject(NotificationService);
  const session = inject(SessionService);
  const router = inject(Router);
  const languageService = inject(LanguageService);

  return next(req).pipe(
    catchError((error) => {
      const hadAuthHeader = req.headers.has('Authorization');

      if (error.status === 401 && hadAuthHeader && !sessionExpiredHandled) {
        sessionExpiredHandled = true;
        session.setToken(null);
        session.setName(null);
        notification.error(languageService.t('auth.errors.sessionExpired'));
        router.navigateByUrl('/login').finally(() => {
          sessionExpiredHandled = false;
        });
      } else if (error.status === 0 || error.status >= 500) {
        notification.error('Não foi possível se conectar ao servidor. Tente novamente.');
      }

      return throwError(() => error);
    }),
  );
};
