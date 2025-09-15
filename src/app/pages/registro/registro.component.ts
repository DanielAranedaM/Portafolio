import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators, FormGroup, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pass = group.get('password')?.value;
  const repeat = group.get('repeatPassword')?.value;
  return pass && repeat && pass !== repeat ? { passwordsMismatch: true } : null;
}

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent {
  showPass = false;
  showPass2 = false;

  form!: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
    this.form = this.fb.group({
      nombreCompleto: ['', [Validators.required, Validators.minLength(3)]],
      direccion:  ['', [Validators.required]],
      email:    ['', [Validators.required, Validators.email]],
      passwordGroup: this.fb.group({
        password:       ['', [Validators.required, Validators.minLength(6)]],
        repeatPassword: ['', [Validators.required]]
      }, { validators: passwordsMatch }),
      role: ['solicitante', Validators.required] // 'proveedor' | 'solicitante'
    });
  }

  registrarme() {
    if (this.form.valid) {
      const userData = {
        nombreCompleto: this.form.value.nombreCompleto,
        direccion: this.form.value.direccion,
        email: this.form.value.email,
        password: this.form.value.passwordGroup.password,
        role: this.form.value.role
      };
      console.log('Usuario registrado:', userData);
      this.router.navigate(['/login']);
    } else {
      this.form.markAllAsTouched();
    }
  }

  routeLogin() {
    this.router.navigate(['/login']);
  }
}