import { DireccionDTO } from './usuario.dto'; 
import { FotoServicioDTO } from './foto-servicio.dto'; 

export interface CreateServiceDTO {
  titulo: string;
  descripcion?: string | null;
  precioBase?: number | null;        // si viene null, se enviará 0 desde el service
  idCategoriaServicio: number;
  direccion?: DireccionDTO | null;
  fotos?: FotoServicioDTO[] | null;
}
