"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function PedidoEnviadoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!orderId) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Separate timeout for navigation
    const navigationTimeout = setTimeout(() => {
      router.push(`/resena?orderId=${orderId}`);
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(navigationTimeout);
    };
  }, [orderId, router]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white mb-6">
            <CheckCircle2 className="h-16 w-16 text-black" />
          </div>
          
          <h1 className="text-3xl font-bold mb-4">¡Pedido enviado con éxito!</h1>
          <p className="text-sm text-white/70">
            Pronto disfrutarás de tu comida
          </p>
        </div>

        {/* Status Steps */}
        <div className="bg-[#1a1a1f] rounded-2xl p-6 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500">
                <span className="text-xl">✓</span>
              </div>
              <div className="text-left">
                <p className="font-medium">Orden Recibida</p>
                <p className="text-xs text-white/60">Tu pedido está en el sistema</p>
              </div>
            </div>

            <div className="flex items-center gap-3 opacity-60">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                <span className="text-xl">🍳</span>
              </div>
              <div className="text-left">
                <p className="font-medium">En Preparación</p>
                <p className="text-xs text-white/60">Pronto comenzaremos a cocinar</p>
              </div>
            </div>

            <div className="flex items-center gap-3 opacity-40">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                <span className="text-xl">✨</span>
              </div>
              <div className="text-left">
                <p className="font-medium">Listo para Recoger</p>
                <p className="text-xs text-white/60">Te notificaremos cuando esté listo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Auto-redirect Message */}
        <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 p-4 mb-6">
          <p className="text-sm text-orange-300">
            Redirigiendo a la página de reseña en <span className="font-bold">{countdown}</span> segundos...
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push(`/resena?orderId=${orderId}`)}
            className="flex items-center justify-center gap-2 rounded-lg bg-orange-500 py-3 font-semibold transition hover:bg-orange-600"
          >
            Ir a Reseña
            <ArrowRight className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => router.push('/menu')}
            className="rounded-lg border border-white/10 py-3 font-medium transition hover:bg-white/5"
          >
            Volver al Menú
          </button>
        </div>

        {/* Order ID */}
        <div className="mt-8 text-xs text-white/40">
          ID de Orden: {orderId}
        </div>
      </div>
    </div>
  );
}
