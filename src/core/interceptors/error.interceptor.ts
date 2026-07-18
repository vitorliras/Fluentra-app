import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notification = inject(NotificationService);

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 0 || error.status >= 500) {
        notification.error('Não foi possível se conectar ao servidor. Tente novamente.');
      }

      return throwError(() => error);
    }),
  );
};
