import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SolicitudesService } from '../../../core/services/solicitudes.service'; 
import { UsersService } from '../../../core/services/users.service';
import { FormsModule } from '@angular/forms';
import { SolicitudListadoDTO } from '../../../core/models/solicitud-listado.dto';
import { SolicitudFinalizarDTO } from '../../../core/models/solicitud-finalizar.dto';
import { Router } from '@angular/router';

@Component({
  selector: 'app-historial-solicitud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historial-solicitud.component.html',
  styleUrls: ['./historial-solicitud.component.css']
})
export class HistorialSolicitudComponent implements OnInit {
  summary = {
    total: 0,
    agendados: 0,
    completados: 0,
    finalizados: 0
  };

  solicitudes: SolicitudListadoDTO[] = [];
  dataLoaded = false;
  isCliente = false;
  isProveedor = false;

  // Modal de finalización
  modalAbierto = false;
  solicitudSeleccionada: SolicitudListadoDTO | null = null;
  precioCobrado: number | null = null;
  medioPago: string = '';
  notas: string = '';
  mostrarColumnaAcciones: boolean = false;

  // Modal de detalle
  modalDetalleAbierto = false;
  detalleSeleccionado: SolicitudListadoDTO | null = null;

  // Refrescar vista
  isRefreshing = false;
  lastUpdated: Date | null = null;

  constructor(
    private router: Router,
    private solicitudesService: SolicitudesService,
    private usersService: UsersService
  ) {}

  ngOnInit(): void {
    this.cargarUsuarioYDatos();
  }
  //Navegar a inicio
  routeMenu() {
    this.router.navigate(['/menu']);
  }

  private cargarUsuarioYDatos(): void {
    this.usersService.getMe().subscribe({
      next: me => {
        this.isCliente = !!me.esCliente && !me.esProveedor;
        this.isProveedor = !!me.esProveedor;
        this.cargarSolicitudes();
      },
      error: err => {
        console.error('Error al cargar usuario:', err);
        this.dataLoaded = true;
      }
    });
  }

  private cargarSolicitudes(): void {
    this.isRefreshing = true;

    this.solicitudesService.obtenerTodas().subscribe({
      next: (data) => {
        this.solicitudes = data.sort((a, b) => b.idSolicitud - a.idSolicitud);

        // acciones visibles (si ya lo tienes)
        this.mostrarColumnaAcciones = this.solicitudes.some(s =>
          (this.isCliente && s.estado === 'Agendado') ||
          (this.isProveedor && (s.estado === 'Completado' || s.estado === 'Finalizado'))
        );

        // 👇 recálculo del resumen
        this.recomputeSummary();

        this.dataLoaded = true;
      },
      error: (err) => {
        console.error('Error cargando solicitudes:', err);
        this.dataLoaded = true;
      }
    }).add(() => {
      this.isRefreshing = false;
      this.lastUpdated = new Date();
    });
  }

  refresh(): void {
    // fuerza recarga desde el servidor
    this.cargarSolicitudes();
  }
  // === Acciones ===

  completar(s: SolicitudListadoDTO): void {
    if (!confirm(`¿Confirmas que el servicio N°${s.idSolicitud} fue completado?`)) return;
    this.solicitudesService.marcarCompletada(s.idSolicitud).subscribe({
      next: () => {
        alert('Solicitud marcada como completada.');
        this.cargarSolicitudes();
      },
      error: (err) => console.error('Error completando solicitud:', err)
    });
  }

  abrirModalFinalizar(s: SolicitudListadoDTO): void {
    this.solicitudSeleccionada = s;
    this.precioCobrado = null;
    this.medioPago = '';
    this.notas = '';
    this.modalAbierto = true;
  }

  cerrarModalFinalizar(): void {
    this.modalAbierto = false;
    this.solicitudSeleccionada = null;
  }

  guardarFinalizacion(): void {
    if (!this.solicitudSeleccionada) return;

    if (!this.precioCobrado || !this.medioPago.trim()) {
      alert('Debes ingresar precio cobrado y medio de pago.');
      return;
    }

    const dto: SolicitudFinalizarDTO = {
      precioAcordado: this.precioCobrado,
      medioDePago: this.medioPago,
      notas: this.notas?.trim() || undefined
    };

    this.solicitudesService.finalizar(this.solicitudSeleccionada.idSolicitud, dto).subscribe({
      next: () => {
        alert('Solicitud finalizada correctamente.');
        this.cerrarModalFinalizar();
        this.cargarSolicitudes();
      },
      error: (err) => console.error('Error al finalizar:', err)
    });
  }

  abrirModalDetalle(s: SolicitudListadoDTO): void {
    this.detalleSeleccionado = s;
    this.modalDetalleAbierto = true;
  }

  cerrarModalDetalle(): void {
    this.modalDetalleAbierto = false;
    this.detalleSeleccionado = null;
  }

  // === Helpers ===

  formatoFecha(f: string | null): string {
    if (!f) return '—';
    const d = new Date(f);
    return d.toLocaleString('es-CL');
  }

  formatoPrecio(p: number | null): string {
    return p != null ? `$ ${p.toLocaleString('es-CL')}` : '—';
  }

  private recomputeSummary(): void {
    const arr = this.solicitudes || [];

    this.summary.total        = arr.length;
    this.summary.agendados    = arr.filter(s => s.estado === 'Agendado').length;
    this.summary.completados  = arr.filter(s => s.estado === 'Completado').length;
    this.summary.finalizados  = arr.filter(s => s.estado === 'Finalizado').length;
  }

}
