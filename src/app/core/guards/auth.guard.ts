import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service'; 

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificamos si está autenticado (tiene token)
  if (authService.isAuthenticated()) {
    return true; 
  }

  // NO tiene token:
  alert('⚠️ Acceso restringido: Debes iniciar sesión para acceder a esta sección.');
  router.navigate(['/login']);
  return false; 
};