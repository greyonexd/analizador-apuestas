'use client';

import { useState } from 'react';

type Bet = { id: number; abierta: File | null; anulada: File | null };

export default function Home() {
  const [bets, setBets] = useState<Bet[]>([{ id: 1, abierta: null, anulada: null }]);
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const addBet = () => setBets([...bets, { id: Date.now(), abierta: null, anulada: null }]);

  const handleFileChange = (index: number, field: 'abierta' | 'anulada', file: File | null) => {
    const newBets = [...bets];
    newBets[index][field] = file;
    setBets(newBets);
  };

  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  const analyze = async () => {
    setLoading(true);
    setResult('');
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
      });

      const data = await response.json();
      setResult(data.result);
    } catch (error) {
      console.error(error);
      setResult('Ocurrió un error de red al contactar con el servidor.');
    }
    setLoading(false);
  };

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Analizador de Apuestas</h1>
      
      {bets.map((bet, index) => (
        <div key={bet.id} className="border p-4 mb-4 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
          <h2 className="font-semibold mb-2">Apuesta {index + 1}</h2>
          <div className="mb-2">
            <label className="block text-sm">Apuesta Abierta (Opcional):</label>
            <input type="file" accept="image/*" onChange={(e) => handleFileChange(index, 'abierta', e.target.files?.[0] || null)} className="mt-1 block w-full" />
          </div>
          <div>
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

      {result && (
        <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg whitespace-pre-wrap font-mono text-sm border dark:border-gray-700">
          {result}
        </div>
      )}
    </main>
  );
}