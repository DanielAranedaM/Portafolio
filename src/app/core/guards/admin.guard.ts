import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { UsersService } from '../services/users.service'; // Ajusta la ruta a tu UsersService

export const adminGuard: CanActivateFn = (route, state) => {
  // Inyectamos dependencias
  const usersService = inject(UsersService);
  const router = inject(Router);

  // Llamamos a getMe() para ver quién es el usuario actual
  return usersService.getMe().pipe(
    map(user => {
      // LÓGICA: Según tu definición, Admin es quien NO es cliente Y NO es proveedor.
      // Revisamos las propiedades del DTO
      const esCliente = user.esCliente || false;
      const esProveedor = user.esProveedor || false;

      // Si ambas son falsas, asumimos que es el Admin
      const esAdmin = !esCliente && !esProveedor;

      if (esAdmin) {
        return true; // ✅ Acceso permitido
      } else {
        // ⛔ Si es cliente o proveedor, lo mandamos al inicio (o donde prefieras)
        console.warn('Acceso denegado: Solo para administradores.');
        router.navigate(['/home']); 
        return false;
      }
    }),
    catchError((error) => {
      // Si getMe() falla (ej: token vencido o error 401), lo mandamos al login
      console.error('Error verificando permisos', error);
      router.navigate(['/auth/login']); 
      return of(false);
    })
  );
};