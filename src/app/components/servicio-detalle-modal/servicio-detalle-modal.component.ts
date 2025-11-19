import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServicioDetalleDTO } from '../../core/models/servicio-detalle.dto';
import { ServicesService } from '../../core/services/services.service';

@Component({
  selector: 'app-servicio-detalle-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './servicio-detalle-modal.component.html',
  styleUrl: './servicio-detalle-modal.component.css'
})
export class ServicioDetalleModalComponent implements OnInit {
  @Input() servicioId!: number;
  @Output() close = new EventEmitter<void>();
  @Output() contactar = new EventEmitter<number>();
  @Output() guardar = new EventEmitter<number>();

  detalle: ServicioDetalleDTO | null = null;
  currentImageIndex = 0;
  isLoading = true;
  error: string | null = null;

  constructor(private servicesService: ServicesService) {}

  ngOnInit(): void {
    this.loadServiceDetail();
  }

  loadServiceDetail(): void {
    this.isLoading = true;
    this.error = null;

    this.servicesService.getServiceDetailWithPhotos(this.servicioId).subscribe({
      next: (detalle) => {
        this.detalle = detalle;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar el detalle del servicio';
        this.isLoading = false;
        console.error('Error loading service detail:', err);
      }
    });
  }

  // Carrusel de imágenes
  get currentImage(): string {
    if (!this.detalle || this.detalle.fotos.length === 0) {
      return 'assets/placeholder-service.png';
    }
    return this.detalle.fotos[this.currentImageIndex].url;
  }

  get totalImages(): number {
    return this.detalle?.fotos.length || 0;
  }

  previousImage(): void {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    } else {
      this.currentImageIndex = this.totalImages - 1;
    }
  }

  nextImage(): void {
    if (this.currentImageIndex < this.totalImages - 1) {
      this.currentImageIndex++;
    } else {
      this.currentImageIndex = 0;
    }
  }

  goToImage(index: number): void {
    this.currentImageIndex = index;
  }

  onClose(): void {
    this.close.emit();
  }

  onContactar(): void {
    if (this.detalle) {
      this.contactar.emit(this.servicioId);
    }
  }

  onGuardar(): void {
    if (this.detalle) {
      this.guardar.emit(this.servicioId);
    }
  }

  // Prevenir cierre al hacer clic dentro del modal
  onModalContentClick(event: Event): void {
    event.stopPropagation();
  }

  // Generar estrellas para rating
  getStarStates(rating: number): ('full' | 'half' | 'empty')[] {
    const stars: ('full' | 'half' | 'empty')[] = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push('full');
      } else if (rating >= i - 0.5) {
        stars.push('half');
      } else {
        stars.push('empty');
      }
    }
    return stars;
  }

  starIcon(state: 'full' | 'half' | 'empty'): string {
    return state === 'full' ? '★' : state === 'half' ? '⯨' : '☆';
  }
}
