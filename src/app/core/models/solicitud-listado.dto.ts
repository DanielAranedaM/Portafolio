export interface SolicitudListadoDTO {
  idSolicitud: number;
  idUsuario: number;
  idProveedor: number;
  idServicio: number;
  fechaAgendamiento: string | null;
  precioAcordado: number | null;
  fechaCreacion: string;
  fechaRealizacion: string | null;
  estado: string;
  clienteNombre: string;
  proveedorNombre: string;
  medioDePago?: string | null;
  notas?: string | null;
  
}