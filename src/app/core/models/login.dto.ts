export interface LoginDTO {
  correo: string;
  contrasena: string;
}

export interface LoginResponse {
  isSuccess: boolean;
  token: string;
}