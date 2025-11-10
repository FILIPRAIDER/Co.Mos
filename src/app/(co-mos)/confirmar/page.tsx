"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";
import Image from "next/image";
import Modal from "@/components/Modal";
import { useAlert } from "@/hooks/useAlert";

type Product = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  categoryId: string;
  available: boolean;
};

type CartItem = {
  product: Product;
  quantity: number;
  notes?: string;
};

export default function ConfirmarPage() {
  const router = useRouter();
  const { alert, success, error: showError } = useAlert();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    const savedSession = localStorage.getItem('sessionCode');
    const savedTableNumber = localStorage.getItem('tableNumber');
    
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    } else {
      router.push('/menu');
    }
    
    if (savedSession) {
      setSessionCode(savedSession);
    }
    
    if (savedTableNumber) {
      setTableNumber(parseInt(savedTableNumber));
    }
  }, [router]);

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  const getIVA = () => {
    return getSubtotal() * 0.19;
  };

  const getTotal = () => {
    return getSubtotal() + getIVA();
  };

  const handleSubmit = () => {
    if (!sessionCode) {
      showError('No se encontró una sesión válida. Por favor escanea el código QR de tu mesa.');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmOrder = async () => {
    setIsSubmitting(true);
    
    const orderData = {
      sessionCode: sessionCode!,
      customerName: customerName.trim() || undefined,
      type: 'COMER_AQUI',
      items: cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        notes: item.notes,
      })),
    };

    try {
      console.log('📤 Enviando orden:', orderData);

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error del servidor:', errorData);
        
        // Mostrar detalles específicos si hay errores de validación
        if (errorData.details && Array.isArray(errorData.details)) {
          console.error('📋 Detalles de validación:', errorData.details);
          const errorMessages = errorData.details.map((d: any) => 
            `${d.path?.join('.') || 'Campo'}: ${d.message}`
          ).join('\n');
          throw new Error(`Errores de validación:\n${errorMessages}`);
        }
        
        throw new Error(errorData.error || 'Error al crear la orden');
      }

      const result = await response.json();
      
      // Limpiar carrito pero mantener sesión
      localStorage.removeItem('cart');
      
      // Mostrar éxito y redirigir
      success('¡Pedido enviado a cocina exitosamente!');
      
      setTimeout(() => {
        router.push(`/pedido-enviado?orderId=${result.order.id}`);
      }, 1000);
    } catch (error) {
      console.error('❌ Error al crear orden:', error);
      console.error('📦 Datos enviados:', orderData);
      showError(error instanceof Error ? error.message : 'Hubo un error al enviar tu pedido. Por favor intenta de nuevo.');
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  if (cart.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-48">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a0f]">
        <div className="flex items-center gap-4 px-4 py-4">
          <button
            onClick={() => router.back()}
            className="rounded-full p-2 transition hover:bg-white/10"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-serif text-xl italic">Carrito, {cart.length} Artículos</h1>
          </div>
        </div>
      </header>

      {/* Cart Items Preview */}
      <div className="border-b border-white/10 p-4">
        <div className="space-y-3">
          {cart.map((item) => (
            <div
              key={item.product.id}
              className="flex items-center gap-3 rounded-lg bg-[#1a1a1f] p-3"
            >
              <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden">
                {item.product.imageUrl ? (
                  <Image
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-zinc-800">
                    <svg className="h-8 w-8 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-medium text-white">{item.product.name}</h3>
                <p className="text-xs text-white/60">{item.product.description}</p>
                {item.notes && (
                  <p className="mt-1 text-xs text-orange-400">Nota: {item.notes}</p>
                )}
              </div>

              <div className="text-right">
                <p className="text-sm text-white/60">x{item.quantity}</p>
                <p className="font-semibold text-orange-500">
                  ${(item.product.price * item.quantity).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Info Form */}
      <div className="p-4">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="rounded-full bg-white/10 p-2">
              <span className="text-xl">💬</span>
            </div>
            <h2 className="text-lg font-semibold">¿Listo para enviar tu pedido?</h2>
          </div>
          <p className="text-sm text-white/60">
            Después de confirmar, tu orden llegará directo a cocina.
          </p>
          {tableNumber && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-orange-500/20 border border-orange-500/30 px-3 py-2">
              <span className="text-orange-500">🪑</span>
              <span className="text-sm text-orange-500 font-medium">Mesa {tableNumber}</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-white">
              Nombre (opcional)
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Juan Pérez"
              className="w-full rounded-lg border border-white/10 bg-[#1a1a1f] px-4 py-3 text-white placeholder-white/40 focus:border-white/30 focus:outline-none"
            />
            <p className="mt-1 text-xs text-white/50">
              Si quieres que te llamemos por tu nombre
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Summary */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#1a1a1f] p-4">
        <div className="mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Subtotal</span>
            <span className="text-white">${getSubtotal().toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/60">IVA 19%</span>
            <span className="text-white">${getIVA().toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-2">
            <span className="font-semibold text-white">Total</span>
            <span className="text-lg font-bold text-orange-500">
              ${getTotal().toLocaleString()}
            </span>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!sessionCode || isSubmitting}
          className="w-full rounded-lg bg-orange-500 py-3 font-semibold transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Confirmar Orden
        </button>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => !isSubmitting && setShowConfirmModal(false)}
        title="¿Listo para enviar tu pedido?"
        message="Después de confirmar, tu orden llegará directo a cocina."
        type="confirm"
        onConfirm={handleConfirmOrder}
        confirmText={isSubmitting ? "Enviando..." : "Enviar Pedido"}
        cancelText="Cancelar"
      />
    </div>
  );
}
