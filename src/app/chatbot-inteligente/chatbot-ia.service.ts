import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';

declare const puter: any;

@Injectable({
  providedIn: 'root'
})
export class ChatbotIaService {

  enviarMensaje(mensaje: string): Observable<string> {
    const prompt = `
Eres el asistente de "El Dato", una plataforma de servicios entre vecinos.
Responde SIEMPRE en español, de forma clara y útil.
Pregunta del usuario: ${mensaje}
`.trim();

    // convertimos la Promise de puter.ai.chat en un Observable
    return from(
      (async () => {
        const resp = await puter.ai.chat(prompt);

        if (typeof resp === 'string') {
          return resp;
        }

        if (resp?.message?.content) {
          return String(resp.message.content);
        }

        if (resp?.choices?.[0]?.message?.content) {
          return String(resp.choices[0].message.content);
        }

        return 'No entendí bien la respuesta del modelo 🤔.';
      })()
    );
  }
}
