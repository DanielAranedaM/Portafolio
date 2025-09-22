// FechaNacimiento en .NET es DateOnly? => envía string "YYYY-MM-DD"
export interface UsuarioDTO {
  idUsuario?: number;
  correo: string;
  nombre: string;
  contrasena: string;
  evaluacion?: number | null;
  descripcion?: string | null;
  fechaNacimiento?: string | null; // "yyyy-MM-dd"
  fechaCreacion?: string;          // backend la setea, no enviarla al registrar
  telefono?: string | null;
  idDireccion?: number | null;
  esCliente: boolean;
  esProveedor: boolean;
  fotoPerfilUrl?: string | null;
}

export interface RegisterResponse {
  isSuccess: boolean;
  userId?: number;
  message?: string;
}

// Para capturar errores de validación
export interface ValidationProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors: Record<string, string[]>;
}