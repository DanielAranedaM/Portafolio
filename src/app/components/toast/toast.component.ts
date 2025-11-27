import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastData } from '../../core/services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css']
})
export class ToastComponent implements OnInit, OnDestroy {
  toast: ToastData | null = null;
  private sub: Subscription | null = null;
  private timeoutId: any;

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.sub = this.toastService.toast$.subscribe(data => {
      if (data) {
        this.toast = data;
        if (this.timeoutId) clearTimeout(this.timeoutId);
        this.timeoutId = setTimeout(() => {
          this.close();
        }, data.duration || 3000);
      }
    });
  }

  close() {
    this.toast = null;
    this.toastService.clear();
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
    if (this.timeoutId) clearTimeout(this.timeoutId);
  }
}
