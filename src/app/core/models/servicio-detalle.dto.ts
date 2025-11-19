export interface ServicioDetalleDTO {
  idServicio: number;
  titulo: string;
  descripcion: string | null;
  precioBase: number;
  categoria: string;
  ubicacion: string | null;
  
  // Proveedor
  proveedorId: number;
  proveedorNombre: string;
  proveedorFoto: string | null;
  proveedorEvaluacion: number;
  proveedorTelefono: string | null;
  
  // Todas las fotos
  fotos: FotoServicioDetalleDTO[];
}

export interface FotoServicioDetalleDTO {
  idFoto: number;
  url: string;
  esPrincipal: boolean;
  orden: number;
}
