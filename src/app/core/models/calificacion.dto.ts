export interface CalificacionDTO {
  idValorizacion: number;
  idUsuario: number;        // autor
  idSolicitud: number;
  cantEstrellas: number;
  comentario?: string | null;
  fecha: string;            // ISO

  // Extras del backend para pintar en UI (opcionales):
  receptorUsuarioId?: number;
  receptorNombre?: string | null;
  autorNombre?: string | null;
  fotoAutorUrl?: string | null; 
}
