'use client';

import { useState } from 'react';

type Bet = { id: number; abierta: File | null; anulada: File | null };

export default function Home() {
  const [bets, setBets] = useState<Bet[]>([{ id: 1, abierta: null, anulada: null }]);
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false); // Estado para el botón de copiar

  const addBet = () => setBets([...bets, { id: Date.now(), abierta: null, anulada: null }]);

  // Función para eliminar una apuesta específica
  const removeBet = (idToRemove: number) => {
    setBets(bets.filter(bet => bet.id !== idToRemove));
  };

  const handleFileChange = (index: number, field: 'abierta' | 'anulada', file: File | null) => {
    const newBets = [...bets];
    newBets[index][field] = file;
    setBets(newBets);
  };

  // Función para comprimir imágenes y evitar bloqueos del servidor
  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = error => reject(error);
  });

  const analyze = async () => {
    setLoading(true);
    setResult('');
    setCopied(false);
    try {
      const payload = [];
      for (const bet of bets) {
        if (!bet.anulada) {
          alert('El fichero de Apuesta Anulada / Recalculada es obligatorio para todas las filas.');
          setLoading(false);
          return;
        }
        payload.push({
          abierta: bet.abierta ? await toBase64(bet.abierta) : null,
          anulada: await toBase64(bet.anulada),
        });
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bets: payload }),
        cache: 'no-store'
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error(`El servidor devolvió un error (Código: ${response.status}). Posiblemente las imágenes son demasiado pesadas.`);
      }

      if (!response.ok || data.error) {
        setResult(`❌ Error del servidor: ${data.error || 'Desconocido'}`);
      } else {
        setResult(data.result);
      }
      
    } catch (error: any) {
      console.error(error);
      setResult(`❌ ${error.message || 'Ocurrió un error de red al contactar con el servidor.'}`);
    }
    setLoading(false);
  };

  // Función para copiar el resultado al portapapeles
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Vuelve a poner "Copiar" tras 2 segundos
    } catch (err) {
      console.error('Error al copiar: ', err);
    }
  };

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Analizador de Apuestas</h1>
      
      {bets.map((bet, index) => (
        // Añadimos 'relative' para poder posicionar la X arriba a la derecha
        <div key={bet.id} className="relative border p-4 mb-4 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
          
          {/* Botón de eliminar apuesta (X) */}
          {bets.length > 1 && (
            <button 
              onClick={() => removeBet(bet.id)}
              className="absolute top-3 right-3 text-red-500 hover:text-red-700 font-bold text-lg px-2"
              title="Eliminar apuesta"
            >
              ✕
            </button>
          )}

          <h2 className="font-semibold mb-2">Apuesta {index + 1}</h2>
          <div className="mb-2 w-11/12">
            <label className="block text-sm">Apuesta Abierta (Opcional):</label>
            <input type="file" accept="image/*" onChange={(e) => handleFileChange(index, 'abierta', e.target.files?.[0] || null)} className="mt-1 block w-full" />
          </div>
          <div className="w-11/12">
            <label className="block text-sm font-medium text-red-500">Apuesta Anulada / Recalculada (Obligatorio):</label>
            <input type="file" accept="image/*" onChange={(e) => handleFileChange(index, 'anulada', e.target.files?.[0] || null)} className="mt-1 block w-full" />
          </div>
        </div>
      ))}

      <div className="flex gap-4 mb-8">
        <button onClick={addBet} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">Añadir apuesta</button>
        <button onClick={analyze} disabled={loading} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition disabled:opacity-50">
          {loading ? 'Analizando...' : 'Analizar'}
        </button>
      </div>

      {/* Recuadro de resultado con botón de copiar */}
      {result && (
        <div className="relative p-4 bg-gray-100 dark:bg-gray-900 rounded-lg whitespace-pre-wrap font-mono text-sm border dark:border-gray-700">
          <button 
            onClick={copyToClipboard}
            className="absolute top-2 right-2 bg-gray-300 dark:bg-gray-700 px-3 py-1 rounded text-xs font-semibold hover:bg-gray-400 dark:hover:bg-gray-600 transition"
          >
            {copied ? '¡Copiado!' : 'Copiar'}
          </button>
          <div className="mt-4">{result}</div>
        </div>
      )}
    </main>
  );
}
