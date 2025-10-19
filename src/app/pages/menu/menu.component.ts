import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { UsersService } from '../../core/services/users.service';
import { UsuarioDetalleDTO } from '../../core/models/usuario-detalle.dto';
import { API_URL } from '../../core/tokens/api-url.token';
import { CategoriasService } from '../../core/services/categorias.service';
import { CategoriaDTO } from '../../core/models/categoria.dto';
import { ServicioDTO } from '../../core/models/servicio.dto';
import { ServicesService } from '../../core/services/services.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {
  constructor(
    private router: Router,
    private usersService: UsersService,
    private categoriasService: CategoriasService,
    private servicesService: ServicesService,
    @Inject(API_URL) private apiUrl: string
  ) {}

  // ------------------ Estado / props ------------------
  logoutModalVisible = false;
  userRole = ''; // 'proveedor' | 'cliente'

  categorias: CategoriaDTO[] = [];
  categoriasLoading = false;
  categoriasError: string | null = null;
  serviciosDeCategoria: ServicioDTO[] = [];
  serviciosLoading = false;
  serviciosError: string | null = null;

  userName = 'Usuario';
  userDescription: string | null = null;
  userRating: number | null = null;

  sidebarVisible = true;

  photoModalVisible = false;
  cameraModalVisible = false;
  profileImageUrl: string | null = null;   // URL absoluta para <img>
  userInitials = 'US';
  currentStream: MediaStream | null = null;

  ngOnInit(): void {
    // (Opcional) Rol desde localStorage como fallback
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        this.userRole = user.role || '';
      } catch {
        this.userRole = '';
      }
    }

    // Cargar datos reales del usuario
    this.loadMe();
    this.loadCategorias();
  }

  private loadCategorias(): void {
    this.categoriasLoading = true;
    this.categoriasError = null;

    this.categoriasService.getAll().subscribe({
      next: (cats) => {
        console.log('GET /api/Categoria ->', cats);
        this.categorias = cats ?? [];
      },
      error: (err) => {
        console.error('Error cargando categorías:', err);
        this.categoriasError = 'No se pudieron cargar las categorías.';
      }
    }).add(() => {
      this.categoriasLoading = false;
    });
  }

  seleccionarCategoria(cat: CategoriaDTO): void {
    if (!cat?.idCategoriaServicio) return;

    this.serviciosLoading = true;
    this.serviciosError = null;
    this.serviciosDeCategoria = [];

    this.servicesService.getByCategoryNearMe(cat.idCategoriaServicio).subscribe({
      next: (servs: ServicioDTO[] | any) => {
        console.log('Servicios cercanos por categoría:', cat, servs);

        // Caso backend mensaje (tu ServicesService ya lanza error,
        // pero por si llega "message" en next por algún proxy raro)
        if (servs && servs.message) {
          this.serviciosDeCategoria = [];
          this.serviciosError = servs.message;
          return;
        }

        // Caso lista vacía -> mensaje amable
        if (Array.isArray(servs) && servs.length === 0) {
          this.serviciosDeCategoria = [];
          this.serviciosError = 'No encontramos servicios en esta categoría cerca de ti por ahora.';
          return;
        }

        this.serviciosError = null;
        this.serviciosDeCategoria = servs ?? [];
      },
      error: (err) => {
        console.error('Error obteniendo servicios por categoría:', err);
        // si viene mensaje desde el backend o desde el map() del service, úsalo
        this.serviciosDeCategoria = [];
        this.serviciosError = err?.message || 'No se pudieron cargar los servicios.';
      }
    }).add(() => {
      this.serviciosLoading = false;
    });

  }

  private loadMe(): void {
    this.usersService.getMe().subscribe({
      next: (me: UsuarioDetalleDTO) => {
        // Foto (API puede devolver ruta relativa '/uploads/...'):
        this.profileImageUrl = me.fotoPerfilUrl ? this.makeAbsoluteUrl(me.fotoPerfilUrl) : null;

        // Nombre / iniciales
        this.userName = me.nombre || 'Usuario';
        this.userInitials = this.computeInitials(this.userName);

        // Descripción
        this.userDescription = me.descripcion ?? null;

        // Evaluación (rating)
        this.userRating = typeof me.evaluacion === 'number' ? me.evaluacion : null;

        // Rol desde flags del backend
        if (typeof me.esProveedor === 'boolean' || typeof me.esCliente === 'boolean') {
          this.userRole = me.esProveedor ? 'proveedor' : 'cliente';
        }

        console.log('GET /Usuario/Me ->', me);
      },
      error: (err) => {
        console.error('Error al obtener /Usuario/Me:', err);
      }
    });
  }

  private computeInitials(fullName: string): string {
    if (!fullName?.trim()) return 'US';
    const parts = fullName.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
    return (first + last).toUpperCase();
  }

  private makeAbsoluteUrl(ruta: string): string {
    // Si ya es URL absoluta, la dejamos; si es relativa (empieza con /uploads)
    // concatenamos la base de la API.
    if (/^https?:\/\//i.test(ruta)) return ruta;
    return `${this.apiUrl}${ruta}`;
  }

  // ------------------ Navegación ------------------
  routePerfil() { this.router.navigate(['/perfil']); }
  routeRegistrarServicio() { this.router.navigate(['/registrar-servicio']); }
  get isProveedor(): boolean { return this.userRole === 'proveedor'; }

  // ------------------ Sidebar ------------------
  toggleSidebar(): void { this.sidebarVisible = !this.sidebarVisible; }
  get toggleIcon(): string { return this.sidebarVisible ? '☰' : '👤'; }
  get toggleTitle(): string { return this.sidebarVisible ? 'Ocultar perfil' : 'Mostrar perfil'; }
  get sidebarClasses(): string { return this.sidebarVisible ? 'sidebar' : 'sidebar hidden'; }
  get mainContentClasses(): string { return this.sidebarVisible ? 'main-content' : 'main-content expanded'; }
  get toggleButtonClasses(): string { return this.sidebarVisible ? 'toggle-sidebar' : 'toggle-sidebar sidebar-hidden'; }

  // ------------------ Foto / Cámara ------------------
  openPhotoModal(): void { this.photoModalVisible = true; }
  closePhotoModal(): void { this.photoModalVisible = false; }

  async takePhoto(): Promise<void> {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert('Tu navegador no soporta acceso a la cámara');
        return;
      }
      this.closePhotoModal();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      this.showCameraModal(stream);
    } catch (error: any) {
      console.error('Error al acceder a la cámara:', error);
      if (error?.name === 'NotAllowedError') alert('Acceso a la cámara denegado.');
      else if (error?.name === 'NotFoundError') alert('No se encontró una cámara.');
      else if (error?.name === 'NotReadableError') alert('La cámara está en uso por otra app.');
      else alert('Error al acceder a la cámara.');
    }
  }

  uploadPhoto(): void {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) fileInput.click();
    this.closePhotoModal();
  }

  handlePhotoUpload(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) { target.value = ''; return; }
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido');
      target.value = '';
      return;
    }

    this.usersService.subirMiFoto(file, file.name).subscribe({
      next: (foto) => {
        this.profileImageUrl = this.makeAbsoluteUrl(foto.ruta);
      },
      error: (e) => {
        console.error('Error subiendo foto:', e);
        alert('No se pudo subir la foto');
      }
    });

    target.value = '';
  }

  removePhoto(): void {
    this.usersService.eliminarMiFotoActual().subscribe({
      next: () => {
        this.profileImageUrl = null;
        this.closePhotoModal();
      },
      error: (e) => {
        console.error('Error eliminando foto:', e);
        alert('No se pudo eliminar la foto');
      }
    });
  }

  get hasProfileImage(): boolean { return this.profileImageUrl !== null; }

  onModalBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) this.closePhotoModal();
  }
  onCameraBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) this.closeCameraModal();
  }

  showCameraModal(stream: MediaStream): void {
    this.currentStream = stream;
    this.cameraModalVisible = true;
    setTimeout(() => {
      const video = document.getElementById('cameraVideo') as HTMLVideoElement;
      if (video) { video.srcObject = stream; video.play(); }
    }, 100);
  }

  closeCameraModal(): void {
    this.cameraModalVisible = false;
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(t => t.stop());
      this.currentStream = null;
    }
  }

  capturePhoto(): void {
    const video = document.getElementById('cameraVideo') as HTMLVideoElement;
    const canvas = document.getElementById('photoCanvas') as HTMLCanvasElement;
    if (video && canvas) {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const blob = this.dataUrlToBlob(dataUrl);

      this.usersService.subirMiFoto(blob, 'captura.jpg').subscribe({
        next: (foto) => {
          this.profileImageUrl = this.makeAbsoluteUrl(foto.ruta);
          this.closeCameraModal();
        },
        error: (e) => {
          console.error('Error subiendo foto:', e);
          alert('No se pudo subir la foto');
        }
      });
    }
  }

  async switchCamera(): Promise<void> {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(t => t.stop());
      try {
        const currentFacingMode = this.currentStream.getVideoTracks()[0].getSettings().facingMode;
        const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: newFacingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        this.currentStream = newStream;
        const video = document.getElementById('cameraVideo') as HTMLVideoElement;
        if (video) video.srcObject = newStream;
      } catch (error) {
        console.error('Error al cambiar cámara:', error);
        alert('No se pudo cambiar la cámara');
      }
    }
  }

  // ------------------ Logout ------------------
  openLogoutModal(): void { this.logoutModalVisible = true; }
  closeLogoutModal(): void { this.logoutModalVisible = false; }
  confirmLogout(): void {
    try {
      this.clearSessionData();
      this.closeLogoutModal();
      this.router.navigate(['/login']).catch(err => console.error('Error al navegar:', err));
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
  private clearSessionData(): void {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('userPreferences');
    localStorage.removeItem('auth_token');
    sessionStorage.clear();
  }

  // ------------------ Búsquedas ------------------
  buscarServicio(): void {
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    if (!searchInput) return;
    const query = searchInput.value.trim();
    if (query) console.log('Buscando:', query);
    else alert('Por favor ingresa un término de búsqueda');
  }
  seleccionarServicio(servicio: string): void { console.log('Servicio seleccionado:', servicio); }
  buscarReciente(termino: string): void {
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    if (!searchInput) return;
    searchInput.value = termino;
    this.buscarServicio();
  }

  // ------------------ Helpers ------------------
  private dataUrlToBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  }
}
