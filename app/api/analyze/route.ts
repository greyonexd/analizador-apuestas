import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { bets } = await req.json();

    const promptSystem = `Eres un asistente experto extrayendo información de capturas de apuestas. 
    Para cada apuesta que recibas, debes generar un texto ESTRICTAMENTE con esta estructura. No añadas introducciones, ni saludos, ni formato markdown como negritas:
    Apuesta [Número de orden]: [Tipo] ([Selecciones])
    Ref: [Referencia]
    Evento: [Evento] ([Fecha])
    Aceptada: [Importe] a cuota [Cuota] (Ganancia: [Ganancia])
    Pagada: [Estado de pago/recálculo] (Ganancia: [Ganancia final])
    Saldo pendiente: [Saldo]`;

    const content: any[] = [{ type: 'text', text: promptSystem }];

    bets.forEach((bet: any, index: number) => {
      content.push({ type: 'text', text: `Imágenes correspondientes a la Apuesta ${index + 1}:` });
      
      // Procesamos el base64 limpio sin el prefijo "data:image/jpeg;base64,"
      if (bet.abierta) {
        const base64Data = bet.abierta.includes(',') ? bet.abierta.split(',')[1] : bet.abierta;
        content.push({ type: 'image', image: base64Data, mimeType: 'image/jpeg' });
      }
      if (bet.anulada) {
        const base64Data = bet.anulada.includes(',') ? bet.anulada.split(',')[1] : bet.anulada;
        content.push({ type: 'image', image: base64Data, mimeType: 'image/jpeg' });
      }
    });

    const { text } = await generateText({
      model: google('models/gemini-1.5-flash-latest'),
      messages: [{ role: 'user', content }],
    });

    return NextResponse.json({ result: text });
  } catch (error: any) {
    console.error("Error completo de IA:", error);
    return NextResponse.json({ error: error.message || 'Error procesando las imágenes con la IA' }, { status: 500 });
  }
}
