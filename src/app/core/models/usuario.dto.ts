// core/models/usuario.dto.ts
export interface DireccionDTO {
  idDireccion?: number | null;
  descripcion: string;
  comuna?: string | null;
  codigoPostal?: string | null;
  region?: string | null;
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

  direccion?: DireccionDTO | null;   // <<-- embebida para crear en backend
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
