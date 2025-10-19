import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { UsersService } from '../../core/services/users.service';
import { UsuarioDetalleDTO } from '../../core/models/usuario-detalle.dto';
import { API_URL } from '../../core/tokens/api-url.token';
import { ModificarUsuarioDTO } from '../../core/models/modificar-usuario.dto';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
  // Flags de validación UI
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
  
  // Subject manual evitando RxJS extra (mantener simple):
  direccionTimer: any = null;

  constructor(
    private router: Router,
    private usersService: UsersService,
    private fb: FormBuilder,
    @Inject(API_URL) private apiUrl: string
  ) {}

  // Datos de visualización
  userName = 'Usuario';
  userDescription: string | null = null;
  userRating: number | null = null;
  userPhone: string | null = null;
  profileImageUrl: string | null = null;
  userInitials = 'US';

  // Edición
  editMode = false;
  form!: FormGroup;
  selectedFile: File | null = null;

  ngOnInit(): void {
    this.buildForm();
    this.loadMe();
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
        this.profileImageUrl = me.fotoPerfilUrl ? this.makeAbsoluteUrl(me.fotoPerfilUrl) : null;
        this.userName = me.nombre || 'Usuario';
        this.userInitials = this.computeInitials(this.userName);
        this.userDescription = me.descripcion ?? null;
        this.userRating = typeof me.evaluacion === 'number' ? me.evaluacion : null;
        this.userPhone = me.telefono ?? null;
        this.isProveedor = !!me.esProveedor;
        this.isCliente   = !!me.esCliente && !this.isProveedor; 
        this.direccionId = me.direccion?.idDireccion ?? 0;

        this.form.patchValue({
          nombre: me.nombre || '',
          descripcion: me.descripcion || '',
          telefono: (me.telefono || '').replace(/\D/g, '').replace(/^56/, ''),
          correo: me.correo || '',
          idDireccion: this.direccionId,
          direccionDescripcion: me.direccion?.descripcion || '',
          codigoPostal: me.direccion?.codigoPostal || ''
        });
        this.initialDireccionDescripcion = this.form.value.direccionDescripcion || '';
        this.initialCodigoPostal = this.form.value.codigoPostal || '';

        this.form.markAsPristine();
        this.form.markAsUntouched();
        this.dataLoaded = true; // <<<<<< habilita botones
      },
      error: (err) => {
        console.error('Error cargando perfil:', err);
        this.dataLoaded = true; // evita que quede bloqueado si falla
      }
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
      alert('Selecciona una imagen válida (JPG, PNG o WEBP).');
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
      alert('Selecciona una dirección válida de las sugerencias.');
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

        alert('Perfil actualizado correctamente.');
      },
      error: (e) => {
        console.error('Error al guardar perfil:', e);
        alert(e?.error?.message || 'No se pudo actualizar el perfil.');
      }
    }).add(() => {
      this.saving = false;
    });
  }

  // Navegación / sesión
  goBack(): void { this.router.navigate(['/']); }
  logout(): void {
    try {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('userPreferences');
      localStorage.removeItem('auth_token');
      sessionStorage.clear();
      this.router.navigate(['/login']);
    } catch (e) {
      console.error('Error al cerrar sesión:', e);
    }
  }

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

}
