import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { UsersService } from '../services/users.service'; 

export const adminGuard: CanActivateFn = (route, state) => {
  // Inyectamos dependencias
  const usersService = inject(UsersService);
  const router = inject(Router);

  return usersService.getMe().pipe(
    map(user => {
      // Admin es quien NO es cliente Y NO es proveedor.
      const esCliente = user.esCliente || false;
      const esProveedor = user.esProveedor || false;

      // Si ambas son falsas, asumimos que es el Admin
      const esAdmin = !esCliente && !esProveedor;

      if (esAdmin) {
        return true; // 
      } else {
        console.warn('Acceso denegado: Solo para administradores.');
        router.navigate(['/home']); 
        return false;
      }
    }),
    catchError((error) => {
      console.error('Error verificando permisos', error);
      router.navigate(['/auth/login']); 
      return of(false);
    })
  );
};