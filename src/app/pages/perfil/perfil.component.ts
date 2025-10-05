import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { UsersService } from '../../core/services/users.service';
import { UsuarioDetalleDTO } from '../../core/models/usuario-detalle.dto';
import { API_URL } from '../../core/tokens/api-url.token';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {
  constructor(
    private router: Router,
    private usersService: UsersService,
    @Inject(API_URL) private apiUrl: string
  ) {}

  // Datos del usuario
  userName = 'Usuario';
  userDescription: string | null = null;
  userRating: number | null = null;
  userPhone: string | null = null;

  // Foto
  profileImageUrl: string | null = null;
  userInitials = 'US';

  ngOnInit(): void {
    this.loadMe();
  }

  private loadMe(): void {
    this.usersService.getMe().subscribe({
      next: (me: UsuarioDetalleDTO) => {
        // Foto (si viene ruta relativa, la hago absoluta)
        this.profileImageUrl = me.fotoPerfilUrl ? this.makeAbsoluteUrl(me.fotoPerfilUrl) : null;

        // Nombre / iniciales
        this.userName = me.nombre || 'Usuario';
        this.userInitials = this.computeInitials(this.userName);

        // Descripción
        this.userDescription = me.descripcion ?? null;

        // Evaluación
        this.userRating = typeof me.evaluacion === 'number' ? me.evaluacion : null;

        // Teléfono
        this.userPhone = me.telefono ?? null;

        console.log('Perfil -> /Usuario/Me', me);
      },
      error: (err) => console.error('Error cargando perfil:', err)
    });
  }

  // Helpers
  private computeInitials(fullName: string): string {
    if (!fullName?.trim()) return 'US';
    const parts = fullName.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
    return (first + last).toUpperCase();
  }

  private makeAbsoluteUrl(ruta: string): string {
    if (/^https?:\/\//i.test(ruta)) return ruta;
    return `${this.apiUrl}${ruta}`;
  }

  get hasProfileImage(): boolean {
    return this.profileImageUrl !== null;
  }

  // Acciones
  goBack(): void {
    this.router.navigate(['/']);
  }

  logout(): void {
    try {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('userPreferences');
      localStorage.removeItem('auth_token');
      sessionStorage.clear();
      this.router.navigate(['/login']);
    } catch (e) {
      console.error('Error al cerrar sesión:', e);
    }
  }
}
