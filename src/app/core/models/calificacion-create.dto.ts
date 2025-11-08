export interface CalificacionCreateDTO {
  idUsuario: number;       // autor (se setea desde getMe())
  idSolicitud: number;     // solicitud asociada
  cantEstrellas: number;   // 1..5
  comentario?: string | null;
}