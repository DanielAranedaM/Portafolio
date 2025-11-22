import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

// 1. IMPORTAR EL MODAL Y LOS SERVICIOS
import { ServicioDetalleModalComponent } from '../../components/servicio-detalle-modal/servicio-detalle-modal.component';
import { ServicesService } from '../../core/services/services.service';
import { ServicioDetalleDTO } from '../../core/models/servicio-detalle.dto'; 

import {
  DenunciasService,
  DenunciaResenaAdminDTO,
  DenunciaServicioAdminDTO
} from '../../core/services/denuncias.service';

type TabKey = 'resenas' | 'servicios';

@Component({
  selector: 'app-denuncias',
  standalone: true,
  imports: [CommonModule, ServicioDetalleModalComponent],
  templateUrl: './denuncias.component.html',
  styleUrl: './denuncias.component.css'
})
export class DenunciasComponent implements OnInit {

  private readonly denunciasService = inject(DenunciasService);
  // 3. INYECTAR EL SERVICES SERVICE
  private readonly servicesService = inject(ServicesService);

  activeTab: TabKey = 'resenas';

  denunciasResenas: DenunciaResenaAdminDTO[] = [];
  denunciasServicios: DenunciaServicioAdminDTO[] = [];

  loadingResenas = false;
  loadingServicios = false;

  errorResenas: string | null = null;
  errorServicios: string | null = null;

  // 4. VARIABLE PARA EL MODAL
  selectedService: ServicioDetalleDTO | null = null;

  ngOnInit(): void {
    this.refresh();
  }

  setActiveTab(tab: TabKey): void {
    this.activeTab = tab;
  }

  refresh(): void {
    this.cargarDenunciasResenas();
    this.cargarDenunciasServicios();
  }

  private cargarDenunciasResenas(): void {
    this.loadingResenas = true;
    this.errorResenas = null;
    this.denunciasService.getDenunciasResenas().subscribe({
      next: (list) => { this.denunciasResenas = list ?? []; },
      error: (err) => { 
        console.error(err);
        this.errorResenas = 'Error cargando reseñas'; 
      },
    }).add(() => this.loadingResenas = false);
  }

  private cargarDenunciasServicios(): void {
    this.loadingServicios = true;
    this.errorServicios = null;
    this.denunciasService.getDenunciasServicios().subscribe({
      next: (list) => { this.denunciasServicios = list ?? []; },
      error: (err) => { 
        console.error(err);
        this.errorServicios = 'Error cargando servicios'; 
      }
    }).add(() => this.loadingServicios = false);
  }

  // --- ACCIONES ---

  eliminarResena(dto: any) {
    if (!confirm('¿Estás seguro de eliminar esta reseña permanentemente?')) return;
    this.loadingResenas = true;
    this.denunciasService.deleteResena(dto.idValorizacion).subscribe({
      next: () => { alert('Reseña eliminada'); this.refresh(); },
      error: () => { this.errorResenas = 'Error al eliminar reseña'; this.loadingResenas = false; }
    });
  }

  accionSobreServicio(dto: any) {
    if (!confirm(`¿Eliminar servicio "${dto.servicioTitulo}"?`)) return;
    this.loadingServicios = true;
    this.denunciasService.deleteServicio(dto.idServicio).subscribe({
      next: () => { alert('Servicio eliminado'); this.refresh(); },
      error: () => { this.errorServicios = 'Error al eliminar servicio'; this.loadingServicios = false; }
    });
  }

  marcarResuelta(dto: { idDenuncia: number }) {
    if (!confirm('¿Marcar como resuelta? (No borra contenido)')) return;
    
    if (this.activeTab === 'resenas') this.loadingResenas = true;
    else this.loadingServicios = true;

    this.denunciasService.deleteDenuncia(dto.idDenuncia).subscribe({
      next: () => this.refresh(),
      error: () => {
        if (this.activeTab === 'resenas') { this.errorResenas = 'Error'; this.loadingResenas = false; }
        else { this.errorServicios = 'Error'; this.loadingServicios = false; }
      }
    });
  }

  // 5. MÉTODO CORREGIDO: USA EL NOMBRE EXACTO DE TU ARCHIVO SERVICE
  verDetalleServicio(d: DenunciaServicioAdminDTO): void {
    this.loadingServicios = true;
    
    // Usamos 'getServiceDetailWithPhotos' (sin Async) tal como está en tu archivo services.service.ts
    this.servicesService.getServiceDetailWithPhotos(d.idServicio).subscribe({
      next: (detalle) => {
        if (detalle) {
          this.selectedService = detalle; // Abre el modal
        } else {
          alert('No se encontraron detalles adicionales.');
        }
        this.loadingServicios = false;
      },
      error: (err) => {
        console.error('Error al obtener detalle', err);
        alert('No se pudo cargar el detalle del servicio.');
        this.loadingServicios = false;
      }
    });
  }

  // Cerrar modal
  closeServiceModal(): void {
    this.selectedService = null;
  }
}