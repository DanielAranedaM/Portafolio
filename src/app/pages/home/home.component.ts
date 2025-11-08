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

  // Pasos de "Cómo funciona"
  steps = [
    {
      icon: '📝',
      title: 'Regístrate gratis',
      description: 'Crea tu cuenta en minutos y completa tu perfil'
    },
    {
      icon: '🔍',
      title: 'Busca o publica',
      description: 'Encuentra servicios cercanos o publica los tuyos'
    },
    {
      icon: '💬',
      title: 'Conecta',
      description: 'Contacta directamente con vecinos de confianza'
    },
    {
      icon: '⭐',
      title: 'Califica',
      description: 'Comparte tu experiencia y ayuda a la comunidad'
    }
  ];

  // Categorías populares
  categories = [
    { icon: '🔧', name: 'Reparaciones', count: 85 },
    { icon: '🧹', name: 'Limpieza', count: 62 },
    { icon: '🌿', name: 'Jardinería', count: 48 },
    { icon: '💻', name: 'Tecnología', count: 73 },
    { icon: '🎨', name: 'Arte y Diseño', count: 34 },
    { icon: '👨‍🏫', name: 'Clases', count: 56 },
    { icon: '🍳', name: 'Gastronomía', count: 41 },
    { icon: '🚗', name: 'Transporte', count: 29 }
  ];

  // Testimonios
  testimonials = [
    {
      avatar: '👨‍🔧',
      name: 'Carlos Pérez',
      text: 'Encontré un plomero excelente a dos cuadras de mi casa. Rápido, profesional y a buen precio.',
      service: 'Plomería',
      rating: 5
    },
    {
      avatar: '👩‍🌾',
      name: 'María González',
      text: 'Publiqué mis servicios de jardinería y en una semana ya tenía 5 clientes. ¡Increíble!',
      service: 'Jardinería',
      rating: 5
    },
    {
      avatar: '👨‍💻',
      name: 'Roberto Díaz',
      text: 'Ofrezco clases de computación para adultos mayores. Esta plataforma me ayudó a llegar a más personas.',
      service: 'Clases de Computación',
      rating: 5
    }
  ];

  // Beneficios
  benefits = [
    {
      icon: '🏘️',
      title: 'Local y cercano',
      description: 'Todos los servicios están en tu barrio, ahorrando tiempo y dinero'
    },
    {
      icon: '🤝',
      title: 'Comunidad confiable',
      description: 'Sistema de calificaciones y reseñas de usuarios reales'
    },
    {
      icon: '💰',
      title: 'Sin comisiones',
      description: 'Contacto directo entre usuarios, sin intermediarios costosos'
    },
    {
      icon: '📱',
      title: 'Fácil de usar',
      description: 'Interfaz simple y accesible para todas las edades'
    },
    {
      icon: '🌱',
      title: 'Economía local',
      description: 'Apoya a emprendedores y profesionales de tu comunidad'
    },
    {
      icon: '🔒',
      title: 'Seguro',
      description: 'Tus datos están protegidos y tu privacidad es nuestra prioridad'
    }
  ];
  
  // Navegar a Login
  routeLogin() {
    this.router.navigate(['/login']);
  }
}
