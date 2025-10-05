import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../tokens/api-url.token';
import { Observable } from 'rxjs';
import { UsuarioDetalleDTO } from '../models/usuario-detalle.dto';
import { FotoUsuarioDTO } from '../models/foto-usuario.dto';

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
}
