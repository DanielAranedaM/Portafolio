export interface CalificacionCreateDTO {
  idUsuario: number;     
  idSolicitud: number;    
  cantEstrellas: number; 
  comentario?: string | null;
}