import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../tokens/api-url.token';
import { SolicitudListadoDTO } from '../models/solicitud-listado.dto';
import { SolicitudCreateDTO } from '../models/solicitud-create.dto';
import { SolicitudFinalizarDTO } from '../models/solicitud-finalizar.dto';

@Injectable({ providedIn: 'root' })
export class SolicitudesService {
  constructor(
    private http: HttpClient,
    @Inject(API_URL) private apiUrl: string
  ) {}

  obtenerTodas(): Observable<SolicitudListadoDTO[]> {
    return this.http.get<SolicitudListadoDTO[]>(
      `${this.apiUrl}/api/Solicitud/GetMisSolicitudes`
    );
  }

  obtenerTodasAdmin(): Observable<SolicitudListadoDTO[]> {
    return this.http.get<SolicitudListadoDTO[]>(
      `${this.apiUrl}/api/Solicitud/GetSolicitudes`
    );
  }
  
  crear(dto: SolicitudCreateDTO): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/Solicitud/CrearSolicitud`, dto);
  }

  marcarCompletada(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/Solicitud/${id}/completar`, {});
  }

  finalizar(id: number, dto: SolicitudFinalizarDTO): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/Solicitud/${id}/finalizar`, dto);
  }
}