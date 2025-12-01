export interface DireccionDTO {
  idDireccion?: number;         
  descripcion: string;
  comuna?: string | null;
  codigoPostal?: string | null;
  region?: string | null;
  latitud?: string | number | null;  
  longitud?: string | number | null; 
}
