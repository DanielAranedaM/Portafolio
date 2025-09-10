import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [RouterLink]
})
export class LoginComponent {
  constructor(private router: Router) {}

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
}