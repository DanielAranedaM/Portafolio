import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AccessService } from '../../core/services/access.service';
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
    private accessService: AccessService
  ) {}

  //-----------------------------------Navegación--------------------------------------------
  //Navegar a Registro
  routeRegistro() {
    this.router.navigate(['/registro']);
  }

  //Navegar a Menu
  routeMenu() {
    this.router.navigate(['/menu']);
  }

  //Navegar a Recuperar pass
  routeRecuperarPass() {
    this.router.navigate(['/recuperar-pass']);
  }

  login() {
    this.mensajeError = '';
    this.loading = true;

    const payload: LoginDTO = {
      correo: this.correo,
      contrasena: this.contrasena
    };

    this.accessService.login(payload).subscribe({
      next: res => {
        this.loading = false;
        if (res.isSuccess && res.token) {
          localStorage.setItem('auth_token', res.token);
          this.router.navigate(['/menu']); // redirige
        } else {
          this.mensajeError = 'Credenciales inválidas.';
        }
      },
      error: () => {
        this.loading = false;
        this.mensajeError = 'Error de servidor o validación.';
      }
    });
  }
  
  togglePassword(input: HTMLInputElement) {
    input.type = input.type === 'password' ? 'text' : 'password';
  }
}