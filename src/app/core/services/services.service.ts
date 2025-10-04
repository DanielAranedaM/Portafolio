import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_URL } from '../tokens/api-url.token';
import { CreateServiceDTO } from '../models/create-Service.dto';
import { ServicioDTO } from '../models/servicio.dto';

@Injectable({ providedIn: 'root' })
export class ServicesService {
  private readonly base: string;

  constructor(
    private http: HttpClient,
    @Inject(API_URL) private apiUrl: string
  ) {
    this.base = `${this.apiUrl}/api/Services`;
  }

  /**
   * Crea un servicio. No envía IdUsuario en el body (se toma del JWT).
   * Si precioBase viene null/undefined -> se envía 0.
   */
  createService(payload: CreateServiceDTO): Observable<ServicioDTO> {
    const body: CreateServiceDTO = {
      ...payload,
      precioBase: payload.precioBase ?? 0
    };

    return this.http
      .post<ServicioDTO>(`${this.base}/CreateService`, body)
      .pipe(catchError(this.handleError));
  }

  private handleError = (err: HttpErrorResponse) => {
    // 400 del controller: { message: string }
    if (err.status === 400 && err.error?.message) {
      return throwError(() => new Error(err.error.message));
    }
    // 500 ProblemDetails del controller: { title: string, ... }
    if (err.status === 500 && err.error?.title) {
      return throwError(() => new Error(err.error.title));
    }
    return throwError(() => err);
  };
}
