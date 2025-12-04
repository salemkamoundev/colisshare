import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.user$.pipe(
    take(1),
    map(user => {
      if (user) {
        return true; // L'utilisateur est connecté, accès autorisé
      } else {
        // Non connecté -> Redirection vers la page de Login
        router.navigate(['/']);
        return false;
      }
    })
  );
};
