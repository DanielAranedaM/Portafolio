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

  // Modal "¿Desea evaluar el servicio?"
  modalEvaluacionAbierto = false;
  solicitudEnEvaluacion: SolicitudListadoDTO | null = null;
  // 'completar' -> cliente; 'finalizar' -> proveedor
  tipoAccionEvaluacion: 'completar' | 'finalizar' | null = null;

  // Refrescar vista
  isRefreshing = false;
  lastUpdated: Date | null = null;

  // Filtros
  filtroEstado: string = 'Todos';

  // VARIABLES PARA EL MODAL DE CANCELACIÓN
  modalCancelarAbierto = false;
  solicitudACancelar: SolicitudListadoDTO | null = null;
  mensajeErrorCancelar: string = '';

  constructor(
    private router: Router,
    private solicitudesService: SolicitudesService,
    private usersService: UsersService
  ) {}

  ngOnInit(): void {
    this.cargarUsuarioYDatos();
  }

  // Navegar a inicio
  routeMenu() {
    this.router.navigate(['/menu']);
  }

  abrirModalCancelar(s: SolicitudListadoDTO): void {
      this.solicitudACancelar = s;
      this.mensajeErrorCancelar = ''; // Limpiar errores previos
      this.modalCancelarAbierto = true;
  }

  cerrarModalCancelar(): void {
    this.modalCancelarAbierto = false;
    this.solicitudACancelar = null;
  }

  confirmarCancelacion(): void {
    if (!this.solicitudACancelar) return;

    const id = this.solicitudACancelar.idSolicitud;

    this.solicitudesService.cancelarSolicitud(id).subscribe({
      next: () => {
        // Éxito: Cerramos modal y recargamos lista
        this.cerrarModalCancelar();
        this.cargarSolicitudes(); 
      },
      error: (err) => {
        // En lugar de alert, mostramos el error en el modal
        this.mensajeErrorCancelar = 'No se pudo cancelar. Verifica que no esté finalizada o intenta nuevamente.';
      }
    });
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

        this.mostrarColumnaAcciones = this.solicitudes.some(s =>
          (this.isCliente && s.estado === 'Agendado') ||
          (this.isProveedor && (s.estado === 'Completado' || s.estado === 'Finalizado'))
        );

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
    this.cargarSolicitudes();
  }

  setFiltro(estado: string): void {
    this.filtroEstado = estado;
  }

  get solicitudesFiltradas(): SolicitudListadoDTO[] {
    if (this.filtroEstado === 'Todos') {
      return this.solicitudes;
    }
    return this.solicitudes.filter(s => s.estado === this.filtroEstado);
  }

  // ====== FLUJO CLIENTE (Completar) ======

  onClickCompletar(s: SolicitudListadoDTO): void {
    this.solicitudEnEvaluacion = s;
    this.tipoAccionEvaluacion = 'completar';
    this.modalEvaluacionAbierto = true;
  }

  // ====== FLUJO PROVEEDOR (Finalizar) ======

  onClickFinalizar(s: SolicitudListadoDTO): void {
    this.abrirModalFinalizar(s); 
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

    // guardamos una copia para usarla después de cerrar el modal
    const solicitudFinalizada = this.solicitudSeleccionada;

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

        //recién finalizado, mostramos el modal de "¿Desea evaluar?"
        if (solicitudFinalizada) {
          this.solicitudEnEvaluacion = solicitudFinalizada;
          this.tipoAccionEvaluacion = 'finalizar';
          this.modalEvaluacionAbierto = true;
        }
      },
      error: (err) => console.error('Error al finalizar:', err)
    });
  }

  // ====== MODAL "¿Desea evaluar el servicio?" ======

  // Botón "Ir a evaluar ahora"
  irAEvaluacion(): void {
    if (!this.solicitudEnEvaluacion) return;

    // Si es cliente, aún falta marcar como completado
    if (this.tipoAccionEvaluacion === 'completar') {
      this.completar(this.solicitudEnEvaluacion, true); // sin confirm()
    }

    this.modalEvaluacionAbierto = false;
    this.limpiarEvaluacion();

    // Llevar a la página de calificaciones 
    this.router.navigate(['/calificaciones']);
  }

  // Botón "Más tarde"
  posponerEvaluacion(): void {
    if (this.solicitudEnEvaluacion && this.tipoAccionEvaluacion === 'completar') {
      this.completar(this.solicitudEnEvaluacion, true);
    }

    this.modalEvaluacionAbierto = false;
    this.limpiarEvaluacion();
  }

  private limpiarEvaluacion(): void {
    this.solicitudEnEvaluacion = null;
    this.tipoAccionEvaluacion = null;
  }

  // ====== Acciones base ======

  /**
   * Completar solicitud.
   * @param s solicitud
   * @param saltarConfirmacion si es true NO muestra window.confirm
   */
  completar(s: SolicitudListadoDTO, saltarConfirmacion: boolean = false): void {
    if (!saltarConfirmacion) {
      if (!confirm(`¿Confirmas que el servicio N°${s.idSolicitud} fue completado?`)) {
        return;
      }
    }

    this.solicitudesService.marcarCompletada(s.idSolicitud).subscribe({
      next: () => {
        alert('Solicitud marcada como completada.');
        this.cargarSolicitudes();
      },
      error: (err) => console.error('Error completando solicitud:', err)
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

  // ====== Helpers ======

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

    this.summary.total       = arr.length;
    this.summary.agendados   = arr.filter(s => s.estado === 'Agendado').length;
    this.summary.completados = arr.filter(s => s.estado === 'Completado').length;
    this.summary.finalizados = arr.filter(s => s.estado === 'Finalizado').length;
  }

  cancelar(s: SolicitudListadoDTO): void {
    // 1. Confirmación de seguridad
    if (!confirm(`¿Estás seguro de que deseas cancelar la solicitud N°${s.idSolicitud}? Esta acción no se puede deshacer.`)) {
      return;
    }

    // 2. Llamada al servicio
    this.solicitudesService.cancelarSolicitud(s.idSolicitud).subscribe({
      next: () => {
        alert('La solicitud ha sido cancelada exitosamente.');
        this.cargarSolicitudes(); 
      },
      error: (err) => {
        console.error('Error al cancelar:', err);
        alert('No se pudo cancelar la solicitud. Verifica que no esté ya finalizada.');
      }
    });
  }
}
