import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
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

import { ServicesService } from '../../core/services/services.service';
import { UsersService } from '../../core/services/users.service';
import { CategoriasService } from '../../core/services/categorias.service';

import { CreateServiceDTO } from '../../core/models/create-Service.dto';
import { DireccionDTO } from '../../core/models/direccion.dto';
import { CategoriaDTO } from '../../core/models/categoria.dto';

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
  selector: 'app-registrar-servicio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registrar-servicio.component.html',
  styleUrl: './registrar-servicio.component.css'
})
export class RegistrarServicioComponent implements OnInit, OnDestroy {
  currentStep = 1;
  totalSteps = 3;

  form!: FormGroup;
  selectedFiles: File[] = [];

  // categorías
  categorias: CategoriaDTO[] = [];
  cargandoCategorias = false;

  // OSM / Nominatim
  private direccionInput$ = new Subject<string>();
  private sub?: Subscription;
  sugerencias: NominatimResult[] = [];
  mostrandoSugerencias = false;
  direccionSeleccionada: NominatimResult | null = null;
  latSeleccionada: string | null = null;
  lonSeleccionada: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private servicesService: ServicesService,
    private usersService: UsersService,
    private categoriasService: CategoriasService
  ) {
    this.form = this.fb.group({
      nombreServicio: ['', [Validators.required, Validators.minLength(3)]],
      categoria: ['', Validators.required], // value será un ID numérico
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      precio: [''], // Campo opcional - podrá ser agregado más tarde
      direccionDescripcion: ['']
    });
  }

  ngOnInit() {
    // Cargar categorías desde API
    this.cargandoCategorias = true;
    this.categoriasService.getAll().subscribe({
      next: (cats) => {
        this.categorias = cats ?? [];
        this.cargandoCategorias = false;
      },
      error: (err) => {
        console.error('Error al cargar categorías', err);
        this.cargandoCategorias = false;
      }
    });

    // Precargar dirección REAL desde la API (SQL)
    this.usersService.getMe().subscribe({
      next: (user) => {
        const desc = (user?.direccion?.descripcion ?? '').toString().trim();
        if (desc) {
          this.form.patchValue({ direccionDescripcion: desc });
        }
      },
      error: (err) => {
        console.warn('No se pudo precargar dirección desde API:', err);
        this.precargarDesdeLocalStorage();
      }
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

  private precargarDesdeLocalStorage() {
    const userData = localStorage.getItem('userData');
    if (!userData) return;
    try {
      const user = JSON.parse(userData);
      const desc = (user?.direccion ?? '').toString();
      if (desc) this.form.patchValue({ direccionDescripcion: desc });
    } catch (e) {
      console.error('Error al parsear userData:', e);
    }
  }

  // ======= OSM / Nominatim =======
  onDireccionInput(texto: string) {
    this.direccionSeleccionada = null;
    this.latSeleccionada = null;
    this.lonSeleccionada = null;
    this.form.patchValue({ direccionDescripcion: (texto ?? '').trim() }, { emitEvent: false });
    this.direccionInput$.next((texto ?? '').trim());
  }

  abrirSugerenciasSiHay() {
    this.mostrandoSugerencias = this.sugerencias.length > 0;
  }

  onDireccionBlur() {
    setTimeout(() => this.cerrarSugerencias(), 150);
  }

  cerrarSugerencias() {
    this.mostrandoSugerencias = false;
  }

  async buscarNominatim(q: string): Promise<NominatimResult[]> {
    const url =
      'https://nominatim.openstreetmap.org/search?' +
      `format=jsonv2&addressdetails=1&limit=8&countrycodes=cl&q=${encodeURIComponent(q)}`;

    const resp = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!resp.ok) return [];
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
  // ======= /OSM =======

  // Método auxiliar para obtener el nombre de la categoría
  getCategoriaName(categoriaId: number | string): string {
    if (!categoriaId) return '';
    
    // Si las categorías aún no han cargado
    if (!this.categorias || this.categorias.length === 0) {
      return 'Cargando...';
    }
    
    // Convertir a number si es string
    const id = typeof categoriaId === 'string' ? parseInt(categoriaId, 10) : categoriaId;
    
    const categoria = this.categorias.find(c => c.idCategoriaServicio === id);
    return categoria ? categoria.nombre : 'Categoría no encontrada';
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files: FileList | null = input.files;
    if (files) {
      this.selectedFiles = Array.from(files).slice(0, 5) as File[];
    }
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  nextStep() {
    if (this.currentStep < this.totalSteps && this.isStepValid(this.currentStep)) {
      this.currentStep++;
    } else {
      this.form.markAllAsTouched();
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        return !!(this.form.get('nombreServicio')?.valid && this.form.get('categoria')?.valid);
      case 2:
        return !!(this.form.get('descripcion')?.valid);
      case 3:
        return true;
      default:
        return false;
    }
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  // === SUBMIT ===
  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Ahora el select tiene IDs reales -> Number directo
    const idCategoriaServicio = Number(this.form.value.categoria) || 0;
    if (idCategoriaServicio <= 0) {
      alert('Selecciona una categoría válida.');
      return;
    }

    const direccion: DireccionDTO | null = this.toDireccionDTO();

    const payload: CreateServiceDTO = {
      titulo: (this.form.value.nombreServicio ?? '').trim(),
      descripcion: (this.form.value.descripcion ?? '').trim(),
      precioBase: Number(this.form.value.precio) ?? 0,
      idCategoriaServicio,
      direccion,
      fotos: null
    };

    this.servicesService.createService(payload).subscribe({
      next: () => this.router.navigate(['/menu']),
      error: (err) => {
        console.error('Error al crear servicio:', err);
        alert(err?.message || 'Error al crear el servicio');
      }
    });
  }

  private toDireccionDTO(): DireccionDTO | null {
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
