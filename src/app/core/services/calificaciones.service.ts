import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../tokens/api-url.token';
import { Observable, switchMap } from 'rxjs';
import { CalificacionDTO } from '../models/calificacion.dto';
import { CalificacionCreateDTO } from '../models/calificacion-create.dto';
import { CalificacionUpdateDTO } from '../models/calificacion-update.dto';
import { UsersService } from './users.service';
import { UsuarioDetalleDTO } from '../models/usuario-detalle.dto';
import { SolicitudesService } from './solicitudes.service'; 

@Injectable({ providedIn: 'root' })
export class CalificacionesService {
  constructor(
    private http: HttpClient,
    private solicitudesService: SolicitudesService,
    private usersService: UsersService,
    @Inject(API_URL) private apiUrl: string
  ) {}

  create(dto: CalificacionCreateDTO): Observable<CalificacionDTO> {
    return this.http.post<CalificacionDTO>(`${this.apiUrl}/api/Calificacion`, dto);
  }

  update(idValorizacion: number, actorUserId: number, dto: CalificacionUpdateDTO): Observable<CalificacionDTO> {
    return this.http.put<CalificacionDTO>(`${this.apiUrl}/api/Calificacion/${idValorizacion}?actorUserId=${actorUserId}`, dto);
  }

  getById(idValorizacion: number): Observable<CalificacionDTO> {
    return this.http.get<CalificacionDTO>(`${this.apiUrl}/api/Calificacion/${idValorizacion}`);
  }

  getByAuthor(idUsuarioAutor: number): Observable<CalificacionDTO[]> {
    return this.http.get<CalificacionDTO[]>(`${this.apiUrl}/api/Calificacion/autor/${idUsuarioAutor}`);
  }

  getReceived(idUsuarioReceptor: number): Observable<CalificacionDTO[]> {
    return this.http.get<CalificacionDTO[]>(`${this.apiUrl}/api/Calificacion/recibidas/${idUsuarioReceptor}`);
  }

  getMineAuthored(): Observable<CalificacionDTO[]> {
    return this.usersService.getMe().pipe(
      switchMap((me: UsuarioDetalleDTO) => this.getByAuthor(me.idUsuario))
    );
  }

  getMineReceived(): Observable<CalificacionDTO[]> {
    return this.usersService.getMe().pipe(
      switchMap((me: UsuarioDetalleDTO) => this.getReceived(me.idUsuario))
    );
  }

  createAsMe(payload: Omit<CalificacionCreateDTO, 'idUsuario'>): Observable<CalificacionDTO> {
    return this.usersService.getMe().pipe(
      switchMap((me: UsuarioDetalleDTO) =>
        this.create({ idUsuario: me.idUsuario, ...payload })
      )
    );
  }

  updateAsMe(idValorizacion: number, dto: CalificacionUpdateDTO): Observable<CalificacionDTO> {
    return this.usersService.getMe().pipe(
      switchMap((me: UsuarioDetalleDTO) => this.update(idValorizacion, me.idUsuario, dto))
    );
  }

  getUltimasResenas(usuarioId: number) {
    return this.http.get<CalificacionDTO[]>(
        `${this.apiUrl}/api/Calificacion/Ultimas/${usuarioId}`
    );
  }

}
