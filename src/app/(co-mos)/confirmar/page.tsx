"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";
import Modal from "@/components/Modal";

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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    } else {
      router.push('/menu');
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
    if (!customerName.trim()) {
      alert('Por favor ingresa tu nombre');
      return;
    }
    if (!customerEmail.trim()) {
      alert('Por favor ingresa tu correo electrónico');
      return;
    }
    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail.trim())) {
      alert('Por favor ingresa un correo electrónico válido');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmOrder = async () => {
    setIsSubmitting(true);
    
    try {
      const orderData = {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          notes: item.notes,
        })),
        subtotal: getSubtotal(),
        tax: getIVA(),
        total: getTotal(),
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Error al crear la orden');
      }

      const result = await response.json();
      
      // Limpiar carrito
      localStorage.removeItem('cart');
      
      // Redirigir a página de éxito
      router.push(`/pedido-enviado?orderId=${result.order.id}`);
    } catch (error) {
      console.error('Error:', error);
      alert('Hubo un error al enviar tu pedido. Por favor intenta de nuevo.');
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  if (cart.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-32">
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
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-white/5">
                <span className="text-3xl">🍔</span>
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
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-white">
              Nombre completo
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Juan Pérez"
              className="w-full rounded-lg border border-white/10 bg-[#1a1a1f] px-4 py-3 text-white placeholder-white/40 focus:border-white/30 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white">
              Correo electrónico
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="juan@ejemplo.com"
              className="w-full rounded-lg border border-white/10 bg-[#1a1a1f] px-4 py-3 text-white placeholder-white/40 focus:border-white/30 focus:outline-none"
            />
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
          disabled={!customerName.trim() || !customerEmail.trim()}
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
