import { Component, OnInit, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { FormsModule } from '@angular/forms';
import { DenunciasService } from '../../core/services/denuncias.service';
import { DenunciaCreateDTO } from '../../core/models/denuncia-create.dto';

import { UsersService } from '../../core/services/users.service';
import { UsuarioDetalleDTO } from '../../core/models/usuario-detalle.dto';
import { API_URL } from '../../core/tokens/api-url.token';
import { CategoriasService } from '../../core/services/categorias.service';
import { CategoriaDTO } from '../../core/models/categoria.dto';
import { ServicioDTO } from '../../core/models/servicio.dto';
import { ServicesService } from '../../core/services/services.service';
import { CalificacionesService } from '../../core/services/calificaciones.service';
import { ChatbotInteligenteComponent } from "../../chatbot-inteligente/chatbot-inteligente.component";
import { ServicioDetalleModalComponent } from '../../components/servicio-detalle-modal/servicio-detalle-modal.component';
import { SolicitudesService } from '../../core/services/solicitudes.service';
import { SolicitudCreateDTO } from '../../core/models/solicitud-create.dto';
import { ServicioDetalleDTO } from '../../core/models/servicio-detalle.dto';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, ServicioDetalleModalComponent, ChatbotInteligenteComponent],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css', './proveedor-dashboard.css']
})

export class MenuComponent implements OnInit {
chatbotVisible: boolean = false;
  private readonly authService = inject(AuthService);

  constructor(
    private router: Router,
    private usersService: UsersService,
    private categoriasService: CategoriasService,
    private servicesService: ServicesService,
    private califsService: CalificacionesService,
    private denunciasService: DenunciasService,
    private solicitudesService: SolicitudesService, 
    private toastService: ToastService,
    @Inject(API_URL) private apiUrl: string
  ) {}


  logoutModalVisible = false;
  userRole = ''; // 'proveedor' | 'cliente'

  categorias: CategoriaDTO[] = [];
  categoriasLoading = false;
  categoriasError: string | null = null;
  categoriaSeleccionada: CategoriaDTO | null = null;
  serviciosDeCategoria: ServicioDTO[] = [];
  serviciosLoading = false;
  serviciosError: string | null = null;
  
  // Mapa para almacenar el conteo real de servicios por categoría
  serviciosCountMap: Map<number, number> = new Map();

  userName = 'Usuario';
  userDescription: string | null = null;
  userRating: number | null = null;

  sidebarVisible = true;

  // Datos para dashboard de proveedor
  proveedorStats = {
    serviciosActivos: 0,
    contactosEsteMes: 0,
    totalResenas: 0
  };

  misServicios: any[] = [];
  ultimasResenas: any[] = [];

  photoModalVisible = false;
  cameraModalVisible = false;
  profileImageUrl: string | null = null;   
  userInitials = 'US';
  currentStream: MediaStream | null = null;


  categoriasVisibles = true; 
  searchResults: ServicioDTO[] = [];
  searchLoading = false;
  searchError: string | null = null;
  recentSearches: string[] = []; // últimas 3 búsquedas


  selectedCategoryIdForSearch: number | null = null; // 

  // --- modo y estado unificado de resultados ---
  resultMode: 'search' | 'category' | null = null; 
  results: ServicioDTO[] = [];
  loading = false;
  error: string | null = null;
  me: UsuarioDetalleDTO | null = null;

  // Modal de detalle del servicio
  selectedServiceId: number | null = null;
  showDetailModal = false;
  categoriasCollapsed = false;

  // ===== Denuncia de servicio =====
  serviceReportModalVisible = false;
  serviceReportTarget: ServicioDTO | null = null;
  serviceReportForm = {
    motivo: '',
    detalle: ''
  };

  // ===== Modal de Notificación Personalizado =====
  notificationModalOpen = false;
  notificationMessage = '';
  notificationType: 'success' | 'error' = 'success';

  showNotification(message: string, type: 'success' | 'error'): void {
    this.notificationMessage = message;
    this.notificationType = type;
    this.notificationModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeNotification(): void {
    this.notificationModalOpen = false;
    document.body.style.overflow = 'auto';
  }

  toggleCategorias(): void { this.categoriasCollapsed = !this.categoriasCollapsed; }
  
  get categoriasArrowIcon(): string { return this.categoriasCollapsed ? '▸' : '▾'; }

  toggleCategoriasVisibility(): void {
    this.categoriasVisibles = !this.categoriasVisibles;

    // Si las volvemos a mostrar, limpiamos la búsqueda
    if (this.categoriasVisibles) {
      this.searchResults = [];
      this.searchError = null;
      const searchInput = document.getElementById('searchInput') as HTMLInputElement;
      if (searchInput) searchInput.value = '';
    }
  }

  ngOnInit(): void {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        this.userRole = user.role || '';
      } catch {
        this.userRole = '';
      }
    }

    // cargar historial de búsquedas guardado
    const stored = localStorage.getItem('recentSearches');
    this.recentSearches = stored ? JSON.parse(stored) : [];

    this.loadMe();
    this.loadCategorias();
  }

  private loadProveedorData(): void {
    if (!this.isProveedor) return;

    this.servicesService.getDashboardDataForProveedor().subscribe({
      next: (data) => {
        console.log('GET /api/Services/DashboardProveedor ->', data);

        const serviciosActivos = Array.isArray(data) ? data.length : 0;
        const contactosAgendados = Array.isArray(data)
          ? data.reduce((sum, s) => sum + (s.contactosAgendados || 0), 0)
          : 0;

        this.proveedorStats = {
          serviciosActivos,
          contactosEsteMes: contactosAgendados,  
          totalResenas: this.userRating ? Math.round(this.userRating) : 0
        };

        // Lista “Mis Servicios Publicados”
        this.misServicios = (data || []).map(s => ({
          id: s.idServicio,
          titulo: s.titulo,
          categoria: s.categoriaNombre || `Cat #${s.idCategoriaServicio}`,
          contactos: s.contactosAgendados || 0,
          fechaPublicacion: s.fechaPublicacion,
          urlFoto: s.urlFotoPrincipal
            ? this.makeAbsoluteUrl(s.urlFotoPrincipal)
            : '/assets/imagen/default-service.png'
        }));
        this.califsService.getUltimasResenas(this.me?.idUsuario ?? 0).subscribe({
          next: (resenas) => {
            const src = resenas ?? [];
            this.ultimasResenas = src.slice(0, 3).map(r => ({
              rating: r.cantEstrellas,
              comentario: r.comentario ?? '—',
              fecha: r.fecha,
              nombreCliente: r.autorNombre ?? 'Anónimo'
            }));
          },
          error: (e) => {
            console.error('Error al obtener reseñas recientes:', e);
            this.ultimasResenas = [];
          }
        });
      },
      error: (err) => {
        console.error('Error DashboardProveedor:', err);
        this.proveedorStats = { serviciosActivos: 0, contactosEsteMes: 0, totalResenas: 0 };
        this.misServicios = [];
      }
    });
  }


  private loadCategorias(): void {
    this.categoriasLoading = true;
    this.categoriasError = null;

    this.categoriasService.getAll().subscribe({
      next: (cats) => {
        console.log('GET /api/Categoria ->', cats);
        this.categorias = cats ?? [];
        
        // Cargar el conteo real de servicios para cada categoría
        this.loadServicesCount();
      },
      error: (err) => {
        console.error('Error cargando categorías:', err);
        this.categoriasError = 'No se pudieron cargar las categorías.';
      }
    }).add(() => {
      this.categoriasLoading = false;
    });
  }
  
  private loadServicesCount(): void {
    if (this.categorias.length === 0) {
      console.log('No hay categorías para cargar conteos');
      return;
    }
    
    console.log('🔍 Iniciando carga de conteos de servicios para', this.categorias.length, 'categorías');
    
    // Crear un objeto con observables para cada categoría
    const countRequests: { [key: number]: any } = {};
    
    this.categorias.forEach(categoria => {
      countRequests[categoria.idCategoriaServicio] = 
        this.servicesService.getByCategoryNearMe(categoria.idCategoriaServicio).pipe(
          catchError(() => of([]))
        );
    });
    
    // Ejecutar todas las peticiones en paralelo
    forkJoin(countRequests).subscribe({
      next: (results: any) => {
        console.log('✅ Resultados de conteos de servicios:', results);
        
        // Almacenar los conteos en el mapa
        Object.keys(results).forEach(key => {
          const categoryId = Number(key);
          const servicios: ServicioDTO[] = results[categoryId];
          const count = servicios?.length || 0;
          this.serviciosCountMap.set(categoryId, count);
          console.log(`   📊 Categoría ${categoryId}: ${count} servicios`);
        });
        
        console.log('✅ Mapa de conteos final:', this.serviciosCountMap);
      },
      error: (err) => {
        console.error('❌ Error cargando conteos de servicios:', err);
        console.error('   Detalle del error:', err.message || err);
        
        // En caso de error, establecer conteos en 0
        this.categorias.forEach(cat => {
          this.serviciosCountMap.set(cat.idCategoriaServicio, 0);
        });
        
        console.warn('⚠️ Conteos establecidos en 0 por error. Verifica:');
        console.warn('   1. Que el usuario tenga Latitud/Longitud en su dirección');
        console.warn('   2. Que el backend esté corriendo correctamente');
        console.warn('   3. Que el endpoint /api/Services/GetByCategory/{id} esté funcionando');
      }
    });
  }

  seleccionarCategoria(cat: CategoriaDTO): void {
    if (!cat?.idCategoriaServicio) return;

    this.searchResults = [];
    this.searchError = null;
    this.searchLoading = false;

    console.log('🎯 Categoría seleccionada:', cat.nombre, '(ID:', cat.idCategoriaServicio + ')');
    
    this.categoriaSeleccionada = cat;
    this.serviciosLoading = true;
    this.serviciosError = null;
    this.serviciosDeCategoria = []; 

    console.log('🔄 Cargando servicios de categoría', cat.idCategoriaServicio, '...');
    
    this.servicesService.getByCategoryNearMe(cat.idCategoriaServicio).subscribe({
      next: (servs) => {
        console.log('✅ Servicios recibidos:', servs);
        console.log('   📊 Cantidad:', servs?.length || 0);
        
        this.serviciosDeCategoria = servs ?? [];
        if (Array.isArray(servs) && servs.length === 0) {
          console.warn('⚠️ No se encontraron servicios en esta categoría');
          this.serviciosError = 'No encontramos servicios en esta categoría cerca de ti por ahora.';
        }
      },
      error: (err) => {
        console.error('❌ Error obteniendo servicios por categoría:', err);
        console.error('   Mensaje:', err?.message);
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
        console.log('✅ Usuario cargado:', me);
        if (me.direccion) {
          console.log('   📍 Dirección:', me.direccion);
          console.log('   📍 Latitud:', me.direccion.latitud, 'Longitud:', me.direccion.longitud);
        } else {
          console.warn('   ⚠️ Usuario SIN dirección registrada');
        }
        
        this.me = me;
        this.profileImageUrl = me.fotoPerfilUrl ? this.makeAbsoluteUrl(me.fotoPerfilUrl) : null;
        this.userName = me.nombre || 'Usuario';
        this.userInitials = this.computeInitials(this.userName);
        this.userDescription = me.descripcion ?? null;
        this.userRating = typeof me.evaluacion === 'number' ? me.evaluacion : null;

        if (typeof me.esProveedor === 'boolean' || typeof me.esCliente === 'boolean') {
          this.userRole = me.esProveedor ? 'proveedor' : 'cliente';
        }
        if (this.userRole === 'proveedor') {
          this.loadProveedorData();
        }
      },
      error: (err) => console.error('Error al obtener /Usuario/Me:', err)
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
    if (/^https?:\/\//i.test(ruta)) return ruta;
    return `${this.apiUrl}${ruta}`;
  }

  // ------------------ Navegación ------------------
  routePerfil() { this.router.navigate(['/perfil']); }
  routeRegistrarServicio() { this.router.navigate(['/registrar-servicio']); }
  get isProveedor(): boolean { return this.userRole === 'proveedor'; }
  get isCliente(): boolean { return this.userRole === 'cliente'; }

  // Métodos para acciones del dashboard de proveedor
  verDetalleServicio(servicio: any): void {
    console.log('Ver detalle de servicio:', servicio);
    this.toastService.show(`Ver detalles de: ${servicio.titulo}`, 'info');
  }

  editarServicio(servicio: any): void {
    this.router.navigate(['/registrar-servicio'], { queryParams: { id: servicio.id } });
  }

  deleteService(servicio: any): void {
    if (confirm(`¿Estás seguro de que deseas eliminar el servicio "${servicio.titulo}"?`)) {
      this.servicesService.deleteService(servicio.id).subscribe({
        next: () => {
          this.toastService.show('El servicio ha sido eliminado exitosamente.', 'success');
          this.loadProveedorData();
        },
        error: (err) => {
          console.error('Error al eliminar servicio', err);
          this.toastService.show('Error al eliminar el servicio: ' + (err.message || 'Error desconocido'), 'error');
        }
      });
    }
  }

  verTodasResenas(): void {
    this.router.navigate(['/calificaciones']); 
  }

  renderStars(rating: number): string {
    const filled = '★'.repeat(rating);
    const empty = '☆'.repeat(5 - rating);
    return filled + empty;
  }

  navigateToMyReviews(): void {
    this.router.navigate(['/calificaciones']); 
  }

  navigateToSavedServices(): void {
    this.router.navigate(['/servicios-guardados']);
  }

    navigateToHistorialSolicitudes(): void {
    this.router.navigate(['/historial-solicitud']);
  }

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
        this.toastService.show('Tu navegador no soporta acceso a la cámara', 'error');
        return;
      }
      this.closePhotoModal();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      this.showCameraModal(stream);
    } catch (error: any) {
      console.error('Error al acceder a la cámara:', error);
      if (error?.name === 'NotAllowedError') this.toastService.show('Acceso a la cámara denegado.', 'error');
      else if (error?.name === 'NotFoundError') this.toastService.show('No se encontró una cámara.', 'error');
      else if (error?.name === 'NotReadableError') this.toastService.show('La cámara está en uso por otra app.', 'error');
      else this.toastService.show('Error al acceder a la cámara.', 'error');
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
      this.toastService.show('Por favor selecciona un archivo de imagen válido', 'warning');
      target.value = '';
      return;
    }

    this.usersService.subirMiFoto(file, file.name).subscribe({
      next: (foto) => {
        this.profileImageUrl = this.makeAbsoluteUrl(foto.ruta);
      },
      error: (e) => {
        console.error('Error subiendo foto:', e);
        this.toastService.show('No se pudo subir la foto', 'error');
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
        this.toastService.show('No se pudo eliminar la foto', 'error');
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
          this.toastService.show('No se pudo subir la foto', 'error');
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
        this.toastService.show('No se pudo cambiar la cámara', 'error');
      }
    }
  }

  // ------------------ Logout ------------------
  openLogoutModal(): void { this.logoutModalVisible = true; }
  closeLogoutModal(): void { this.logoutModalVisible = false; }
  confirmLogout(): void {
    this.closeLogoutModal();
    this.authService.logout(); // <--- Reutilizas la lógica
  }

  // ------------------ Búsquedas ------------------
  buscarServicio(): void {
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    if (!searchInput) return;

    const query = searchInput.value.trim();
    if (!query) {
      this.toastService.show('Por favor ingresa un término de búsqueda', 'warning');
      return;
    }

    // 👇 Al buscar, deseleccionamos categoría y limpiamos sus servicios
    this.categoriaSeleccionada = null;
    this.serviciosDeCategoria = [];
    this.serviciosError = null;
    this.serviciosLoading = false;

    // ocultar categorías al buscar
    this.categoriasVisibles = false;

    this.searchLoading = true;
    this.searchError = null;
    this.searchResults = [];

    // guardar búsqueda reciente
    this.addRecentSearch(query);

    this.servicesService.searchServices(query).subscribe({
      next: (items) => {
        this.searchResults = items ?? [];
        if (this.searchResults.length === 0) {
          this.searchError = 'No se encontraron servicios que coincidan con tu búsqueda.';
        }
      },
      error: (err) => {
        console.error('Error al buscar servicios:', err);
        this.searchResults = [];
        this.searchError = err?.message || 'Error al realizar la búsqueda.';
      }
    }).add(() => {
      this.searchLoading = false;
    });
  }

  seleccionarServicio(servicio: string): void { console.log('Servicio seleccionado:', servicio); }
  buscarReciente(termino: string): void {
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    if (!searchInput) return;
    searchInput.value = termino;
    this.buscarServicio();
  }

  private addRecentSearch(term: string): void {
    const existingIndex = this.recentSearches.findIndex(t => t.toLowerCase() === term.toLowerCase());
    if (existingIndex !== -1) {
      this.recentSearches.splice(existingIndex, 1); 
    }

    this.recentSearches.unshift(term); 
    if (this.recentSearches.length > 3) {
      this.recentSearches.pop(); 
    }

    localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));
  }

  mostrarCategorias(): void {
    this.categoriasVisibles = true;
    this.searchResults = [];
    this.searchError = null;
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    if (searchInput) searchInput.value = '';
  }
  // ------------------ Métodos para Categorías y Servicios ------------------
  getCategoryEmoji(categoryName: string): string {
    const emojiMap: {[key: string]: string} = {
      'Aseo y Limpieza': '🧹',
      'Belleza y Bienestar': '💅',
      'Clases y Tutorías': '📚',
      'Costura y Arreglos': '🧵',
      'Cuidados y Acompañamiento': '🤝',
      'Eventos y Gastronomía': '🍽️',
      'Jardinería': '🌱',
      'Limpiezas Especiales': '✨',
      'Mascotas': '🐕',
      'Reparaciones': '🔧',
      'Tecnología': '💻',
      'Transporte': '🚗'
    };
    return emojiMap[categoryName] || '🔧';
  }

  getServiceCount(category: CategoriaDTO): number {
    return this.serviciosCountMap.get(category.idCategoriaServicio) ?? 0;
  }

  getProviderInitials(name: string | undefined): string {
    if (!name) return 'PR';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  volverACategorias(): void {
    this.categoriaSeleccionada = null;
    this.serviciosDeCategoria = [];
    this.serviciosError = null;
    this.categoriasVisibles = true;
  }

  contactarProveedor(servicio: ServicioDTO): void {
    // Intentar usar el teléfono del proveedor si viene en el DTO, sino usar uno por defecto o mostrar alerta
    const phone = servicio.telefonoProveedor || '+56912345678'; 
    
    if (!servicio.telefonoProveedor) {
      console.warn('El servicio no tiene teléfono de proveedor asociado en el DTO. Usando número de prueba.');
    }

    const message = encodeURIComponent(`Hola, me interesa tu servicio: ${servicio.titulo}`);
    window.open(`https://wa.me/${phone.replace(/\s/g, '')}?text=${message}`, '_blank');
  }

  guardarServicio(servicio: ServicioDTO): void {
    if (!this.me) {
      this.showNotification('Debes iniciar sesión para guardar servicios.', 'error');
      return;
    }

    this.servicesService.guardarServicio(servicio.idServicio).subscribe({
      next: (res: any) => {
        const msg = res?.message || 'Servicio guardado';
        this.showNotification(`${msg}: "${servicio.titulo}"`, 'success');
      },
      error: (err) => {
        console.error('Error al guardar servicio:', err);
        this.showNotification('Hubo un error al guardar el servicio.', 'error');
      }
    });
  }

  verDetalleServicioCliente(servicio: ServicioDTO): void {
    this.openServiceDetail(servicio.idServicio);
  }

  openServiceDetail(servicioId: number): void {
    this.selectedServiceId = servicioId;
    this.showDetailModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedServiceId = null;
    document.body.style.overflow = 'auto';
  }

  handleContactar(servicioId: number): void {
    console.log('Contactar servicio:', servicioId);
    this.closeDetailModal();
  }

  handleGuardar(servicioId: number): void {
    if (!this.me) {
      this.showNotification('Debes iniciar sesión para guardar servicios.', 'error');
      return;
    }

    this.servicesService.guardarServicio(servicioId).subscribe({
      next: (res: any) => {
        const msg = res?.message || 'Servicio guardado';
        this.showNotification(msg, 'success');
        this.closeDetailModal();
      },
      error: (err) => {
        console.error('Error al guardar servicio:', err);
        this.showNotification('Hubo un error al guardar el servicio.', 'error');
      }
    });
  }

  handleSolicitar(detalle: ServicioDetalleDTO): void {
    if (!this.me) {
      this.showNotification('Debes iniciar sesión para solicitar servicios.', 'error');
      return;
    }

    // Crear DTO de solicitud
    const dto: SolicitudCreateDTO = {
      idUsuario: this.me.idUsuario,
      idProveedor: detalle.proveedorId,
      idServicio: detalle.idServicio,
      fechaAgendamiento: this.getLocalISOString()
    };

    this.solicitudesService.crear(dto).subscribe({
      next: () => {
        this.showNotification('Solicitud creada exitosamente.', 'success');
        this.closeDetailModal();
        // Redirigir a historial
        setTimeout(() => {
          this.router.navigate(['/historial-solicitud']);
        }, 1500);
      },
      error: (err) => {
        console.error('Error creando solicitud:', err);
        this.showNotification('No se pudo crear la solicitud.', 'error');
      }
    });
  }

  private getLocalISOString(): string {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60000;
    const localTime = new Date(now.getTime() - offsetMs);
    return localTime.toISOString().slice(0, -1);
  }

  /**
   * Maneja errores de carga de imágenes mostrando placeholder
   */
  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.style.display = 'none';
    console.warn('Error al cargar imagen:', imgElement.src);
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

    // --------- Helpers de rating (estrellas con medias) ----------
  private clampRating(v: number | null | undefined): number {
    return typeof v === 'number' ? Math.max(0, Math.min(5, v)) : 0;
  }

  getStarStates(avg: number | null): ('full' | 'half' | 'empty')[] {
    const v = this.clampRating(avg);
    const states: ('full'|'half'|'empty')[] = [];
    for (let i = 1; i <= 5; i++) {
      if (v >= i) states.push('full');
      else if (v >= i - 0.5) states.push('half');
      else states.push('empty');
    }
    return states;
  }

  starIcon(state: 'full'|'half'|'empty'): string {
    return state === 'full' ? '★' : state === 'half' ? '⯨' : '☆';
  }

  openServiceReportModal(servicio: ServicioDTO): void {
    this.serviceReportTarget = servicio;
    this.serviceReportForm = { motivo: '', detalle: '' };
    this.serviceReportModalVisible = true;
  }

  closeServiceReportModal(): void {
    this.serviceReportModalVisible = false;
    this.serviceReportTarget = null;
  }

  sendServiceReport(): void {
    if (!this.me || !this.me.idUsuario) {
      this.toastService.show('No se pudo identificar al usuario actual.', 'error');
      return;
    }

    if (!this.serviceReportTarget) {
      this.toastService.show('No se ha seleccionado el servicio a denunciar.', 'error');
      return;
    }

    if (!this.serviceReportForm.motivo) {
      this.toastService.show('Debes seleccionar un motivo.', 'warning');
      return;
    }

    const detalle = this.serviceReportForm.detalle?.trim();
    const motivoFinal = detalle
      ? `${this.serviceReportForm.motivo} - ${detalle}`
      : this.serviceReportForm.motivo;

    const dto: DenunciaCreateDTO = {
      idUsuario: this.me.idUsuario,
      idSolicitud: null,
      idValorizacion: null,
      idServicio: this.serviceReportTarget.idServicio,
      motivo: motivoFinal
    };


    this.denunciasService.crearDenuncia(dto).subscribe({
      next: () => {
        this.toastService.show('Tu denuncia ha sido enviada. Gracias por ayudarnos a mantener la plataforma segura.', 'success');
        this.closeServiceReportModal();
      },
      error: (e) => {
        console.error('Error enviando denuncia de servicio:', e);
        this.toastService.show(e?.error || e?.message || 'No se pudo enviar la denuncia. Intenta nuevamente.', 'error');
      }
    });
  }

}
