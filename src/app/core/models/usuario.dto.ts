// core/models/usuario.dto.ts
export interface DireccionDTO {
  idDireccion?: number | null;
  descripcion: string;
  comuna?: string | null;
  codigoPostal?: string | null;
  region?: string | null;
    latitud?: number | null;  // Backend puede devolver string o number
  longitud?: number | null; // Backend puede devolver string o number
}

export interface UsuarioDTO {
  idUsuario?: number | null;
  correo: string;
  nombre: string;
  contrasena: string;

  evaluacion?: number | null;
  descripcion?: string | null;
  fechaNacimiento?: string | null;   // yyyy-MM-dd
  fechaCreacion?: string | null;
  telefono?: string | null;
  idDireccion?: number | null;
  esCliente: boolean;
  esProveedor: boolean;
  fotoPerfilUrl?: string | null;

  direccion?: DireccionDTO | null;  
}

export interface RegisterResponse {
  isSuccess: boolean;
  userId?: number;
  message?: string;
}

export interface ValidationProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  errors: Record<string, string[]>;
}
