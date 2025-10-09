import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../tokens/api-url.token';
import { Observable } from 'rxjs';
import { UsuarioDetalleDTO } from '../models/usuario-detalle.dto';
import { FotoUsuarioDTO } from '../models/foto-usuario.dto';
import { ModificarUsuarioDTO } from '../models/modificar-usuario.dto';

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(
    private http: HttpClient,
    @Inject(API_URL) private apiUrl: string
  ) {}

  getMe(): Observable<UsuarioDetalleDTO> {
    return this.http.get<UsuarioDetalleDTO>(`${this.apiUrl}/api/Usuario/Me`);
  }

  subirMiFoto(archivo: Blob, fileName = 'foto.jpg'): Observable<FotoUsuarioDTO> {
    const form = new FormData();
    form.append('archivo', archivo, fileName);
    return this.http.post<FotoUsuarioDTO>(`${this.apiUrl}/api/Usuario/Foto`, form);
  }

  eliminarMiFotoActual(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/Usuario/FotoActual`);
  }

  modificarMe(dto: ModificarUsuarioDTO, archivo?: Blob, fileName = 'foto.jpg'): Observable<UsuarioDetalleDTO> {
    const form = new FormData();
    form.append('Nombre', dto.nombre);
    form.append('Descripcion', (dto.descripcion ?? '').toString());
    form.append('Telefono', dto.telefono);
    form.append('Correo', dto.correo);

    form.append('IdDireccion', String(dto.idDireccion));
    form.append('DireccionDescripcion', dto.direccionDescripcion);
    if (dto.codigoPostal != null) form.append('CodigoPostal', dto.codigoPostal);

    // NUEVO: se envían ocultos si existen (extraídos de OSM)
    if (dto.comuna != null) form.append('Comuna', dto.comuna);
    if (dto.region != null) form.append('Region', dto.region);

    if (archivo) form.append('Archivo', archivo, fileName);

    return this.http.put<UsuarioDetalleDTO>(`${this.apiUrl}/api/Usuario/Me`, form);
  }

}
