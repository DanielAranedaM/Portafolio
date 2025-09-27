import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  Subject,
  Subscription,
  from,
  debounceTime,
  distinctUntilChanged,
  filter,
  switchMap,
} from 'rxjs';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AccessService } from '../../core/services/access.service';
import { UsuarioDTO } from '../../core/models/usuario.dto';

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    state?: string;
    region?: string;
    county?: string;
    municipality?: string;
  };
};

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  standalone: true,
  imports: [CommonModule],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css',
})
export class RegistroComponent implements OnInit, OnDestroy {

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private access: AccessService
  ) {}

  routeLogin() {
    this.router.navigate(['/login']);
  }

  // ---------- Reactive Form ----------
  form!: FormGroup; // se inicializa en ngOnInit

  get passwordsMatch(): boolean {
    if (!this.form) return false;
    const p1 = this.form.value.contrasena;
    const p2 = this.form.value.repetirContrasena;
    return !!p1 && !!p2 && p1 === p2;
  }

  showPass = false;
  showPass2 = false;
  togglePassword() { this.showPass = !this.showPass; }
  togglePassword2() { this.showPass2 = !this.showPass2; }

  // ---------- Autocompletado Dirección ----------
  private direccionInput$ = new Subject<string>();
  private sub?: Subscription;

  sugerencias: NominatimResult[] = [];
  mostrandoSugerencias = false;

  direccionSeleccionada: NominatimResult | null = null;
  latSeleccionada: string | null = null;
  lonSeleccionada: string | null = null;
  today = this.toYMD(new Date());

  ngOnInit() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(200)]],
      fechaNacimiento: ['', [Validators.required]],
      direccionDescripcion: ['', [Validators.required]],
      correo: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      contrasena: ['', [Validators.required, Validators.minLength(6)]],
      repetirContrasena: ['', [Validators.required]],
      tipoUsuario: ['solicitante', [Validators.required]],
      telefono: [''] // opcional
    });


    // Suscripción a Nominatim
    this.sub = this.direccionInput$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        filter((txt) => (txt ?? '').trim().length >= 3),
        switchMap((texto) => from(this.buscarNominatim(texto)))
      )
      .subscribe((res) => {
        this.sugerencias = res;
        this.mostrandoSugerencias = res.length > 0;
      });
  }

  onDireccionInput(texto: string) {
    this.direccionSeleccionada = null;
    this.latSeleccionada = null;
    this.lonSeleccionada = null;
    this.form.patchValue({ direccionDescripcion: (texto ?? '').trim() }, { emitEvent: false });
    this.direccionInput$.next((texto ?? '').trim());
  }

  onDireccionBlur() {
    setTimeout(() => this.cerrarSugerencias(), 150);
  }

  async buscarNominatim(q: string): Promise<NominatimResult[]> {
    const url =
      'https://nominatim.openstreetmap.org/search?' +
      `format=jsonv2&addressdetails=1&limit=8&countrycodes=cl&q=${encodeURIComponent(q)}`;

    const resp = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!resp.ok) {
      console.warn('Nominatim respondió con estado', resp.status);
      return [];
    }
    return resp.json();
  }

  seleccionarSugerencia(item: NominatimResult, inputEl: HTMLInputElement) {
    inputEl.value = item.display_name;
    this.direccionSeleccionada = item;
    this.latSeleccionada = item.lat;
    this.lonSeleccionada = item.lon;
    this.form.patchValue({ direccionDescripcion: item.display_name }, { emitEvent: false });
    this.cerrarSugerencias();
  }

  abrirSugerenciasSiHay() {
    this.mostrandoSugerencias = this.sugerencias.length > 0;
  }

  cerrarSugerencias() {
    this.mostrandoSugerencias = false;
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  // helper para pintar errores de un control
  invalid(ctrlName: string): boolean {
    const c = this.form.get(ctrlName);
    return !!c && c.invalid && (c.touched || c.dirty);
  }


  // ---------- Registro ----------
  onSubmit() {
    if (this.form.invalid || !this.passwordsMatch) {
      this.form.markAllAsTouched();
      return;
    }

    const tipo = this.form.value.tipoUsuario as 'proveedor' | 'solicitante';
    const esProveedor = tipo === 'proveedor';
    const esCliente = tipo === 'solicitante';

    // yyyy-MM-dd (para DateOnly del backend)
    const fn: string = this.toYMD(this.form.value.fechaNacimiento);

    const dirDto = this.toDireccionDTO();

    const payload: UsuarioDTO = {
      correo: (this.form.value.correo ?? '').trim(),
      nombre: (this.form.value.nombre ?? '').trim(),
      contrasena: this.form.value.contrasena,
      esCliente,
      esProveedor,
      telefono: (this.form.value.telefono ?? '').trim() || null,
      fechaNacimiento: fn,
      direccion: dirDto,
      // campos que el backend ignora/establece
      idUsuario: 0,
      fechaCreacion: new Date().toISOString(),
      evaluacion: null,
      descripcion: null,
      idDireccion: null,
      fotoPerfilUrl: null
    } as unknown as UsuarioDTO;

    this.access.register(payload).subscribe({
      next: () => this.routeLogin(),
      error: (err) => {
        console.error('Error de registro', err);
        // aquí puedes manejar ValidationProblemDetails si err.errors existe
      }
    });
  }

  private toYMD(dateInput: string | Date): string {
    const d = new Date(dateInput);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private toDireccionDTO() {
    const desc = (this.form.value.direccionDescripcion ?? '').trim();
    if (!desc) return null;

    const addr = this.direccionSeleccionada?.address;
    const comuna =
      (addr?.city || addr?.town || addr?.village || addr?.suburb || addr?.municipality || addr?.county) ?? null;
    const region =
      (addr?.region || addr?.state) ?? null;
    const codigoPostal = addr?.postcode ?? null;

    return {
      idDireccion: 0,
      descripcion: desc,
      comuna,
      region,
      codigoPostal
    };
  }
}
