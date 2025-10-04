export interface FotoServicioDTO {
  idFotoServicio?: number;
  idServicio?: number;
  ruta: string;                      // URL o path ya disponible
  esPrincipal: boolean;
  fechaSubida?: string;              // ISO string si el backend lo devuelve
}
