import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recuperar-pass',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './recuperar-pass.component.html',
  styleUrl: './recuperar-pass.component.css'
})
export class RecuperarPassComponent {
  constructor(private router: Router) {}
  email: string = '';
  showModal: boolean = false;

  //-----------------------------------Navegación--------------------------------------
  //Navegar a Login
  routeLogin() {
    this.router.navigate(['/login']);
  }

  //-------------------------------------Modal-----------------------------------------
  //Método que se ejecuta cuando se envía el formulario
  onSubmit(): void {
    if (this.email && this.isValidEmail(this.email)) {
      // Simular el envío del correo
      this.sendRecoveryEmail();
    } else {
      alert('Por favor, ingresa un correo electrónico válido.');
    }
  }

  //Simula el envío del correo de recuperación
  private sendRecoveryEmail(): void {
    // Aquí colocar el servicio/API
    // Por ejemplo:
    // this.authService.sendRecoveryEmail(this.email).subscribe(...)
    
    // Simulamos una respuesta exitosa
    setTimeout(() => {
      this.showModal = true;
    }, 500);
  }

  //Valida si el correo tiene un formato válido
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  //Cierra el modal
  closeModal(): void {
    this.showModal = false;
    // Opcion 1: limpiar el formulario después de cerrar el modal
    this.email = '';
    // Opcion 2: redirigir al login después de cerrar el modal
    // this.routeLogin();
  }

  //Función para mostrar el modal directamente (testing)
  showRecoveryModal(): void {
    this.showModal = true;
  }
}