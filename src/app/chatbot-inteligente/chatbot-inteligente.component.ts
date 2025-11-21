import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

declare const puter: any;

@Component({
  selector: 'app-chatbot-inteligente',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './chatbot-inteligente.component.html',
  styleUrls: ['./chatbot-inteligente.component.css']
})
export class ChatbotInteligenteComponent {

  mensajeUsuario = '';
  cargando = false;
  isOpen = false;

  estaAutenticado = false;

  mensajes = [
    { rol: 'bot', contenido: '👋 Hola, ¿en qué te ayudo hoy?' }
  ];

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  // Login con Puter
  async autenticarConPuter() {
    try {
      await puter.ui.authenticateWithPuter();
      this.estaAutenticado = true;
      console.log('Usuario autenticado en Puter');
    } catch (err) {
      console.error('Login cancelado o fallido:', err);
    }
  }

  async enviar() {
    const texto = this.mensajeUsuario.trim();
    if (!texto || this.cargando) return;

    // añade mensaje del usuario a la conversación
    this.mensajes.push({ rol: 'user', contenido: texto });
    this.mensajeUsuario = '';
    this.cargando = true;

    try {
      // 👉 AQUÍ forzamos que SIEMPRE responda en español
      const respuesta = await puter.ai.chat(
        `Responde exclusivamente en español. 
        Si el usuario escribe en otro idioma, traduce su mensaje y responde solo en español. 
        Mensaje del usuario: ${texto}`,
        { model: 'gpt-5-nano' }
      );

      console.log('RESPUESTA PUTER:', respuesta);

      // Extraer contenido correctamente
      const contenidoBot =
        respuesta?.message?.content ||   // Formato estándar Puter
        respuesta?.text ||               // Por si viniera como text
        'No pude procesar la respuesta 🤔';

      // agregar mensaje del bot
      this.mensajes.push({ rol: 'bot', contenido: contenidoBot });

    } catch (err) {
      console.error(err);
      this.mensajes.push({
        rol: 'bot',
        contenido: '😥 Error al conectar con la IA.'
      });
    }

    this.cargando = false;
  }
}
