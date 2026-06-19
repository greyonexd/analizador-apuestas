import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { bets } = await req.json();

        const promptSystem = `Eres un auditor experto en casas de apuestas. Tu tarea es comparar dos capturas de pantalla de la misma apuesta: la 'Apuesta Abierta' original y la 'Apuesta Anulada / Recalculada'.

REGLAS DE CÁLCULO MATEMÁTICO:
1. Si en la captura recalculada la ganancia final es menor que la ganancia de la apuesta original abierta, SIGNIFICA QUE HA HABIDO UN RECÁLCULO POR ANULACIÓN.
2. En la línea "Pagada:", si detectas que la ganancia bajó (por ejemplo de 857,50 a 455,55), NUNCA escribas solo "Ganada". Debes escribir literalmente: "Recálculo tras anulación parcial" o "Recálculo a cuota X" (si es simple).
3. "Saldo pendiente" NUNCA es 0,00 € si hubo recálculo. El Saldo pendiente es la resta matemática exacta: [Ganancia original] - [Ganancia recalculada]. (Ejemplo: 857,50 - 455,54 = 401,96 €). Ten en cuenta redondeos de céntimos si es necesario para que cuadre con la petición del usuario.

FORMATO ESTRICTO REQUERIDO (No añadas NADA MÁS, ni saludos, ni markdown):
Apuesta [Número de orden]: [Tipo] ([Selecciones])
Ref: [Referencia]
Evento: [Evento] ([Fecha])
Aceptada: [Importe original] a cuota [Cuota original] (Ganancia: [Ganancia original])
Pagada: [Estado exacto según reglas] (Ganancia: [Ganancia final cobrada])
Saldo pendiente: [Resultado de la resta] €`;
    const content: any[] = [{ type: 'text', text: promptSystem }];

    bets.forEach((bet: any, index: number) => {
      content.push({ type: 'text', text: `Imágenes correspondientes a la Apuesta ${index + 1}:` });
      
      // Convertir explícitamente el base64 a Uint8Array (Buffer)
      if (bet.abierta) {
        const base64Data = bet.abierta.includes(',') ? bet.abierta.split(',')[1] : bet.abierta;
        content.push({ type: 'image', image: Buffer.from(base64Data, 'base64') });
      }
      if (bet.anulada) {
        const base64Data = bet.anulada.includes(',') ? bet.anulada.split(',')[1] : bet.anulada;
        content.push({ type: 'image', image: Buffer.from(base64Data, 'base64') });
      }
    });

    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      messages: [{ role: 'user', content }],
    });

    return NextResponse.json({ result: text });
  } catch (error: any) {
    console.error("Error devuelto por Gemini/SDK:", error);
    // Extraemos el mensaje de error real si viene anidado
    const errorMessage = error.message || error.cause?.message || 'Error procesando las imágenes con la IA';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
