import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { map, skipWhile, take, tap } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // user$ émet null au début avant de vérifier le token local.
  // On ne veut PAS prendre cette première valeur "null" par défaut si Firebase est en train de charger.
  // Mais authState() gère ça bien généralement.
  // Si le problème persiste, c'est souvent que le Guard s'exécute TROP vite.
  
  return auth.user$.pipe(
    take(1), 
    tap(user => {
      // Log pour debug
      if (!user) {
        console.log('🔒 AuthGuard: Pas d\'utilisateur -> Redirection Login');
        router.navigate(['/']);
      }
    }),
    map(user => !!user)
  );
};
