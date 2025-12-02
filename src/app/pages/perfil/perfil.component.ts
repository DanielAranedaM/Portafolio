import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';

import { UsersService } from '../../core/services/users.service';
import { ServicesService } from '../../core/services/services.service';
import { UsuarioDetalleDTO } from '../../core/models/usuario-detalle.dto';
import { API_URL } from '../../core/tokens/api-url.token';
import { ModificarUsuarioDTO } from '../../core/models/modificar-usuario.dto';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {
  isProveedor = false;
  isCliente = false;
  dataLoaded = false;
  saving = false;
  private direccionId = 0;
  osmComuna: string | null = null;
  osmRegion: string | null = null;
  private initialDireccionDescripcion = '';
  private initialCodigoPostal = '';
  submitted = false;

  // OSM
  sugerencias: Array<{
    place_id: number;
    display_name: string;
    lat?: string;
    lon?: string;
    address?: { postcode?: string };
  }> = [];
  mostrandoSugerencias = false;
  direccionSeleccionada: { place_id: number; display_name: string; postcode?: string } | null = null;
  osmLat: number | null = null;
  osmLon: number | null = null;
  
  direccionTimer: any = null;
  
  isPublicProfile = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private usersService: UsersService,
    private servicesService: ServicesService,
    private fb: FormBuilder,
    private toastService: ToastService,
    @Inject(API_URL) private apiUrl: string
  ) {}

  // Datos de visualización
  userName = 'Usuario';
  userDescription: string | null = null;
  userRating: number | null = null;
  userPhone: string | null = null;
  profileImageUrl: string | null = null;
  userInitials = 'US';

  editingDescription = false;
  tempDescription = '';
  activeTab = 'servicios';
  userServices: any[] = [];
  userRecommendations: any[] = [];
  galleryPhotos: any[] = [];

  // Datos de ejemplo (mientras no hay API)
  private initializeExampleData() {
    // Servicios de ejemplo
    this.userServices = [
      {
        id: 101,
        titulo: 'Limpieza del hogar',
        categoria: 'Aseo y Limpieza',
        descripcion: 'Servicio completo de limpieza para hogares, incluye pisos, baños, cocina y dormitorios. Trabajo con productos de calidad.',
        fechaCreacion: new Date('2024-10-15'),
        urlFoto: '/assets/imagen/trabajo1.jpg' // Use a placeholder or existing asset
      },
      {
        id: 102,
        titulo: 'Jardinería básica',
        categoria: 'Jardinería',
        descripcion: 'Mantención de jardines, poda de plantas, riego y cuidado general de áreas verdes.',
        fechaCreacion: new Date('2024-09-20'),
        urlFoto: '/assets/imagen/trabajo1.jpg'
      }
    ];

    // Recomendaciones de ejemplo
    this.userRecommendations = [
      {
        clientName: 'Elena Nito',
        rating: 5,
        comment: 'Excelente trabajo en mi jardín. Muy profesional y puntual.',
        date: new Date('2024-11-15')
      },
      {
        clientName: 'Armando Casas',
        rating: 5,
        comment: 'Recomiendo 100%. Transformó completamente mi patio.',
        date: new Date('2024-11-08')
      },
      {
        clientName: 'María García',
        rating: 4,
        comment: 'Muy buen servicio, cumplió con los tiempos acordados.',
        date: new Date('2024-11-02')
      }
    ];

    // Galería de ejemplo
    this.galleryPhotos = [
      {
        url: '/assets/imagen/trabajo1.jpg',
        description: 'Jardín terminado',
        id: 1
      }
    ];
  }

  // Edición
  editMode = false;
  form!: FormGroup;
  selectedFile: File | null = null;

  ngOnInit(): void {
    this.buildForm();
    
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isPublicProfile = true;
      this.loadUserById(+idParam);
    } else {
      this.loadMe();
    }
  }

  private loadUserById(id: number): void {
    this.usersService.getById(id).subscribe({
      next: (user) => {
        this.populateUserData(user);
        this.form.disable(); // Deshabilitar formulario en modo lectura
        this.dataLoaded = true;
        this.initializeExampleData();
      },
      error: (err) => {
        console.error('Error cargando perfil de usuario:', err);
        this.router.navigate(['/menu']);
      }
    });
  }

  private buildForm(): void {
    this.form = this.fb.group({
      // Usuario
      nombre: ['', [Validators.required, Validators.maxLength(200)]],
      descripcion: ['', [Validators.maxLength(300)]],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]], // requerido
      correo: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],

      // Dirección
      idDireccion: [0], // oculto, no se muestra
      direccionDescripcion: ['', [Validators.required, Validators.maxLength(300)]],
      codigoPostal: ['', [Validators.maxLength(20)]], // opcional
    });
  }

  private loadMe(): void {
    this.usersService.getMe().subscribe({
      next: (me: UsuarioDetalleDTO) => {
        this.populateUserData(me);
        
        // Snapshots para edición (solo en mi perfil)
        this.initialDireccionDescripcion = this.form.value.direccionDescripcion || '';
        this.initialCodigoPostal = this.form.value.codigoPostal || '';

        this.form.markAsPristine();
        this.form.markAsUntouched();
        this.dataLoaded = true; 
        
        if (this.isProveedor) {
          this.loadServicesForMe();
        } else {
          this.initializeExampleData();
        }
      },
      error: (err) => {
        console.error('Error cargando perfil:', err);
        this.dataLoaded = true; 
      }
    });
  }

  private loadServicesForMe(): void {
    this.servicesService.getDashboardDataForProveedor().subscribe({
      next: (data) => {
        this.userServices = (data || []).map(s => ({
          id: s.idServicio,
          titulo: s.titulo,
          categoria: s.categoriaNombre || `Cat #${s.idCategoriaServicio}`,
          fechaCreacion: s.fechaPublicacion ? new Date(s.fechaPublicacion) : new Date(),
          urlFoto: s.urlFotoPrincipal
            ? this.makeAbsoluteUrl(s.urlFotoPrincipal)
            : '/assets/imagen/default-service.png',
          descripcion: s.descripcion || 'Sin descripción' // Backend might not return description in dashboard data
        }));
      },
      error: (err) => {
        console.error('Error cargando servicios del proveedor:', err);
        this.userServices = [];
      }
    });
  }

  private populateUserData(user: UsuarioDetalleDTO): void {
    this.profileImageUrl = user.fotoPerfilUrl ? this.makeAbsoluteUrl(user.fotoPerfilUrl) : null;
    this.userName = user.nombre || 'Usuario';
    this.userInitials = this.computeInitials(this.userName);
    this.userDescription = user.descripcion ?? null;
    this.userRating = typeof user.evaluacion === 'number' ? user.evaluacion : null;
    this.userPhone = user.telefono ?? null;
    this.isProveedor = !!user.esProveedor;
    this.isCliente   = !!user.esCliente && !this.isProveedor; 
    this.direccionId = user.direccion?.idDireccion ?? 0;

    this.form.patchValue({
      nombre: user.nombre || '',
      descripcion: user.descripcion || '',
      telefono: (user.telefono || '').replace(/\D/g, '').replace(/^56/, ''),
      correo: user.correo || '',
      idDireccion: this.direccionId,
      direccionDescripcion: user.direccion?.descripcion || '',
      codigoPostal: user.direccion?.codigoPostal || ''
    });
  }

  // Helpers
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

  get hasProfileImage(): boolean { return this.profileImageUrl !== null; }

  // UI
  toggleEdit(): void {
    if (!this.dataLoaded || this.saving) return;
    this.editMode = !this.editMode;
    if (!this.editMode) {
      this.selectedFile = null;
    }
  }

  onFilePicked(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input?.files?.[0] || null;
    if (!file) { this.selectedFile = null; return; }
    if (!file.type.startsWith('image/')) {
      this.toastService.show('Selecciona una imagen válida (JPG, PNG o WEBP).', 'warning');
      input.value = '';
      return;
    }

    const MAX = 512; // tamaño objetivo
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        // calculamos “cover” dentro de un cuadrado MAX x MAX
        const canvas = document.createElement('canvas');
        canvas.width = MAX;
        canvas.height = MAX;
        const ctx = canvas.getContext('2d');
        if (!ctx) { this.selectedFile = file; return; }

        const srcW = img.width, srcH = img.height;
        const scale = Math.max(MAX / srcW, MAX / srcH);
        const newW = srcW * scale, newH = srcH * scale;
        const dx = (MAX - newW) / 2;
        const dy = (MAX - newH) / 2;

        ctx.drawImage(img, dx, dy, newW, newH);

        canvas.toBlob((blob) => {
          if (blob) {
            // reemplazamos el file que enviaremos
            const name = file.name?.replace(/\.[^.]+$/, '') || 'foto';
            const resized = new File([blob], `${name}.jpg`, { type: 'image/jpeg' });
            this.selectedFile = resized;
          } else {
            this.selectedFile = file;
          }
        }, 'image/jpeg', 0.85);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  save(): void {
    // no guardar si aún no cargó o ya está guardando
    if (!this.dataLoaded || this.saving) return;

    // forzar mensajes de error aunque no se haya tocado
    this.submitted = true;

    // validación de Angular
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();

    // estado actual de dirección/CP
    const newDesc = (v.direccionDescripcion ?? '').trim();
    const newCP   = (v.codigoPostal ?? '').trim();

    // si no tiene dirección, vamos a CREAR (permitimos entrar al modal sin dirección)
    const isCreatingAddress = !this.direccionId || this.direccionId <= 0;

    // ¿cambió la dirección o CP respecto al snapshot, o estamos creando?
    const addressChanged =
      isCreatingAddress ||
      newDesc !== (this.initialDireccionDescripcion ?? '') ||
      newCP   !== (this.initialCodigoPostal ?? '');

    // si vamos a crear o cambiar dirección, exigir selección OSM
    if (addressChanged && !this.direccionSeleccionada) {
      this.toastService.show('Selecciona una dirección válida de las sugerencias.', 'warning');
      return;
    }

    // construir payload (comuna/region solo si cambia o se crea dirección)
    const payload: ModificarUsuarioDTO = {
      nombre: (v.nombre ?? '').trim(),
      descripcion: (v.descripcion ?? '').trim() || null,
      telefono: String(v.telefono ?? '').trim(),
      correo: (v.correo ?? '').trim(),

      idDireccion: Number(this.direccionId || 0),
      direccionDescripcion: newDesc,
      codigoPostal: newCP || this.direccionSeleccionada?.postcode || null,

      ...(addressChanged && this.osmComuna != null ? { comuna: this.osmComuna } : {}),
      ...(addressChanged && this.osmRegion != null ? { region: this.osmRegion } : {}),

      // NUEVO: sólo si cambia/crea dirección enviamos coords
      ...(addressChanged && this.osmLat != null ? { latitud: this.osmLat } : {}),
      ...(addressChanged && this.osmLon != null ? { longitud: this.osmLon } : {}),
    };

    this.saving = true;

    this.usersService.modificarMe(
      payload,
      this.selectedFile || undefined,
      this.selectedFile?.name
    ).subscribe({
      next: (updated) => {
        // refrescar visual
        this.profileImageUrl = updated.fotoPerfilUrl ? this.makeAbsoluteUrl(updated.fotoPerfilUrl) : null;
        this.userName = updated.nombre || 'Usuario';
        this.userInitials = this.computeInitials(this.userName);
        this.userDescription = updated.descripcion ?? null;
        this.userRating = typeof updated.evaluacion === 'number' ? updated.evaluacion : null;
        this.userPhone = updated.telefono ?? null;

        // rehidratar form con respuesta real (incluye posible dirección recién creada)
        this.direccionId = updated.direccion?.idDireccion ?? this.direccionId ?? 0;
        this.form.patchValue({
          nombre: updated.nombre || '',
          descripcion: updated.descripcion || '',
          telefono: (updated.telefono || '').replace(/\D/g, '').replace(/^56/, ''),
          correo: updated.correo || '',
          idDireccion: this.direccionId,
          direccionDescripcion: updated.direccion?.descripcion || newDesc,
          codigoPostal: updated.direccion?.codigoPostal || newCP
        });

        // actualizar snapshots para futuras comparaciones
        this.initialDireccionDescripcion = this.form.value.direccionDescripcion || '';
        this.initialCodigoPostal = this.form.value.codigoPostal || '';

        // limpiar estados UI
        this.editMode = false;
        this.selectedFile = null;
        this.submitted = false;

        // limpiar selección OSM usada (evita falsos positivos después)
        this.direccionSeleccionada = null;
        this.osmComuna = null;
        this.osmRegion = null;

        this.toastService.show('Perfil actualizado correctamente.', 'success');
      },
      error: (e) => {
        console.error('Error al guardar perfil:', e);
        this.toastService.show(e?.error?.message || 'No se pudo actualizar el perfil.', 'error');
      }
    }).add(() => {
      this.saving = false;
    });
  }

  // Navegación / sesión
  goBack(): void { this.router.navigate(['/menu']); }

  onDireccionInput(texto: string): void {
    this.direccionSeleccionada = null;
    this.mostrandoSugerencias = false;

    // invalidar valores OSM si cambia el texto
    this.osmComuna = null;
    this.osmRegion = null;
    this.osmLat = null;
    this.osmLon = null;

    const q = (texto ?? '');
    if (this.direccionTimer) clearTimeout(this.direccionTimer);
    if (!q.trim() || q.trim().length < 3) { this.sugerencias = []; return; }

    this.direccionTimer = setTimeout(() => this.buscarNominatim(q), 350);
  }

  async buscarNominatim(q: string): Promise<void> {
    try {
      const url =
        'https://nominatim.openstreetmap.org/search?' +
        `format=jsonv2&addressdetails=1&limit=8&countrycodes=cl&q=${encodeURIComponent(q)}`;

      const resp = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!resp.ok) { this.sugerencias = []; this.mostrandoSugerencias = false; return; }

      const data = await resp.json();
      // normalizamos solo lo que usamos
      this.sugerencias = (data || []).map((d: any) => ({
        place_id: d.place_id,
        display_name: d.display_name,
        lat: d.lat,
        lon: d.lon,
        address: d.address
      }));
      this.mostrandoSugerencias = this.sugerencias.length > 0;
    } catch {
      this.sugerencias = [];
      this.mostrandoSugerencias = false;
    }
  }

  seleccionarSugerencia(item: any): void {
    const addr = item?.address || {};
    const comuna =
      addr.city || addr.town || addr.village || addr.suburb || addr.municipality || addr.county || null;
    const region = addr.region || addr.state || null;

    // Guardar comuna/región normalizadas
    this.osmComuna = comuna?.toString() ?? null;
    this.osmRegion = region?.toString() ?? null;

    // NUEVO: lat/lon desde OSM (strings -> number)
    const lat = item?.lat != null ? Number(item.lat) : null;
    const lon = item?.lon != null ? Number(item.lon) : null;
    this.osmLat = isFinite(lat as number) ? (lat as number) : null;
    this.osmLon = isFinite(lon as number) ? (lon as number) : null;

    // Código postal
    const postcode = addr.postcode || '';

    this.direccionSeleccionada = {
      place_id: item.place_id,
      display_name: item.display_name,
      postcode
    };

    // Rellenar campos visibles
    this.form.patchValue({
      direccionDescripcion: item.display_name,
      codigoPostal: postcode || this.form.value.codigoPostal || ''
    }, { emitEvent: false });

    this.mostrandoSugerencias = false;
  }

  abrirSugerenciasSiHay(): void {
    this.mostrandoSugerencias = this.sugerencias.length > 0;
  }

  cerrarSugerencias(): void {
    // pequeño delay para permitir click
    setTimeout(() => this.mostrandoSugerencias = false, 150);
  }

  get descCount(): number {
    const v = this.form?.get('descripcion')?.value ?? '';
    return typeof v === 'string' ? v.length : 0;
  }

  get addressChanged(): boolean {
    const v = this.form?.getRawValue?.() ?? {};
    const newDesc = (v.direccionDescripcion ?? '').trim();
    const newCP   = (v.codigoPostal ?? '').trim();
    return newDesc !== (this.initialDireccionDescripcion ?? '') ||
          newCP   !== (this.initialCodigoPostal ?? '');
  }

  // =================== NUEVOS MÉTODOS PARA INTERFAZ MODERNA ===================

  // Edición de descripción inline
  startEditDescription(): void {
    this.editingDescription = true;
    this.tempDescription = this.userDescription || '';
  }

  saveDescription(): void {
    if (this.tempDescription.length <= 300) {
      this.userDescription = this.tempDescription.trim();
      this.editingDescription = false;
      // Aquí iría la llamada a la API para guardar
      console.log('Guardando descripción:', this.userDescription);
    }
  }

  cancelEditDescription(): void {
    this.editingDescription = false;
    this.tempDescription = '';
  }

  // Manejo de pestañas
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  // Contacto
  openWhatsApp(): void {
    if (this.userPhone) {
      const message = encodeURIComponent('Hola! Vi tu perfil en El Dato y me interesa conocer más sobre tus servicios.');
      window.open(`https://wa.me/56${this.userPhone}?text=${message}`, '_blank');
    }
  }

  // Navegación
  goToRegisterService(): void {
    this.router.navigate(['/registrar-servicio']);
  }

  // Galería
  addPhoto(): void {
    console.log('Agregar foto - implementar modal de subida');
    // Aquí iría la lógica para subir fotos
  }

  removePhoto(index: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta foto?')) {
      this.galleryPhotos.splice(index, 1);
      console.log('Foto eliminada:', index);
    }
  }

  viewPhoto(photo: any): void {
    console.log('Ver foto:', photo);
    // Aquí iría un modal para ver la foto en grande
  }

}
