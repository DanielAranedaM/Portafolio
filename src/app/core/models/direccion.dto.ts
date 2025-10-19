export interface DireccionDTO {
  idDireccion?: number;              // el backend lo ignora en create
  descripcion: string;
  comuna?: string | null;
  codigoPostal?: string | null;
  region?: string | null;
  latitud?: number | null;
  longitud?: number | null;
}
