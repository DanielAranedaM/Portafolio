import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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

  getByCategoryNearMe(categoryId: number): Observable<ServicioDTO[]> {
    return this.http
      .get<ServicioDTO[] | { message: string }>(`${this.base}/GetByCategory/${categoryId}`)
      .pipe(
        map((res: any) => {
          // Si el backend devolvió un mensaje en lugar de una lista
          if (res && res.message) {
            throw new Error(res.message);
          }
          return res as ServicioDTO[];
        }),
        catchError(this.handleError)
      );
  }
  
  searchServices(query: string, categoryId?: number): Observable<ServicioDTO[]> {
    if (!query?.trim()) {
      return throwError(() => new Error('Debe indicar un texto de búsqueda.'));
    }

    const params: any = { q: query.trim() };
    if (categoryId && categoryId > 0) params.categoryId = categoryId;

    return this.http
      .get<ServicioDTO[] | { message: string }>(`${this.base}/BuscarServicio`, { params })
      .pipe(
        map((res: any) => {
          if (res && res.message) throw new Error(res.message);
          return res as ServicioDTO[];
        }),
        catchError(this.handleError)
      );
  }
  
  getDashboardDataForProveedor(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/DashboardProveedor`);
  }
}
