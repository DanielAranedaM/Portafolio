import { inject, Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { DenunciaCreateDTO } from '../models/denuncia-create.dto';
import { API_URL } from '../tokens/api-url.token';

export interface DenunciaResenaAdminDTO {
  idDenuncia: number;
  idUsuarioDenunciante: number;
  denuncianteNombre?: string | null;

  idValorizacion: number;
  resenaComentario?: string | null;
  resenaCantEstrellas: number;
  resenaFecha: string | Date;
  resenaAutorId: number;
  resenaAutorNombre?: string | null;

  motivo: string;
}

export interface DenunciaServicioAdminDTO {
  idDenuncia: number;

  idUsuarioDenunciante: number;
  denuncianteNombre?: string | null;

  idServicio: number;
  servicioTitulo?: string | null;
  servicioCategoria?: string | null;

  proveedorId: number;
  proveedorNombre?: string | null;

  motivo: string;

  fotoServicioUrl?: string | null;
}

export interface DenunciaSolicitudAdminDTO {
  idDenuncia: number;
  idUsuarioDenunciante: number;
  denuncianteNombre?: string | null;

  idSolicitud: number;
  solicitudResumen?: string | null;
  solicitudEstado: string;

  clienteId: number;
  clienteNombre?: string | null;
  proveedorId: number;
  proveedorNombre?: string | null;

  motivo: string;
}

@Injectable({
  providedIn: 'root'
})
export class DenunciasService {

  private readonly http = inject(HttpClient);

  constructor(
    @Inject(API_URL) private readonly apiUrl: string
  ) {}

  // Crear denuncia
  crearDenuncia(dto: DenunciaCreateDTO): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/denuncia`, dto);
  }

  // 🔹 Obtener denuncias sobre reseñas
  getDenunciasResenas(): Observable<DenunciaResenaAdminDTO[]> {
    return this.http.get<DenunciaResenaAdminDTO[]>(`${this.apiUrl}/api/denuncia/resenas`);
  }

  // 🔹 Obtener denuncias sobre solicitudes
  getDenunciasSolicitudes(): Observable<DenunciaSolicitudAdminDTO[]> {
    return this.http.get<DenunciaSolicitudAdminDTO[]>(`${this.apiUrl}/api/denuncia/solicitudes`);
  }

  getDenunciasServicios(): Observable<DenunciaServicioAdminDTO[]> {
    return this.http.get<DenunciaServicioAdminDTO[]>(`${this.apiUrl}/api/denuncia/servicios`);
  }

// 1. Eliminar la denuncia solamente (Marcar como resuelta/ignorar)
  deleteDenuncia(idDenuncia: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/denuncia/${idDenuncia}`);
  }

  // 2. Eliminar la reseña reportada (Acción punitiva)
  deleteResena(idValorizacion: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/denuncia/resena/${idValorizacion}`);
  }

  // 3. Eliminar el servicio reportado (Acción punitiva)
  deleteServicio(idServicio: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/denuncia/servicio/${idServicio}`);
  }
}
