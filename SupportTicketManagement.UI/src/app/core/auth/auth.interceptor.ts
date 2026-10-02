import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { from, switchMap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const baseUrl = inject(API_BASE_URL);
  const api = new URL(baseUrl);
  const target = new URL(request.url, window.location.origin);
  const apiPath = api.pathname.replace(/\/$/, '');
  // Send tokens only to our API origin and path, never to unrelated services.
  if (target.origin !== api.origin ||
      (apiPath !== '' && target.pathname !== apiPath && !target.pathname.startsWith(`${apiPath}/`))) {
    return next(request);
  }

  const auth = inject(AuthService);
  // Wait for the token, then copy the request with an Authorization header.
  return from(auth.getAccessToken()).pipe(
    switchMap(token => next(request.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    })))
  );
};
