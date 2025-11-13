import { inject, Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { DenunciaCreateDTO } from '../models/denuncia-create.dto';
import { API_URL } from '../tokens/api-url.token';

// DTOs de administración (puedes moverlos a core/models si quieres)
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

  // Crear denuncia (ya lo tenías)
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

}
