import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'Capston';

  private readonly minPx = 13; // ~80% de 16px
  private readonly maxPx = 24; // ~150%
  private readonly stepPx = 1; // incremento por clic
  private readonly storageKey = 'a11y.baseFontSizePx';

  ngOnInit(): void {
    const saved = Number(localStorage.getItem(this.storageKey));
    if (!Number.isNaN(saved) && saved >= this.minPx && saved <= this.maxPx) {
      this.setBaseFont(saved);
    } else {
      // Asegurar valor por defecto
      this.setBaseFont(16);
    }
  }

  increaseFont() {
    const current = this.getCurrentBaseFont();
    const next = Math.min(this.maxPx, current + this.stepPx);
    this.setBaseFont(next);
  }

  decreaseFont() {
    const current = this.getCurrentBaseFont();
    const next = Math.max(this.minPx, current - this.stepPx);
    this.setBaseFont(next);
  }

  resetFont() {
    this.setBaseFont(16);
  }

  private getCurrentBaseFont(): number {
    const style = getComputedStyle(document.documentElement);
    const val = style.getPropertyValue('--base-font-size').trim();
    const px = Number(val.replace('px',''));
    return Number.isNaN(px) ? 16 : px;
  }

  private setBaseFont(px: number) {
    document.documentElement.style.setProperty('--base-font-size', `${px}px`);
    localStorage.setItem(this.storageKey, String(px));
  }
}
