import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ServicesService } from '../../core/services/services.service';
import { ServicioDTO } from '../../core/models/servicio.dto';
import { ServicioDetalleModalComponent } from '../../components/servicio-detalle-modal/servicio-detalle-modal.component';
import { UsersService } from '../../core/services/users.service';
import { SolicitudesService } from '../../core/services/solicitudes.service';
import { UsuarioDetalleDTO } from '../../core/models/usuario-detalle.dto';
import { SolicitudCreateDTO } from '../../core/models/solicitud-create.dto';
import { ServicioDetalleDTO } from '../../core/models/servicio-detalle.dto';

@Component({
  selector: 'app-servicios-guardados',
  standalone: true,
  imports: [CommonModule, ServicioDetalleModalComponent],
  templateUrl: './servicios-guardados.component.html',
  styleUrls: ['./servicios-guardados.component.css']
})
export class ServiciosGuardadosComponent implements OnInit {
  servicios: ServicioDTO[] = [];
  loading = true;
  error: string | null = null;
  me: UsuarioDetalleDTO | null = null;

  // Modal de detalle
  selectedServiceId: number | null = null;
  showDetailModal = false;

  // Modales personalizados
  confirmModalOpen = false;
  serviceToRemove: ServicioDTO | null = null;
  
  notificationModalOpen = false;
  notificationMessage = '';
  notificationType: 'success' | 'error' = 'success';

  constructor(
    private servicesService: ServicesService,
    private usersService: UsersService,
    private solicitudesService: SolicitudesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMe();
    this.loadServiciosGuardados();
  }

  loadMe(): void {
    this.usersService.getMe().subscribe({
      next: (user) => this.me = user,
      error: (err) => console.error('Error cargando usuario:', err)
    });
  }

  loadServiciosGuardados(): void {
    this.loading = true;
    this.servicesService.getServiciosGuardados().subscribe({
      next: (data) => {
        this.servicios = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando servicios guardados:', err);
        this.error = 'No se pudieron cargar tus servicios guardados.';
        this.loading = false;
      }
    });
  }

  quitarServicio(servicio: ServicioDTO): void {
    this.serviceToRemove = servicio;
    this.confirmModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  confirmRemove(): void {
    if (!this.serviceToRemove) return;
    
    const servicio = this.serviceToRemove;
    this.closeConfirmModal();

    this.servicesService.quitarServicioGuardado(servicio.idServicio).subscribe({
      next: () => {
        this.servicios = this.servicios.filter(s => s.idServicio !== servicio.idServicio);
        this.showNotification('Servicio eliminado de tus guardados.', 'success');
      },
      error: (err) => {
        console.error('Error al quitar servicio:', err);
        this.showNotification('Hubo un error al quitar el servicio.', 'error');
      }
    });
  }

  closeConfirmModal(): void {
    this.confirmModalOpen = false;
    this.serviceToRemove = null;
    document.body.style.overflow = 'auto';
  }

  showNotification(message: string, type: 'success' | 'error'): void {
    this.notificationMessage = message;
    this.notificationType = type;
    this.notificationModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeNotification(): void {
    this.notificationModalOpen = false;
    document.body.style.overflow = 'auto';
  }

  contactarProveedor(servicio: ServicioDTO): void {
    const phone = servicio.telefonoProveedor || '+56912345678'; 
    const message = encodeURIComponent(`Hola, me interesa tu servicio: ${servicio.titulo}`);
    window.open(`https://wa.me/${phone.replace(/\s/g, '')}?text=${message}`, '_blank');
  }

  verDetalle(servicio: ServicioDTO): void {
    this.selectedServiceId = servicio.idServicio;
    this.showDetailModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedServiceId = null;
    document.body.style.overflow = 'auto';
  }

  handleContactar(servicioId: number): void {
    this.closeDetailModal();
  }

  handleGuardar(servicioId: number): void {
    this.closeDetailModal();
  }

  handleSolicitar(detalle: ServicioDetalleDTO): void {
    if (!this.me) {
      this.showNotification('Debes iniciar sesión para solicitar servicios.', 'error');
      return;
    }

    const dto: SolicitudCreateDTO = {
      idUsuario: this.me.idUsuario,
      idProveedor: detalle.proveedorId,
      idServicio: detalle.idServicio,
      fechaAgendamiento: this.getLocalISOString()
    };

    this.solicitudesService.crear(dto).subscribe({
      next: () => {
        this.showNotification('Solicitud creada exitosamente.', 'success');
        this.closeDetailModal();
        setTimeout(() => {
          this.router.navigate(['/historial-solicitud']);
        }, 1500);
      },
      error: (err) => {
        console.error('Error creando solicitud:', err);
        this.showNotification('No se pudo crear la solicitud.', 'error');
      }
    });
  }

  private getLocalISOString(): string {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60000;
    const localTime = new Date(now.getTime() - offsetMs);
    return localTime.toISOString().slice(0, -1);
  }

  volverAlMenu(): void {
    this.router.navigate(['/menu']);
  }

  getProviderInitials(name: string | undefined): string {
    if (!name) return 'PR';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.style.display = 'none';
  }
}
