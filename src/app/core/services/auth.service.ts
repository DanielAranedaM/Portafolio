import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly TOKEN_KEY = 'auth_token';

  /**
   * Guarda el token recibido del login (AccessController)
   */
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Obtiene el token actual (útil para validaciones rápidas)
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * ESTO ES EL LOGOUT:
   * 1. Borra el token del almacenamiento.
   * 2. Redirige al usuario al login o home.
   * Con esto, aunque el token siga "vivo" matemáticamente, el navegador ya no lo tiene
   * y el Interceptor dejará de enviarlo.
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    
    // Opcional: Limpiar cualquier otro dato del usuario si guardas algo más
    // localStorage.removeItem('user_data'); 

    // Redirigir al login para forzar nueva autenticación
    this.router.navigate(['/auth/login']); 
  }

  /**
   * Verifica rápidamente si hay sesión (no valida si expiró, solo si existe)
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}