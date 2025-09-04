import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChatbotComponent } from '../../components/chatbot/chatbot.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ChatbotComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  constructor(private router: Router) {}
  
  //Navegar a Login
  routeLogin() {
    this.router.navigate(['/login']);
  }
}
