import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../tokens/api-url.token';
import { Observable } from 'rxjs';
import { UsuarioDetalleDTO } from '../models/usuario-detalle.dto'; // <-- usar el archivo nuevo

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(
    private http: HttpClient,
    @Inject(API_URL) private apiUrl: string
  ) {}

  getMe(): Observable<UsuarioDetalleDTO> {
    return this.http.get<UsuarioDetalleDTO>(`${this.apiUrl}/api/Usuario/Me`);
  }
}
