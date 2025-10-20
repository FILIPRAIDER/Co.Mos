"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';

export default function ScanPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState<number | null>(null);

  useEffect(() => {
    async function processScan() {
      try {
        const qrCode = params.qrCode as string;
        
        // Llamar API para validar QR y crear/obtener sesión
        const response = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qrCode }),
        });

        if (!response.ok) {
          throw new Error('QR inválido o mesa no encontrada');
        }

        const data = await response.json();
        
        // data contiene: { sessionCode, tableNumber, tableId }
        setTableNumber(data.tableNumber);
        
        // Guardar sessionCode en localStorage
        localStorage.setItem('sessionCode', data.sessionCode);
        localStorage.setItem('tableNumber', data.tableNumber.toString());
        
        // Esperar 1.5s y redirigir al menú
        setTimeout(() => {
          router.push(`/menu?session=${data.sessionCode}`);
        }, 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al escanear QR');
        setLoading(false);
      }
    }

    processScan();
  }, [params, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-white text-2xl font-semibold mb-2">Error</h2>
        <p className="text-white/60 text-center mb-6">{error}</p>
        <button
          onClick={() => router.push('/')}
          className="rounded-2xl bg-white px-8 py-3 font-semibold text-black transition hover:bg-white/90"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-red-600 flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6 animate-fadeIn">
        {/* Logo */}
        <div className="relative">
          <Image 
            src="/Logo.svg" 
            alt="co.mos" 
            width={120} 
            height={120}
            style={{ width: 'auto', height: 'auto' }}
            priority 
          />
          <div className="absolute inset-0 bg-white/20 rounded-full blur-3xl -z-10"></div>
        </div>

        {/* Texto */}
        <div className="text-center">
          <h1 className="text-white text-3xl font-bold mb-2">
            ¡Bienvenido!
          </h1>
          {tableNumber ? (
            <p className="text-white/90 text-xl">
              Mesa #{tableNumber}
            </p>
          ) : (
            <p className="text-white/90 text-lg">
              Validando código QR...
            </p>
          )}
        </div>

        {/* Spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-white/30 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>

        <p className="text-white/70 text-sm">
          Preparando tu experiencia...
        </p>
      </div>
    </div>
  );
}
