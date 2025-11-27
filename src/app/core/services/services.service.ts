import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API_URL } from '../tokens/api-url.token';
import { CreateServiceDTO } from '../models/create-service.dto';
import { ServicioDTO } from '../models/servicio.dto';
import { ServicioDetalleDTO } from '../models/servicio-detalle.dto';

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
   * Crea un servicio enviando FormData (incluye archivos de imágenes)
   * No envía IdUsuario en el body (se toma del JWT).
   */
  createService(formData: FormData): Observable<ServicioDTO> {
    return this.http
      .post<ServicioDTO>(`${this.base}/CreateService`, formData)
      .pipe(
        map(servicio => this.normalizeServicio(servicio)),
        catchError(this.handleError)
      );
  }

  /**
   * Convierte URLs relativas del backend a URLs absolutas
   * Ejemplo: /uploads/abc.jpg → https://localhost:7054/uploads/abc.jpg
   */
  private makeAbsoluteUrl(ruta: string | null | undefined): string | null {
    if (!ruta) return null;
    // Si ya es absoluta, retornarla tal cual
    if (/^https?:\/\//i.test(ruta)) return ruta;
    // Construir URL absoluta
    return `${this.apiUrl}${ruta}`;
  }

  /**
   * Normaliza un ServicioDTO convirtiendo las URLs relativas a absolutas
   */
  private normalizeServicio(servicio: ServicioDTO): ServicioDTO {
    return {
      ...servicio,
      urlFotoPrincipal: this.makeAbsoluteUrl(servicio.urlFotoPrincipal)
    };
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
          const servicios = res as ServicioDTO[];
          return servicios.map(s => this.normalizeServicio(s));
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
          const servicios = res as ServicioDTO[];
          return servicios.map(s => this.normalizeServicio(s));
        }),
        catchError(this.handleError)
      );
  }
  
  /**
   * Obtiene un servicio por su ID
   */
  getServiceById(id: number): Observable<ServicioDTO> {
    return this.http
      .get<ServicioDTO>(`${this.base}/GetServiceById/${id}`)
      .pipe(
        map(servicio => this.normalizeServicio(servicio)),
        catchError(this.handleError)
      );
  }

  /**
   * Actualiza un servicio existente enviando JSON
   */
  updateService(id: number, serviceData: any): Observable<ServicioDTO> {
    return this.http
      .put<ServicioDTO>(`${this.base}/UpdateService/${id}`, serviceData)
      .pipe(
        map(servicio => this.normalizeServicio(servicio)),
        catchError(this.handleError)
      );
  }

  /**
   * Elimina un servicio por su ID
   */
  deleteService(id: number): Observable<any> {
    return this.http
      .delete(`${this.base}/DeleteServices/${id}`)
      .pipe(catchError(this.handleError));
  }

  getDashboardDataForProveedor(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/DashboardProveedor`);
  }

  /**
   * Obtiene detalle completo del servicio incluyendo todas las fotos
   */
  getServiceDetailWithPhotos(id: number): Observable<ServicioDetalleDTO> {
    return this.http
      .get<ServicioDetalleDTO>(`${this.base}/GetServiceDetailWithPhotos/${id}`)
      .pipe(
        map(detalle => ({
          ...detalle,
          // Normalizar URLs de todas las fotos
          fotos: detalle.fotos.map(foto => ({
            ...foto,
            url: this.makeAbsoluteUrl(foto.url) || ''
          })),
          // Normalizar foto del proveedor
          proveedorFoto: this.makeAbsoluteUrl(detalle.proveedorFoto)
        })),
        catchError(this.handleError)
      );
  }

  /**
   * Guarda un servicio en favoritos
   */
  guardarServicio(idServicio: number): Observable<any> {
    return this.http.post(`${this.base}/Guardar/${idServicio}`, {});
  }

  /**
   * Quita un servicio de favoritos
   */
  quitarServicioGuardado(idServicio: number): Observable<any> {
    return this.http.delete(`${this.base}/Guardar/${idServicio}`);
  }

  /**
   * Obtiene los servicios guardados por el usuario actual
   */
  getServiciosGuardados(): Observable<ServicioDTO[]> {
    return this.http
      .get<ServicioDTO[] | { message: string }>(`${this.base}/Guardados`)
      .pipe(
        map((res: any) => {
          // Si el backend devuelve { message: "No tiene servicios guardados." }
          if (res && res.message) {
            return [];
          }
          // Si devuelve array
          const servicios = res as ServicioDTO[];
          return servicios.map(s => this.normalizeServicio(s));
        }),
        catchError(this.handleError)
      );
  }
}
