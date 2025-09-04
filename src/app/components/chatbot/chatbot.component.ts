import { Component, OnInit, viewChild, ElementRef, AfterViewChecked, signal, ViewChild, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Message {
  text: string;                                     //El texto del mensaje
  isBot: boolean;                                   //Es del bot o del usuario
  timestamp: Date;                                  //cuando se envia
  hasAction?: boolean;                              //tiene accion?
  actionType?: 'login' | 'register' | 'close_chat'; //Tipo de acción
  actionText?: string;                              //texto del btn
}

@Component({
  selector: 'app-chatbot',                  //para html de home
  standalone: true, 
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',  //html del chatbot
  styleUrl: './chatbot.component.css'       //estilo del chatbot
})
export class ChatbotComponent implements OnInit, AfterViewChecked{
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  
  // Evento para comunicar acciones al componente padre
  @Output() loginRequested = new EventEmitter<void>();
  @Output() registerRequested = new EventEmitter<void>();
  
  //Estados del chatbox
  isOpen = signal(false);           //Esta abierta la ventana del chatbot?
  isTyping = signal(false);         //Esta escribiendo el chatbot?
  messages = signal<Message[]>([]); //Lista de todos los mensajes

  currentMessage = '';              //Texto que escribe el usuario

  //Respuestas predefinidas
  private botResponses: { [key: string]: string[] } = {
    'saludo': [
      '¡Hola! 👋 Soy tu asistente de ElDato. ¿En qué puedo ayudarte hoy?',
      '¡Bienvenido a ElDato! ¿Buscas algún servicio en particular?'
    ],
    'servicios': [
      'En El Dato puedes encontrar diversos servicios como: jardinería, limpieza, clases particulares, reparaciones, y mucho más. ¿Qué tipo de servicio necesitas?',
      'Ofrecemos una amplia gama de servicios locales. ¿Te interesa algo específico como reparaciones, limpieza o servicios profesionales?'
    ],
    'como_funciona': [
      'Es muy sencillo: 1) Busca el servicio que necesitas 2) Contacta al profesional 3) Coordina el trabajo. ¡Así de fácil!',
      'ElDato conecta a personas que necesitan servicios con profesionales locales. Solo tienes que buscar, contactar y coordinar.'
    ],
    'precios': [
      'Los precios varían según el servicio y el profesional. Cada uno establece sus tarifas. Puedes comparar diferentes opciones.',
      'No cobramos comisión. Los precios los establecen directamente los profesionales según su experiencia y el tipo de servicio.'
    ],
    'registro': [
      'Para registrarte, haz clic en "Iniciar Sesión/Registro" en la parte superior. ¡Es gratis y muy rápido!',
      'El registro es gratuito. Solo necesitas hacer clic en el botón de registro y completar tus datos básicos.'
    ],
    'login': [
      'Para iniciar sesión, usa el botón "Iniciar Sesión/Registro" en la parte superior de la página.',
      'Si ya tienes cuenta, solo haz clic en "Iniciar Sesión/Registro" arriba para acceder.'
    ],
    'como_ingreso': [
      'Para ingresar, solo haz clic en el botón "Iniciar Sesión/Registro" en la parte superior derecha.',
      'Debes presionar "Iniciar Sesión/Registro" arriba. Si no tienes cuenta, ahí mismo puedes registrarte.'
    ],
    'ingresar': [
      '¿Quieres ingresar a tu cuenta o crear una nueva? Te ayudo a dirigirte al lugar correcto.',
      'Perfecto, te ayudo a ingresar. ¿Ya tienes cuenta o necesitas registrarte?'
    ],
    'crear_cuenta': [
      'Crear tu cuenta es súper fácil y gratis. Te dirijo al formulario de registro.',
      '¡Excelente decisión! El registro es gratuito y toma menos de 2 minutos.'
    ],
    'ubicacion': [
      'El Dato funciona en toda Chile. Conectamos personas con profesionales locales en su área.',
      'Nos enfocamos en servicios locales. ¿En qué ciudad o zona estás buscando servicios?'
    ],
    'seguridad': [
      'Todos los profesionales pasan por un proceso de verificación. También tenemos un sistema de calificaciones y comentarios.',
      'Tu seguridad es importante. Verificamos profesionales y tienes acceso a reseñas de otros usuarios.'
    ],
    'default': [
      'Interesante pregunta. ¿Podrías ser más específico? Puedo ayudarte con información sobre servicios, registro, precios, etc.',
      'No estoy seguro de entender completamente. ¿Podrías reformular tu pregunta?',
      'Para brindarte la mejor ayuda, ¿podrías darme más detalles sobre lo que necesitas?'
    ]
  };

  //cuando se ejecuta
  ngOnInit():void{
    //Mensaje inicial del bot
    this.addBotMessage('¡Hola! 👋 Soy tu asistente virtual de ElDato. ¿En qué puedo ayudarte hoy?');
  }
  
  //hace scroll hacia abajo
  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  toggleChat() {
    this.isOpen.update((value: any) => !value);
  }

  //si el mensaje esta vacio o el bot esta escribiendo, no hace nada
  sendMessage() {
    if (!this.currentMessage.trim() || this.isTyping()) return;

    // Agregar mensaje del usuario
    this.messages.update(messages => [...messages, {
      text: this.currentMessage,
      isBot: false,
      timestamp: new Date()
    }]);

    //guarda el mensaje en minusculas para analizarlo
    const userMessage = this.currentMessage.toLowerCase();
    this.currentMessage = '';

    // Simular que el bot está escribiendo
    this.isTyping.set(true);

    //simula que el bot piensa antes de responder
    setTimeout(() => {
      try {
        const response = this.generateBotResponse(userMessage);
        this.addBotMessage(response.text, response.hasAction, response.actionType, response.actionText);
      } catch (error) {
        console.error('Error generating response:', error);
        this.addBotMessage('Disculpa, hubo un error. ¿Podrías intentar de nuevo?');
      } finally {
        this.isTyping.set(false);
      }
    }, Math.random() * 1000 + 500); // Entre 0.5 y 1.5 segundos
  }

  private addBotMessage(text: string, hasAction: boolean = false, actionType?: 'login' | 'register' | 'close_chat', actionText?: string) {
    this.messages.update(messages => [...messages, {
      text,
      isBot: true,
      timestamp: new Date(),
      hasAction,
      actionType,
      actionText
    }]);
  }

  private generateBotResponse(userMessage: string): { text: string, hasAction?: boolean, actionType?: 'login' | 'register' | 'close_chat', actionText?: string } {
    // Detectar intención del usuario - ORDEN IMPORTANTE: más específico primero
    let responseKey = 'default';
    let hasAction = false;
    let actionType: 'login' | 'register' | 'close_chat' | undefined;
    let actionText = '';

    if (this.containsWords(userMessage, ['hola', 'buenas', 'saludos', 'hey', 'buenos días', 'buenas tardes'])) {
      responseKey = 'saludo';
    } 
    // Primero: Preguntas específicas sobre CÓMO ingresar
    else if (this.containsWords(userMessage, ['como ingreso', 'cómo ingreso', 'como entro', 'cómo entro', 'como accedo', 'cómo accedo']) ||
             (this.containsWords(userMessage, ['como', 'cómo']) && this.containsWords(userMessage, ['ingresar', 'entrar', 'acceder']))) {
      responseKey = 'como_ingreso';
      hasAction = true;
      actionType = 'login';
      actionText = 'Ir a Iniciar Sesión/Registro';
    }
    // Segundo: Referencias específicas a cuenta existente
    else if (this.containsWords(userMessage, ['iniciar sesión', 'iniciar sesion', 'login', 'mi cuenta', 'ingresar a mi cuenta', 'entrar a mi cuenta'])) {
      responseKey = 'login';
      hasAction = true;
      actionType = 'login';
      actionText = 'Iniciar Sesión';
    }
    // Tercero: Registro específico
    else if (this.containsWords(userMessage, ['registro', 'registrar', 'registrarme', 'crear cuenta', 'nueva cuenta', 'sign up'])) {
      responseKey = 'crear_cuenta';
      hasAction = true;
      actionType = 'register';
      actionText = 'Ir a Registro';
    }
    // Cuarto: Ingresar genérico (sin "cómo")
    else if (this.containsWords(userMessage, ['ingresar', 'entrar', 'acceder', 'quiero entrar']) && 
             !this.containsWords(userMessage, ['como', 'cómo'])) {
      responseKey = 'ingresar';
      hasAction = true;
      actionType = 'login';
      actionText = 'Ir a Iniciar Sesión/Registro';
    }
    else if (this.containsWords(userMessage, ['servicio', 'servicios', 'que hacen', 'qué hacen', 'que ofrecen'])) {
      responseKey = 'servicios';
    } 
    else if (this.containsWords(userMessage, ['como funciona', 'cómo funciona', 'como usar', 'cómo usar', 'como es', 'cómo es'])) {
      responseKey = 'como_funciona';
    } 
    else if (this.containsWords(userMessage, ['precio', 'precios', 'cuesta', 'costo', 'tarifa', 'cuánto', 'cuanto'])) {
      responseKey = 'precios';
    } 
    else if (this.containsWords(userMessage, ['donde', 'dónde', 'ubicación', 'lugar', 'zona', 'ciudad'])) {
      responseKey = 'ubicacion';
    } 
    else if (this.containsWords(userMessage, ['seguro', 'seguridad', 'confianza', 'verificación'])) {
      responseKey = 'seguridad';
    }
    else if (this.containsWords(userMessage, ['pago', 'pagar', 'dinero', 'plata', 'transferencia', 'efectivo'])) {
      responseKey = 'pago';
    }
    else if (this.containsWords(userMessage, ['garantía', 'garantia', 'asegurado', 'respaldo'])) {
      responseKey = 'garantia';
    }

    // Seleccionar respuesta aleatoria
    const responses = this.botResponses[responseKey];
    const selectedResponse = responses[Math.floor(Math.random() * responses.length)];

    return {
      text: selectedResponse,
      hasAction,
      actionType,
      actionText
    };
  }

  private containsWords(text: string, words: string[]): boolean {
    //retorna true si al menus una palabra cumple
    return words.some(word => text.includes(word));
  }

  // Método para manejar las acciones de los botones
  onActionClick(actionType: 'login' | 'register' | 'close_chat') {
    switch(actionType) {
      case 'login':
        this.loginRequested.emit();
        this.addBotMessage('Te estoy redirigiendo al inicio de sesión. Si tienes problemas, ¡no dudes en preguntarme!');
        break;
      case 'register':
        this.registerRequested.emit();
        this.addBotMessage('Te dirijo al formulario de registro. ¡Bienvenido a la comunidad ElDato!');
        break;
      case 'close_chat':
        this.isOpen.set(false);
        break;
    }
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = 
          this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch(err) {}
  }
}