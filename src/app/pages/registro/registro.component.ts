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

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css',
})
export class RegistroComponent implements OnInit, OnDestroy {
  constructor(private router: Router) {}

  routeLogin() {
    this.router.navigate(['/login']);
  }

  // --- Autocompletado Dirección ---
  private direccionInput$ = new Subject<string>();
  private sub?: Subscription;

  sugerencias: NominatimResult[] = [];
  mostrandoSugerencias = false;

  direccionSeleccionada: string | null = null;
  latSeleccionada: string | null = null;
  lonSeleccionada: string | null = null;

  ngOnInit() {
    this.sub = this.direccionInput$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        filter((txt) => (txt ?? '').trim().length >= 3),
        switchMap((texto) => from(this.buscarNominatim(texto)))
      )
      .subscribe((res) => {
        console.log('Resultados Nominatim:', res); // <-- ver en consola
        this.sugerencias = res;
        this.mostrandoSugerencias = res.length > 0;
      });
  }

  onDireccionInput(texto: string) {
    console.log('Input dirección:', texto); // <-- verifica que se dispare
    this.direccionSeleccionada = null;
    this.latSeleccionada = null;
    this.lonSeleccionada = null;
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
    this.direccionSeleccionada = item.display_name;
    this.latSeleccionada = item.lat;
    this.lonSeleccionada = item.lon;
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
}
