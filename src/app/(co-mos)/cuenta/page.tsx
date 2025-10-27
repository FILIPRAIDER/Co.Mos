"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  notes?: string | null;
  product: {
    id: string;
    name: string;
    imageUrl?: string | null;
    price: number;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
  table: {
    number: number;
  };
}

function CuentaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionCode = searchParams.get('session') || localStorage.getItem('sessionCode');
  const isModal = searchParams.get('modal') === 'true';
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeTip, setIncludeTip] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!sessionCode) {
      router.push('/menu');
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await fetch(`/api/orders?sessionCode=${sessionCode}`);
        if (response.ok) {
          const data = await response.json();
          const sessionOrders = data.filter((order: Order) => 
            order.status === 'ENTREGADA' || order.status === 'COMPLETADA'
          );
          setOrders(sessionOrders);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [sessionCode, router]);

  const getSubtotal = () => {
    return orders.reduce((sum, order) => sum + order.total, 0);
  };

  const getIVA = () => {
    return Math.round(getSubtotal() * 0.19);
  };

  const getTip = () => {
    return includeTip ? Math.round(getSubtotal() * 0.10) : 0;
  };

  const getTotal = () => {
    return getSubtotal() + getIVA() + getTip();
  };

  const handleFinalize = () => {
    setShowReview(true);
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      alert('Por favor selecciona una calificación');
      return;
    }

    setIsSubmitting(true);

    try {
      // Enviar reseña
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orders[0]?.id,
          rating,
          comment: comment.trim() || null,
        }),
      });

      // Actualizar órdenes a PAGADA
      await Promise.all(
        orders.map(order =>
          fetch(`/api/orders/${order.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'PAGADA' }),
          })
        )
      );

      // Levantar mesa
      const tableId = localStorage.getItem('tableId');
      if (tableId && sessionCode) {
        await fetch(`/api/tables/${tableId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'lift', sessionCode }),
        });
      }

      // Limpiar localStorage
      localStorage.removeItem('sessionCode');
      localStorage.removeItem('tableId');
      localStorage.removeItem('tableNumber');
      localStorage.removeItem('restaurantId');
      localStorage.removeItem('restaurantName');
      localStorage.removeItem('restaurantSlug');
      localStorage.removeItem('cart');
      localStorage.removeItem('scannedAt');

      // Redirigir
      router.push('/');
    } catch (error) {
      console.error('Error:', error);
      alert('Hubo un error. Por favor intenta de nuevo.');
      setIsSubmitting(false);
    }
  };

  const handleCancelReview = () => {
    setShowReview(false);
    setRating(0);
    setComment("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
          <p className="mt-4 text-sm text-white/60">Cargando cuenta...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-4 text-6xl">🍽️</div>
          <p className="text-lg font-semibold mb-2">No hay órdenes</p>
          <p className="text-white/60 mb-6">No se encontraron órdenes para esta mesa</p>
          <button
            onClick={() => isModal ? router.back() : router.push('/menu')}
            className="rounded-lg bg-orange-500 px-6 py-3 font-semibold transition hover:bg-orange-600"
          >
            {isModal ? 'Cerrar' : 'Volver al Menú'}
          </button>
        </div>
      </div>
    );
  }

  const tableNumber = orders[0]?.table?.number;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Factura */}
      <div className={`${showReview ? 'hidden' : 'block'} max-w-md mx-auto`}>
        <div className="bg-neutral-900 rounded-t-3xl min-h-screen">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h1 className="text-2xl font-serif italic">Factura</h1>
            {isModal && (
              <button
                onClick={() => router.back()}
                className="rounded-full p-2 hover:bg-white/10 transition"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Items */}
          <div className="p-6 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm font-medium text-white/60">
                <span>Producto</span>
                <div className="flex items-center gap-8">
                  <span>Cantidad</span>
                  <span>Precio</span>
                </div>
              </div>

              {orders.flatMap(order => 
                order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <span className="text-white">{item.product.name}</span>
                    <div className="flex items-center gap-12">
                      <span className="text-white text-center w-8">{item.quantity}</span>
                      <span className="text-white w-24 text-right">
                        $ {(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totals */}
            <div className="pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Subtotal</span>
                <span className="text-white">$ {getSubtotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">IVA 19%</span>
                <span className="text-white">$ {getIVA().toLocaleString()}</span>
              </div>

              {/* Propina */}
              <div className="pt-2">
                <button
                  onClick={() => setIncludeTip(!includeTip)}
                  className="w-full flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                      includeTip ? 'border-white bg-white' : 'border-white/40'
                    }`}>
                      {includeTip && (
                        <div className="w-2.5 h-2.5 rounded-full bg-black"></div>
                      )}
                    </div>
                    <span className="text-sm text-white/80">Propina 10% (Voluntaria)</span>
                  </div>
                  <span className="text-sm text-white">$ {(getSubtotal() * 0.10).toLocaleString()}</span>
                </button>
                <p className="text-xs text-white/40 ml-8 mt-1">
                  Para incluir propina marque el círculo
                </p>
              </div>

              <div className="flex justify-between pt-2 border-t border-white/10">
                <span className="font-medium text-white">Total</span>
                <span className="font-medium text-white">$ {getTotal().toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Button */}
          <div className="p-6">
            <button
              onClick={handleFinalize}
              className="w-full bg-white text-black rounded-xl py-4 font-medium hover:bg-white/90 transition"
            >
              Finalizar y pagar
            </button>
          </div>
        </div>
      </div>

      {/* Reseña */}
      {showReview && (
        <div className="max-w-md mx-auto">
          <div className="bg-neutral-900 rounded-t-3xl min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h1 className="text-2xl font-serif italic">Factura</h1>
              <button
                onClick={handleCancelReview}
                className="rounded-full p-2 hover:bg-white/10 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Review Content */}
            <div className="p-6">
              <div className="text-center mb-8">
                <div className="mb-6">
                  <div className="w-16 h-16 mx-auto bg-white/10 rounded-full flex items-center justify-center mb-4">
                    <span className="text-3xl">⭐</span>
                  </div>
                </div>
                <h2 className="text-xl font-semibold mb-2">Califica tu visita</h2>
                <p className="text-sm text-white/60">
                  Tu opinión nos ayuda a mejorar y darte un mejor servicio cada vez.
                </p>
              </div>

              {/* Stars */}
              <div className="flex items-center justify-center gap-3 mb-8">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110 active:scale-95"
                  >
                    <svg
                      className={`w-12 h-12 ${
                        star <= (hoveredRating || rating)
                          ? 'fill-white text-white'
                          : 'fill-none text-white/20'
                      } transition-colors`}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </button>
                ))}
              </div>

              {/* Comment */}
              <div className="mb-6">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Escribe aquí tus comentarios (opcional)"
                  rows={4}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder-white/40 focus:border-white/30 focus:outline-none resize-none"
                />
              </div>

              {/* Propina info */}
              <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/80">Propina 10% (Voluntaria)</span>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    includeTip ? 'bg-green-500' : 'bg-white/20'
                  }`}>
                    {includeTip && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </div>
                <p className="text-xs text-white/50">
                  Para incluir propina marque el círculo
                </p>
              </div>

              <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex justify-between mb-2">
                  <span className="text-white/80">Total</span>
                  <span className="text-white font-medium">$ {getTotal().toLocaleString()}</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleSubmitReview}
                  disabled={rating === 0 || isSubmitting}
                  className="w-full bg-green-600 text-white rounded-xl py-4 font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar reseña'}
                </button>
                <button
                  onClick={handleCancelReview}
                  disabled={isSubmitting}
                  className="w-full bg-transparent border border-white/20 text-white rounded-xl py-4 font-medium hover:bg-white/5 transition disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CuentaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
          <p className="mt-4 text-sm text-white/60">Cargando...</p>
        </div>
      </div>
    }>
      <CuentaContent />
    </Suspense>
  );
}
