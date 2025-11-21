import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DenunciasService } from '../../../core/services/denuncias.service';
import { DenunciaCreateDTO } from '../../../core/models/denuncia-create.dto';

import { CalificacionesService } from '../../../core/services/calificaciones.service';
import { UsersService } from '../../../core/services/users.service'; 
import { CalificacionDTO } from '../../../core/models/calificacion.dto'; 
import { CalificacionUpdateDTO } from '../../../core/models/calificacion-update.dto'; 
import { UsuarioDetalleDTO } from '../../../core/models/usuario-detalle.dto'; 
import { SolicitudesService } from '../../../core/services/solicitudes.service';
import { SolicitudListadoDTO } from '../../../core/models/solicitud-listado.dto';

type TabKey = 'recibidas' | 'enviadas';

@Component({
  selector: 'app-calificaciones',
  standalone: true,                                   // ✅ Standalone para usar imports aquí mismo
  imports: [CommonModule, FormsModule],               // ✅ DatePipe, ngIf, ngFor, ngModel
  templateUrl: './calificaciones.component.html',
  styleUrl: './calificaciones.component.css'
})
export class CalificacionesComponent implements OnInit {

  // ===== inyección SIN constructor (respetando tu estilo)
  private readonly router = inject(Router);
  private readonly usersService = inject(UsersService);
  private readonly califsService = inject(CalificacionesService);
  private readonly solicitudesService = inject(SolicitudesService);
  private readonly denunciasService = inject(DenunciasService);

  // ===== estado básico
  activeTab: TabKey = 'recibidas';
  me: UsuarioDetalleDTO | null = null;
  myUserId: number | null = null;

  // Listas
  recibidas: CalificacionDTO[] = [];
  enviadas: CalificacionDTO[] = [];

  // Loading / error
  loadingRecibidas = false;
  loadingEnviadas = false;
  errorRecibidas: string | null = null;
  errorEnviadas: string | null = null;

  // ===== modal calificar/editar
  rateModalOpen = false;
  isEditing = false;
  editingId: number | null = null;

  rateForm = {
    idSolicitud: null as number | null,
    cantEstrellas: 0,
    comentario: '' as string | null
  };

  // ===== modal reportar (placeholder sin endpoint)
  reportModalOpen = false;
  reportForm = {
    motivo: '',
    detalle: ''
  };
  private reportTarget: CalificacionDTO | null = null;

  // ===== modal selección cliente/proveedor =====
  selectModalOpen = false;
  clientesOProveedores: { id: number; nombre: string }[] = [];
  selectLoading = false;
  selectError: string | null = null;
  selectedPersonId: number | null = null;
  selectedPersonName: string | null = null;

  // ===== ciclo de vida =====
  ngOnInit(): void {
    this.usersService.getMe().subscribe({
      next: (me) => {
        this.me = me;
        this.myUserId = me.idUsuario;
        this.refresh();
      },
      error: (err) => console.error('Error /Usuario/Me:', err)
    });
  }

  get isProveedor(): boolean {
    return this.me?.esProveedor === true;
  }
  get isCliente(): boolean {
    return this.me?.esCliente === true || this.me?.esProveedor === false;
  }
  get primaryCtaText(): string {
    // proveedor califica a clientes; cliente califica a proveedores
    return this.isProveedor ? 'Calificar un cliente' : 'Calificar un proveedor';
  }

  // ===== navegación / acciones header =====
  goHome(): void {
    this.router.navigate(['/menu']);
  }

  setActiveTab(tab: TabKey): void {
    this.activeTab = tab;
  }

  refresh(): void {
    if (!this.myUserId) return;

    // --- Recibidas ---
    this.loadingRecibidas = true;
    this.errorRecibidas = null;
    this.califsService.getReceived(this.myUserId).subscribe({
      next: (list) => (this.recibidas = list ?? []),
      error: (e) => {
        console.error('Error recibidas:', e);
        this.errorRecibidas = e?.message || 'No fue posible cargar reseñas recibidas';
        this.recibidas = [];
      }
    }).add(() => (this.loadingRecibidas = false));

    // --- Enviadas ---
    this.loadingEnviadas = true;
    this.errorEnviadas = null;
    this.califsService.getByAuthor(this.myUserId).subscribe({
      next: (list) => (this.enviadas = list ?? []),
      error: (e) => {
        console.error('Error enviadas:', e);
        this.errorEnviadas = e?.message || 'No fue posible cargar tus reseñas';
        this.enviadas = [];
      }
    }).add(() => (this.loadingEnviadas = false));
  }

  // ===== modal calificar / editar =====
  openRateModal(preserveSolicitud = false): void {
    this.isEditing = false;
    this.editingId = null;

    this.rateForm = {
      idSolicitud: preserveSolicitud ? this.rateForm.idSolicitud : null,
      cantEstrellas: 0,
      comentario: ''
    };

    this.rateModalOpen = true;
  }

  openSelectModal(): void {
    if (!this.myUserId) return;

    this.selectModalOpen = true;
    this.selectLoading = true;
    this.selectError = null;
    this.clientesOProveedores = [];

    // Trae en paralelo: todas mis solicitudes + mis calificaciones enviadas
    forkJoin({
      solicitudes: this.solicitudesService.obtenerTodas(),
      enviadas: this.califsService.getByAuthor(this.myUserId)
    }).subscribe({
      next: ({ solicitudes, enviadas }) => {
        // 1) Solo solicitudes FINALIZADAS donde YO participo
        const finalizadasMias = solicitudes.filter(s =>
          s.estado === 'Finalizado' &&
          (this.isProveedor ? s.idProveedor === this.myUserId : s.idUsuario === this.myUserId)
        );

        // 2) Mapa por idSolicitud para cruzar con calificaciones
        const byIdSolicitud = new Map(finalizadasMias.map(s => [s.idSolicitud, s]));

        // 3) Personas YA calificadas (a partir de mis calificaciones enviadas)
        const yaCalificadasIds = new Set<number>();
        for (const c of (enviadas ?? [])) {
          const sol = byIdSolicitud.get(c.idSolicitud);
          if (!sol) continue;
          const personaId = this.isProveedor ? sol.idUsuario : sol.idProveedor;
          yaCalificadasIds.add(personaId);
        }

        // 4) De finalizadas, dejar SOLO las NO calificadas
        const pendientes = finalizadasMias.filter(s => {
          const personaId = this.isProveedor ? s.idUsuario : s.idProveedor;
          return !yaCalificadasIds.has(personaId);
        });

        // 5) Convertir a {id, nombre} y quedarnos con únicos por persona
        const items = pendientes.map(s => ({
          id: this.isProveedor ? s.idUsuario : s.idProveedor,
          nombre: this.isProveedor ? s.clienteNombre : s.proveedorNombre
        }));

        const unicos = items.filter((item, idx, arr) =>
          idx === arr.findIndex(t => t.id === item.id)
        );

        this.clientesOProveedores = unicos;
      },
      error: (err) => {
        console.error('Error obteniendo datos para selector:', err);
        this.selectError = 'No se pudo obtener la lista de personas a calificar.';
      }
    }).add(() => {
      this.selectLoading = false;
    });
  }

  openEditModal(item: CalificacionDTO): void {
    this.isEditing = true;
    this.editingId = item.idValorizacion;
    this.rateForm = {
      idSolicitud: item.idSolicitud,
      cantEstrellas: item.cantEstrellas,
      comentario: item.comentario ?? ''
    };
    this.rateModalOpen = true;
  }

  closeRateModal(): void {
    this.rateModalOpen = false;
  }

  saveRate(): void {
    if (!this.myUserId) return;

    if (this.isEditing && this.editingId) {
      // --- Editar reseña ---
      const dto: CalificacionUpdateDTO = {
        cantEstrellas: this.rateForm.cantEstrellas,
        comentario: this.rateForm.comentario?.trim() || null
      };
      this.califsService.update(this.editingId, this.myUserId, dto).subscribe({
        next: () => {
          this.closeRateModal();
          this.refresh();
          this.activeTab = 'enviadas';
        },
        error: (e) => {
          console.error('Error actualizando reseña:', e);
          alert(e?.error || e?.message || 'No se pudo actualizar la reseña');
        }
      });
    } else {
      // --- Crear nueva reseña ---
      if (!this.rateForm.idSolicitud) {
        alert('Debes seleccionar la solicitud asociada.');
        return;
      }

      this.califsService.create({
        idUsuario: this.myUserId,
        idSolicitud: this.rateForm.idSolicitud,
        cantEstrellas: this.rateForm.cantEstrellas,
        comentario: this.rateForm.comentario?.trim() || null
      }).subscribe({
        next: () => {
          this.closeRateModal();
          this.refresh();
          this.activeTab = 'enviadas';
        },
        error: (e) => {
          console.error('Error creando reseña:', e);
          alert(e?.error || e?.message || 'No se pudo crear la reseña');
        }
      });
    }
  }

  // ===== modal reportar (placeholder) =====
  openReportModal(r: CalificacionDTO): void {
    this.reportTarget = r;
    this.reportForm = { motivo: '', detalle: '' };
    this.reportModalOpen = true;
  }

  closeReportModal(): void {
    this.reportModalOpen = false;
    this.reportTarget = null;
  }

  sendReport(): void {
    if (!this.myUserId) {
      alert('No se ha identificado el usuario actual.');
      return;
    }

    if (!this.reportTarget) {
      alert('No se ha seleccionado la reseña a reportar.');
      return;
    }

    if (!this.reportForm.motivo) {
      alert('Debes seleccionar un motivo.');
      return;
    }

    const detalle = this.reportForm.detalle?.trim();
    const motivoFinal = detalle
      ? `${this.reportForm.motivo} - ${detalle}`
      : this.reportForm.motivo;

    const dto: DenunciaCreateDTO = {
      idUsuario: this.myUserId,                      // quien reporta
      idSolicitud: null,                            // aquí es denuncia de reseña, no de solicitud
      idServicio: null,
      idValorizacion: this.reportTarget.idValorizacion,
      motivo: motivoFinal
    };

    this.denunciasService.crearDenuncia(dto).subscribe({
      next: () => {
        alert('Tu reporte ha sido enviado. Gracias por ayudarnos a mantener la comunidad segura.');
        this.closeReportModal();
      },
      error: (e) => {
        console.error('Error enviando denuncia:', e);
        alert(e?.error || e?.message || 'No se pudo enviar el reporte. Intenta nuevamente.');
      }
    });
  }


  // ===== helpers =====
  renderStars(n: number): string {
    const s = Math.max(0, Math.min(5, Math.round(n)));
    return '★'.repeat(s) + '☆'.repeat(5 - s);
  }

  selectPerson(person: { id: number; nombre: string }): void {
    this.selectModalOpen = false;

    this.selectedPersonId = person.id;
    this.selectedPersonName = person.nombre;

    this.solicitudesService.obtenerTodas().subscribe({
      next: (solicitudes) => {
        const finalizadas = solicitudes.filter(s => s.estado === 'Finalizado');

        // (opcional) Aseguramos que la solicitud es mía:
        const mias = this.isProveedor
          ? finalizadas.filter(s => s.idProveedor === this.myUserId)
          : finalizadas.filter(s => s.idUsuario === this.myUserId);

        const match = this.isProveedor
          ? mias.find(s => s.idUsuario   === person.id)   // proveedor -> cliente
          : mias.find(s => s.idProveedor === person.id);  // cliente   -> proveedor

        if (!match) {
          alert('No se encontró una solicitud finalizada con esta persona.');
          return;
        }

        // Guardamos la solicitud y abrimos el modal preservándola
        this.rateForm.idSolicitud = match.idSolicitud;
        this.openRateModal(true);   // 👈 preserva idSolicitud
      },
      error: (e) => {
        console.error('Error buscando solicitud:', e);
        alert('No se pudo preparar la calificación.');
      }
    });
  }

}
