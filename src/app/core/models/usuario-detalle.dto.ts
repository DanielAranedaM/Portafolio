import { DireccionDTO } from "./usuario.dto"; 

export interface UsuarioDetalleDTO {
  idUsuario: number;
  nombre: string;
  correo: string;
  telefono?: string | null;
  evaluacion?: number | null;
  descripcion?: string | null;
  direccion?: DireccionDTO | null;   // viene desde SQL
  fotoPerfilUrl?: string | null;
  esCliente?: boolean;
  esProveedor?: boolean;
}
