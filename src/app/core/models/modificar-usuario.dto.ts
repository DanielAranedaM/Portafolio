export interface ModificarUsuarioDTO {
  // Usuario
  nombre: string;
  descripcion?: string | null;
  telefono: string;         // 9 dígitos (sin +56)
  correo: string;

  // Dirección (existente, no se crea nueva)
  idDireccion: number;
  direccionDescripcion: string;
  comuna?: string | null;
  region?: string | null;
  codigoPostal?: string | null;
  
}