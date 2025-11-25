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
  
  // OPCIÓN A: Datos directos (Lo que usa Denuncias)
  // Al agregar esto, el error "Can't bind to servicio" desaparecerá
  @Input() servicio: ServicioDetalleDTO | null = null; 

  // OPCIÓN B: ID (Lo que usa el Menú/Otros)
  // Lo mantenemos para NO romper el código antiguo
  @Input() servicioId: number | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() contactar = new EventEmitter<number>();
  @Output() guardar = new EventEmitter<number>();
  @Output() solicitar = new EventEmitter<ServicioDetalleDTO>();

  detalle: ServicioDetalleDTO | null = null;
  currentImageIndex = 0;
  isLoading = true;
  error: string | null = null;

  constructor(private servicesService: ServicesService) {}

  ngOnInit(): void {
    // LÓGICA INTELIGENTE:
    
    // CASO 1: Denuncias (Ya tenemos los datos, no llamamos a la API)
    if (this.servicio) {
      this.detalle = this.servicio;
      this.isLoading = false;
    } 
    // CASO 2: Menú (Solo tenemos ID, llamamos a la API como siempre)
    else if (this.servicioId) {
      this.loadServiceDetail();
    }
    // CASO 3: Error
    else {
      this.error = "No se proporcionó información del servicio.";
      this.isLoading = false;
    }
  }

  // Esta función se usa solo cuando viene del Menú
  loadServiceDetail(): void {
    if (!this.servicioId) return;

    this.isLoading = true;
    this.error = null;

    this.servicesService.getServiceDetailWithPhotos(this.servicioId).subscribe({
      next: (detalle) => {
        this.detalle = detalle;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error cargando servicio', err);
        this.error = 'No se pudo cargar la información del servicio.';
        this.isLoading = false;
      }
    });
  }

  // --- Getters y Helpers Visuales ---

  get currentImageUrl(): string {
    if (!this.detalle || !this.detalle.fotos || this.detalle.fotos.length === 0) {
      // Retorna una imagen por defecto o vacía si no hay fotos
      return 'assets/images/no-image.png'; 
    }
    return this.detalle.fotos[this.currentImageIndex].url;
  }

  get totalImages(): number {
    return this.detalle?.fotos?.length || 0;
  }

  previousImage(): void {
    if (this.totalImages === 0) return;
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    } else {
      this.currentImageIndex = this.totalImages - 1;
    }
  }

  nextImage(): void {
    if (this.totalImages === 0) return;
    if (this.currentImageIndex < this.totalImages - 1) {
      this.currentImageIndex++;
    } else {
      this.currentImageIndex = 0;
    }
  }

  goToImage(index: number): void {
    this.currentImageIndex = index;
  }

  // --- Acciones ---

  onClose(): void {
    this.close.emit();
  }

  onContactar(): void {
    if (this.detalle) {
      // Usamos el ID del detalle cargado (funciona para ambos casos)
      this.contactar.emit(this.detalle.idServicio);
    }
  }

  onGuardar(): void {
    if (this.detalle) {
      this.guardar.emit(this.detalle.idServicio);
    }
  }

  onSolicitar(): void {
    if (this.detalle) {
      this.solicitar.emit(this.detalle);
    }
  }

  onWhatsApp(): void {
    if (this.detalle) {
      let phone = this.detalle.proveedorTelefono;

      // Si no hay teléfono, usar uno de respaldo o mostrar error
      if (!phone) {
        console.warn('El proveedor no tiene teléfono registrado. Usando número de prueba.');
        phone = '+56912345678';
      }

      // Limpieza del número para la API de WhatsApp
      // 1. Eliminar caracteres no numéricos excepto el +
      let cleanPhone = phone.replace(/[^0-9+]/g, '');

      // 2. Si no tiene código de país (no empieza con +), asumir Chile (56) si parece un número local
      if (!cleanPhone.startsWith('+')) {
        // Si tiene 9 dígitos (ej: 912345678), agregar 56
        if (cleanPhone.length === 9) {
          cleanPhone = '56' + cleanPhone;
        }
      }

      // 3. Eliminar el + final para la URL (wa.me prefiere números puros)
      cleanPhone = cleanPhone.replace('+', '');

      console.log('Redirigiendo a WhatsApp:', cleanPhone);

      const message = encodeURIComponent(`Hola, me interesa tu servicio: ${this.detalle.titulo}`);
      const url = `https://wa.me/${cleanPhone}?text=${message}`;
      
      window.open(url, '_blank');
    }
  }

  onModalContentClick(event: Event): void {
    event.stopPropagation();
  }

  getStarStates(rating: number): ('full' | 'half' | 'empty')[] {
    const stars: ('full' | 'half' | 'empty')[] = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) stars.push('full');
      else if (rating >= i - 0.5) stars.push('half');
      else stars.push('empty');
    }
    return stars;
  }

  starIcon(state: 'full' | 'half' | 'empty'): string {
    switch (state) {
      case 'full': return '★';
      case 'half': return '✫';
      case 'empty': return '☆';
    }
  }
}