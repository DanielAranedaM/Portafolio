import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly TOKEN_KEY = 'auth_token';

  // Guarda el token recibido del login (AccessController)
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);

    // Redirigir al login para forzar nueva autenticación
    this.router.navigate(['/auth/login']); 
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}