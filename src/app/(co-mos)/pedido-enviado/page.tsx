"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowLeft, Clock } from "lucide-react";

type OrderStatus = "PENDIENTE" | "ACEPTADA" | "PREPARANDO" | "LISTA" | "ENTREGADA" | "COMPLETADA" | "PAGADA" | "CANCELADA";

interface Order {
  id: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  items: Array<{
    quantity: number;
    notes?: string | null;
    product: {
      name: string;
      price: number;
    };
  }>;
}

function PedidoEnviadoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      router.push('/menu');
      return;
    }

    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (response.ok) {
          const data = await response.json();
          setOrder(data);
        } else {
          console.error('Error fetching order');
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // Actualizar cada 5 segundos
    const interval = setInterval(fetchOrder, 5000);

    return () => clearInterval(interval);
  }, [orderId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
          <p className="mt-4 text-sm text-white/60">Cargando estado del pedido...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-white/60 mb-4">No se encontró el pedido</p>
          <button
            onClick={() => router.push('/menu')}
            className="rounded-lg bg-orange-500 px-6 py-3 font-semibold transition hover:bg-orange-600"
          >
            Volver al Menú
          </button>
        </div>
      </div>
    );
  }

  const getStatusStep = (status: OrderStatus) => {
    switch (status) {
      case "PENDIENTE": return 1;
      case "ACEPTADA": return 1;
      case "PREPARANDO": return 2;
      case "LISTA": return 3;
      case "ENTREGADA": return 4;
      case "COMPLETADA": return 4;
      default: return 0;
    }
  };

  const currentStep = getStatusStep(order.status);

  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* Header */}
      <div className="max-w-md mx-auto">
        <button
          onClick={() => router.push('/menu')}
          className="mb-6 flex items-center gap-2 text-white/70 transition hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver al Menú
        </button>

        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white mb-6 animate-scaleIn">
            <CheckCircle2 className="h-16 w-16 text-black" />
          </div>
          
          <h1 className="text-3xl font-bold mb-2">
            {order.status === 'LISTA' ? '¡Tu pedido está listo!' : '¡Pedido recibido!'}
          </h1>
          <p className="text-sm text-white/70">
            {order.status === 'LISTA' 
              ? 'Tu pedido está preparado y listo para servir' 
              : 'Pronto disfrutarás de tu comida'}
          </p>
        </div>

        {/* Status Steps */}
        <div className="bg-[#1a1a1f] rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-white/60 mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Estado del Pedido
          </h2>
          <div className="space-y-4">
            {/* Orden Recibida */}
            <div className={`flex items-center gap-3 transition ${currentStep >= 1 ? '' : 'opacity-40'}`}>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                currentStep >= 1 ? 'bg-green-500' : 'bg-white/10'
              }`}>
                <span className="text-xl">✓</span>
              </div>
              <div className="text-left flex-1">
                <p className="font-medium">Orden Recibida</p>
                <p className="text-xs text-white/60">Tu pedido está en el sistema</p>
              </div>
            </div>

            {/* En Preparación */}
            <div className={`flex items-center gap-3 transition ${currentStep >= 2 ? '' : 'opacity-40'}`}>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                currentStep >= 2 ? 'bg-orange-500 animate-pulse' : 'bg-white/10'
              }`}>
                <span className="text-xl">🍳</span>
              </div>
              <div className="text-left flex-1">
                <p className="font-medium">En Preparación</p>
                <p className="text-xs text-white/60">
                  {currentStep === 2 ? 'Estamos cocinando tu pedido' : 'Pronto comenzaremos a cocinar'}
                </p>
              </div>
            </div>

            {/* Preparado */}
            <div className={`flex items-center gap-3 transition ${currentStep >= 3 ? '' : 'opacity-40'}`}>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                currentStep >= 3 ? 'bg-blue-500' : 'bg-white/10'
              }`}>
                <span className="text-xl">✨</span>
              </div>
              <div className="text-left flex-1">
                <p className="font-medium">Preparado</p>
                <p className="text-xs text-white/60">
                  {currentStep >= 3 ? 'Tu pedido está listo' : 'Te avisaremos cuando esté listo'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-[#1a1a1f] rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-white/60 mb-4">Detalle del Pedido</h2>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-white">{item.quantity}x {item.product.name}</p>
                  {item.notes && (
                    <p className="text-xs text-orange-400 mt-1">📝 {item.notes}</p>
                  )}
                </div>
                <p className="text-white/70 ml-4">
                  ${(item.product.price * item.quantity).toLocaleString()}
                </p>
              </div>
            ))}
            <div className="border-t border-white/10 pt-3 flex justify-between items-center">
              <p className="font-semibold">Total</p>
              <p className="text-xl font-bold text-orange-500">
                ${order.total ? order.total.toLocaleString() : '0'}
              </p>
            </div>
          </div>
        </div>

        {/* Order ID */}
        <div className="text-center text-xs text-white/40 mb-6">
          ID de Orden: {orderId}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {order.status === 'ENTREGADA' ? (
            <>
              <button
                onClick={() => {
                  const sessionCode = localStorage.getItem('sessionCode');
                  router.push(`/cuenta?session=${sessionCode}`);
                }}
                className="rounded-lg bg-green-500 py-4 font-semibold transition hover:bg-green-600 flex items-center justify-center gap-2"
              >
                💳 Ver Cuenta y Pagar
              </button>
              <button
                onClick={() => router.push('/menu')}
                className="rounded-lg border border-white/10 py-4 font-medium transition hover:bg-white/5"
              >
                Volver al Menú
              </button>
            </>
          ) : order.status === 'LISTA' ? (
            <>
              <button
                onClick={() => router.push('/menu')}
                className="rounded-lg bg-orange-500 py-4 font-semibold transition hover:bg-orange-600"
              >
                Volver al Menú
              </button>
              <button
                onClick={() => router.push(`/resena?orderId=${orderId}`)}
                className="rounded-lg border border-white/10 py-4 font-medium transition hover:bg-white/5"
              >
                Dejar una Reseña
              </button>
            </>
          ) : (
            <button
              onClick={() => router.push('/menu')}
              className="rounded-lg bg-orange-500 py-4 font-semibold transition hover:bg-orange-600"
            >
              Volver al Menú
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PedidoEnviadoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
          <p className="mt-4 text-sm text-white/60">Cargando...</p>
        </div>
      </div>
    }>
      <PedidoEnviadoContent />
    </Suspense>
  );
}
