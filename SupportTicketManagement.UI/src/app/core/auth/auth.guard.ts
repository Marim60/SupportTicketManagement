import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.initialize();
  // Allow signed-in users through; otherwise send them to the home/sign-in page.
  return auth.isAuthenticated() || router.createUrlTree(['/']);
};
