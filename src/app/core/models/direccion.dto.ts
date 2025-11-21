export interface DireccionDTO {
  idDireccion?: number;              // el backend lo ignora en create
  descripcion: string;
  comuna?: string | null;
  codigoPostal?: string | null;
  region?: string | null;
  latitud?: string | number | null;  // Backend puede devolver string o number
  longitud?: string | number | null; // Backend puede devolver string o number
}
