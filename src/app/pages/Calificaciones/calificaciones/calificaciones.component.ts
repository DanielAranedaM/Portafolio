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
import { ToastService } from '../../../core/services/toast.service';

type TabKey = 'recibidas' | 'enviadas';

@Component({
  selector: 'app-calificaciones',
  standalone: true,                                   
  imports: [CommonModule, FormsModule],             
  templateUrl: './calificaciones.component.html',
  styleUrl: './calificaciones.component.css'
})
export class CalificacionesComponent implements OnInit {

  private readonly router = inject(Router);
  private readonly usersService = inject(UsersService);
  private readonly califsService = inject(CalificacionesService);
  private readonly solicitudesService = inject(SolicitudesService);
  private readonly denunciasService = inject(DenunciasService);
  private readonly toastService = inject(ToastService);

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

  rateModalOpen = false;
  isEditing = false;
  editingId: number | null = null;

  rateForm = {
    idSolicitud: null as number | null,
    cantEstrellas: 0,
    comentario: '' as string | null
  };

  reportModalOpen = false;
  reportForm = {
    motivo: '',
    detalle: ''
  };
  private reportTarget: CalificacionDTO | null = null;

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

  goHome(): void {
    this.router.navigate(['/menu']);
  }

  setActiveTab(tab: TabKey): void {
    this.activeTab = tab;
  }

  refresh(): void {
    if (!this.myUserId) return;

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
    this.selectModalOpen = true; 

    // Usamos forkJoin para cargar solicitudes y mis calificaciones enviadas
    forkJoin({
      solicitudes: this.solicitudesService.obtenerTodas(),
      enviadas: this.califsService.getMineAuthored() 
    }).subscribe({
      next: ({ solicitudes, enviadas }) => {

        // 1) Filtrar solicitudes candidatas
        const solicitudesCandidatas = solicitudes.filter(s => {
          // A) Verifico que la solicitud me pertenezca
          const soyParte = this.isProveedor 
            ? s.idProveedor === this.myUserId 
            : s.idUsuario === this.myUserId;
          
          if (!soyParte) return false;

          // B) Lógica de Estados:
          if (this.isProveedor) {
            // El proveedor espera a 'Finalizado'
            return s.estado === 'Finalizado';
          } else {
            // El cliente puede calificar en 'Completado' o 'Finalizado'
            return s.estado === 'Finalizado' || s.estado === 'Completado';
          }
        });

        // 2) Identificar a quién ya califiqué
        const byIdSolicitud = new Map(solicitudesCandidatas.map(s => [s.idSolicitud, s]));
        const yaCalificadasIds = new Set<number>();
        
        for (const c of (enviadas ?? [])) {
          const sol = byIdSolicitud.get(c.idSolicitud); 
          if (!sol) continue; 

          // Si soy proveedor, califiqué al idUsuario. Si soy cliente, al idProveedor.
          const personaId = this.isProveedor ? sol.idUsuario : sol.idProveedor;
          yaCalificadasIds.add(personaId);
        }

        // 3) Filtrar pendientes
        const pendientes = solicitudesCandidatas.filter(s => {
          const personaId = this.isProveedor ? s.idUsuario : s.idProveedor;
          return !yaCalificadasIds.has(personaId);
        });

        // 4) Mapear para visualización
        const items = pendientes.map(s => ({
          id: this.isProveedor ? s.idUsuario : s.idProveedor,
          nombre: this.isProveedor ? s.clienteNombre : s.proveedorNombre
        }));

        // 5) Quitar duplicados visuales
        const unicos = items.filter((item, idx, arr) => 
          idx === arr.findIndex(t => t.id === item.id)
        );

        this.clientesOProveedores = unicos;
      },
      error: (e) => {
        console.error('Error cargando listas para modal:', e);
        this.toastService.show('No se pudieron cargar los usuarios pendientes.', 'error');
        this.selectModalOpen = false;
      }
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
          this.toastService.show(e?.error || e?.message || 'No se pudo actualizar la reseña', 'error');
        }
      });
    } else {
      // --- Crear nueva reseña ---
      if (!this.rateForm.idSolicitud) {
        this.toastService.show('Debes seleccionar la solicitud asociada.', 'warning');
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
          this.toastService.show(e?.error || e?.message || 'No se pudo crear la reseña', 'error');
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
      this.toastService.show('No se ha identificado el usuario actual.', 'error');
      return;
    }

    if (!this.reportTarget) {
      this.toastService.show('No se ha seleccionado la reseña a reportar.', 'error');
      return;
    }

    if (!this.reportForm.motivo) {
      this.toastService.show('Debes seleccionar un motivo.', 'warning');
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
        this.toastService.show('Tu reporte ha sido enviado. Gracias por ayudarnos a mantener la comunidad segura.', 'success');
        this.closeReportModal();
      },
      error: (e) => {
        console.error('Error enviando denuncia:', e);
        this.toastService.show(e?.error || e?.message || 'No se pudo enviar el reporte. Intenta nuevamente.', 'error');
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

      // Guardamos temporalmente a quién vamos a calificar
      this.selectedPersonId = person.id;
      this.selectedPersonName = person.nombre;

      // Buscamos de nuevo las solicitudes para obtener el ID exacto de la Solicitud
      this.solicitudesService.obtenerTodas().subscribe({
        next: (solicitudes) => {
          
          // 1. Aplicamos el mismo filtro de estados
          const candidatas = solicitudes.filter(s => {
            if (this.isProveedor) {
              return s.estado === 'Finalizado';
            } else {
              return s.estado === 'Finalizado' || s.estado === 'Completado';
            }
          });

          // 2. Filtramos solo las mías
          const mias = this.isProveedor
            ? candidatas.filter(s => s.idProveedor === this.myUserId)
            : candidatas.filter(s => s.idUsuario === this.myUserId);

          // 3. Buscamos la coincidencia con la persona seleccionada
          const match = this.isProveedor
            ? mias.find(s => s.idUsuario   === person.id)   // Soy Proveedor -> busco al Cliente
            : mias.find(s => s.idProveedor === person.id);  // Soy Cliente   -> busco al Proveedor

          if (!match) {
            this.toastService.show('No se encontró una solicitud apta para calificar con esta persona.', 'warning');
            return;
          }

          // 4. Asignamos el ID de la solicitud al formulario
          this.rateForm.idSolicitud = match.idSolicitud;

          // 5. Abrimos el modal de las estrellas (reset = true para limpiar campos)
          this.openRateModal(true); 
        },
        error: (e) => {
          console.error('Error buscando solicitud para calificar:', e);
          this.toastService.show('Ocurrió un error al preparar la calificación.', 'error');
        }
      });
  }
}
