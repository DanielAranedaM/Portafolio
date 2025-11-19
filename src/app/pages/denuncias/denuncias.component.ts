import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  DenunciasService,
  DenunciaResenaAdminDTO,
  DenunciaServicioAdminDTO
} from '../../core/services/denuncias.service';

type TabKey = 'resenas' | 'servicios';

@Component({
  selector: 'app-denuncias',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './denuncias.component.html',
  styleUrl: './denuncias.component.css'
})
export class DenunciasComponent implements OnInit {

  private readonly denunciasService = inject(DenunciasService);

  activeTab: TabKey = 'resenas';

  // antes: denunciasSolicitudes...
  denunciasResenas: DenunciaResenaAdminDTO[] = [];
  denunciasServicios: DenunciaServicioAdminDTO[] = [];

  // loading / error
  loadingResenas = false;
  loadingServicios = false;

  errorResenas: string | null = null;
  errorServicios: string | null = null;
  // ===== ciclo de vida =====
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

  // ===== carga de datos =====

  private cargarDenunciasResenas(): void {
    this.loadingResenas = true;
    this.errorResenas = null;

    this.denunciasService.getDenunciasResenas().subscribe({
      next: (list) => {
        this.denunciasResenas = list ?? [];
      },
      error: (err) => {
        console.error('Error cargando denuncias de reseñas:', err);
        this.errorResenas = err?.error || err?.message || 'No fue posible cargar las denuncias sobre reseñas.';
        this.denunciasResenas = [];
      }
    }).add(() => {
      this.loadingResenas = false;
    });
  }

  private cargarDenunciasServicios(): void {
    this.loadingServicios = true;
    this.errorServicios = null;

    this.denunciasService.getDenunciasServicios().subscribe({
      next: (list) => {
        this.denunciasServicios = list ?? [];
      },
      error: (err) => {
        console.error('Error cargando denuncias de servicios:', err);
        this.errorServicios = err?.error || err?.message || 'No fue posible cargar las denuncias sobre servicios.';
        this.denunciasServicios = [];
      }
    }).add(() => {
      this.loadingServicios = false;
    });
  }

  // ===== acciones (a implementar después) =====

  verDetalleResena(d: DenunciaResenaAdminDTO): void {
    console.log('verDetalleResena()', d);
    // Aquí después puedes abrir un modal con la reseña original,
    // la solicitud, etc.
  }

  verDetalleServicio(d: DenunciaServicioAdminDTO): void {
    console.log('Ver detalle servicio denunciado', d);
  }

  eliminarResena(d: DenunciaResenaAdminDTO): void {
    console.log('eliminarResena() pendiente de implementar', d);
    // Aquí luego llamaremos a un endpoint para eliminar la reseña denunciada.
  }
    
  accionSobreServicio(d: DenunciaServicioAdminDTO): void {
    console.log('Acción sobre servicio denunciado', d);
  }

  marcarResuelta(d: DenunciaResenaAdminDTO | DenunciaServicioAdminDTO): void {
    console.log('Marcar denuncia como resuelta (pendiente)', d);
  }
}
