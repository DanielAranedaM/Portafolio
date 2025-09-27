import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registrar-servicio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registrar-servicio.component.html',
  styleUrl: './registrar-servicio.component.css'
})
export class RegistrarServicioComponent implements OnInit {
  currentStep = 1;
  totalSteps = 3;

  form!: FormGroup;
  userDireccion: string = '';
  selectedFiles: File[] = [];

  constructor(private fb: FormBuilder, private router: Router) {
    this.form = this.fb.group({
      nombreServicio: ['', [Validators.required, Validators.minLength(3)]],
      categoria: ['', Validators.required],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      precio: ['', [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit() {
    // Obtener dirección del usuario desde localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        this.userDireccion = user.direccion || '';
      } catch (error) {
        console.error('Error al parsear userData:', error);
      }
    }
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files) {
      this.selectedFiles = Array.from(files);
    }
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  submit() {
    if (this.form.valid) {
      const servicioData = {
        ...this.form.value,
        ubicacion: this.userDireccion,
        imagenes: this.selectedFiles
      };
      console.log('Servicio registrado:', servicioData);
      // Aquí podrías enviar a un servicio o API
      this.router.navigate(['/menu']); // O a donde corresponda
    } else {
      this.form.markAllAsTouched();
    }
  }

  isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        return !!(this.form.get('nombreServicio')?.valid && this.form.get('categoria')?.valid);
      case 2:
        return !!(this.form.get('descripcion')?.valid && this.form.get('precio')?.valid);
      case 3:
        return true; // Siempre válido ya que la ubicación viene del usuario
      default:
        return false;
    }
  }
}
