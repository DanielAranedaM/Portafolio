import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service'; // Ajusta la ruta si es necesario

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. Verificamos si está autenticado (tiene token)
  if (authService.isAuthenticated()) {
    return true; // ✅ Pasa, tiene llave
  }

  // 2. Si NO tiene token:
  // Mostramos la ventana/alerta que pediste
  alert('⚠️ Acceso restringido: Debes iniciar sesión para acceder a esta sección.');
  
  // Lo mandamos al login
  router.navigate(['/login']);
  return false; // ⛔ Bloqueado
};