export interface DenunciaCreateDTO {
  idUsuario: number;
  idSolicitud: number | null;
  idValorizacion: number | null;
  idServicio: number | null;   // 👈 nuevo
  motivo: string;
}
