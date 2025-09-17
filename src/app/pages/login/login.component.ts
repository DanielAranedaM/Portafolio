import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [RouterLink]
})
export class LoginComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    // Verificar si ya hay un usuario logueado
    const userData = localStorage.getItem('userData');
    if (userData) {
      // Usuario ya registrado, redirigir al menú
      this.router.navigate(['/menu']);
    }
  }

  //-----------------------------------Navegación--------------------------------------------
  //Navegar a Registro
  routeRegistro() {
    this.router.navigate(['/registro']);
  }

  //Navegar a Menu (solo si hay datos de usuario)
  routeMenu() {
    const userData = localStorage.getItem('userData');
    if (userData) {
      this.router.navigate(['/menu']);
    } else {
      alert('Por favor regístrate primero');
      this.router.navigate(['/registro']);
    }
  }

  //Navegar a Recuperar pass
  routeRecuperarPass() {
    this.router.navigate(['/recuperar-pass']);
  }
}