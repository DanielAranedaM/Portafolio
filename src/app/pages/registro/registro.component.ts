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
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
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

const passwordsMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const p = group.get('password')?.value ?? '';
  const r = group.get('repeatPassword')?.value ?? '';
  return p && r && p === r ? null : { passwordsMismatch: true };
};

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css'],
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

  form!: FormGroup;
  showPass = false;
  showPass2 = false;
  togglePassword() { this.showPass = !this.showPass; }
  togglePassword2() { this.showPass2 = !this.showPass2; }

  private direccionInput$ = new Subject<string>();
  private sub?: Subscription;

  sugerencias: NominatimResult[] = [];
  mostrandoSugerencias = false;

  direccionSeleccionada: NominatimResult | null = null;
  latSeleccionada: string | null = null;
  lonSeleccionada: string | null = null;
  today = this.toYMD(new Date());

  get passwordsMatch(): boolean {
    const g = this.form.get('passwordGroup');
    return !!g && !g.invalid && !g.errors?.['passwordsMismatch'];
  }

  ngOnInit() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(200)]],
      fechaNacimiento: ['', [Validators.required]],
      direccionDescripcion: ['', [Validators.required]],
      correo: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      telefono: [''], // opcional
      tipoUsuario: ['solicitante', [Validators.required]],
      // Grupo de contraseñas
      passwordGroup: this.fb.group(
        {
          password: ['', [Validators.required, Validators.minLength(6)]],
          repeatPassword: ['', [Validators.required]],
        },
        { validators: passwordsMatchValidator }
      ),
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

  invalid(ctrlName: string): boolean {
    const c = this.form.get(ctrlName);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const tipo = this.form.value.tipoUsuario as 'proveedor' | 'solicitante';
    const esProveedor = tipo === 'proveedor';
    const esCliente = tipo === 'solicitante';

    const fn: string = this.toYMD(this.form.value.fechaNacimiento);
    const dirDto = this.toDireccionDTO();

    const password = this.form.get('passwordGroup.password')?.value as string;

    const payload: UsuarioDTO = {
      correo: (this.form.value.correo ?? '').trim(),
      nombre: (this.form.value.nombre ?? '').trim(),
      contrasena: password,
      esCliente,
      esProveedor,
      telefono: (this.form.value.telefono ?? '').trim() || null,
      fechaNacimiento: fn,
      direccion: dirDto,
      idUsuario: 0,
      fechaCreacion: new Date().toISOString(),
      evaluacion: null,
      descripcion: null,
      idDireccion: null,
      fotoPerfilUrl: null,
    } as unknown as UsuarioDTO;

    this.access.register(payload).subscribe({
      next: () => this.routeLogin(),
      error: (err) => {
        console.error('Error de registro', err);
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
