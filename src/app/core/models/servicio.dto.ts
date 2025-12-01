export interface ServicioDTO {
  idServicio: number;
  idUsuario: number;
  titulo: string;
  descripcion?: string | null;
  precioBase: number;
  esConversable: boolean;
  idCategoriaServicio: number;
  activo: boolean;
  fechaPublicacion: string;         
  urlFotoPrincipal?: string | null;
  categoriaNombre: string;
  proveedorNombre: string;
  ubicacion?: string; // Agregado para mostrar comuna/ciudad
  telefonoProveedor?: string; // Agregado para contacto
  esMayorDeEdad?: boolean;
}
