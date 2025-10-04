import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_URL } from '../tokens/api-url.token';
import { CategoriaDTO } from '../models/categoria.dto';

@Injectable({ providedIn: 'root' })
export class CategoriasService {
  private readonly base: string;

  constructor(
    private http: HttpClient,
    @Inject(API_URL) apiUrl: string
  ) {
    this.base = `${apiUrl}/api/Categoria`;
  }

  getAll(): Observable<CategoriaDTO[]> {
    return this.http.get<CategoriaDTO[]>(`${this.base}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError = (err: HttpErrorResponse) => {
    return throwError(() => err);
  };
}
