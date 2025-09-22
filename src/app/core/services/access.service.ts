import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_URL } from '../tokens/api-url.token';
import { LoginDTO, LoginResponse } from '../models/login.dto';
import { RegisterResponse, UsuarioDTO, ValidationProblemDetails } from '../models/usuario.dto';

@Injectable({ providedIn: 'root' })
export class AccessService {

    private readonly base: string; // <--- declaramos sin inicializar

    constructor(
        private http: HttpClient,
        @Inject(API_URL) private apiUrl: string
    ) 
    {
        this.base = `${this.apiUrl}/api/Access`;
    }

    login(payload: LoginDTO): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.base}/Login`, payload).pipe(
        catchError(this.handleError)
        );
    }

    register(payload: UsuarioDTO): Observable<RegisterResponse> {
        // No enviar idUsuario ni fechaCreacion al backend en el registro
        const { idUsuario, fechaCreacion, ...body } = payload;
        return this.http.post<RegisterResponse>(`${this.base}/Register`, body).pipe(
        catchError(this.handleError)
        );
    }

    private handleError = (err: HttpErrorResponse) => {
        // 400 ValidationProblemDetails del backend (FluentValidation)
        if (err.status === 400 && err.error && err.error.errors) {
            const vpd = err.error as ValidationProblemDetails;
            return throwError(() => vpd);
        }
        return throwError(() => err);
    };
}
