import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AccessService } from '../../core/services/access.service';
import { UsersService } from '../../core/services/users.service';
import { AuthService } from '../../core/services/auth.service';
import { LoginDTO } from '../../core/models/login.dto';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [CommonModule, RouterLink, FormsModule]
})
export class LoginComponent {
  correo = '';
  contrasena = '';
  mensajeError = '';
  loading = false;

  constructor(
    private router: Router,
    private accessService: AccessService,
    private usersService: UsersService,
    private authService: AuthService
  ) {}

  // --- FUNCIONES DE NAVEGACIÓN Y UI (Las que faltaban) ---

  routeRegistro() {
    this.router.navigate(['/registro']);
  }

  routeRecuperarPass() {
    this.router.navigate(['/recuperar-pass']);
  }

  togglePassword(input: HTMLInputElement) {
    input.type = input.type === 'password' ? 'text' : 'password';
  }

  // --- LÓGICA DE LOGIN ---

  login() {
    this.mensajeError = '';
    this.loading = true;

    const payload: LoginDTO = {
      correo: this.correo,
      contrasena: this.contrasena
    };

    this.accessService.login(payload).subscribe({
      next: res => {
        if (res.isSuccess && res.token) {
          // 1. Guardar token
          localStorage.setItem('auth_token', res.token);
          
          // 2. Verificar rol
          this.verificarRolYRedirigir();
        } else {
          this.loading = false;
          this.mensajeError = 'Credenciales inválidas.';
        }
      },
      error: err => {
        console.error(err);
        this.loading = false;
        this.mensajeError = 'Ocurrió un error al conectar con el servidor.';
      }
    });
  }

  private verificarRolYRedirigir() {
    this.usersService.getMe().subscribe({
      next: (usuario) => {
        this.loading = false;
        
        const esCliente = usuario.esCliente || false;
        const esProveedor = usuario.esProveedor || false;
        const esAdmin = !esCliente && !esProveedor;

        if (esAdmin) {
          this.router.navigate(['/denuncias']);
        } else {
          this.router.navigate(['/menu']);
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Error obteniendo perfil', err);
        this.authService.logout();
        this.mensajeError = 'Error al cargar perfil de usuario.';
      }
    });
  }
}