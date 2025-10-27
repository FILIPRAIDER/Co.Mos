"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

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

export default function CarritoPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState("");

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const addToCart = (productId: string) => {
    const newCart = cart.map((item) =>
      item.product.id === productId
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );
    updateCart(newCart);
  };

  const removeFromCart = (productId: string) => {
    const existingItem = cart.find((item) => item.product.id === productId);
    if (existingItem && existingItem.quantity > 1) {
      const newCart = cart.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
      updateCart(newCart);
    } else {
      const newCart = cart.filter((item) => item.product.id !== productId);
      updateCart(newCart);
    }
  };

  const openEditNotes = (productId: string) => {
    const item = cart.find((i) => i.product.id === productId);
    setEditingItemId(productId);
    setTempNotes(item?.notes || "");
  };

  const saveNotes = () => {
    if (editingItemId) {
      const newCart = cart.map((item) =>
        item.product.id === editingItemId
          ? { ...item, notes: tempNotes.trim() || undefined }
          : item
      );
      updateCart(newCart);
    }
    setEditingItemId(null);
    setTempNotes("");
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-xl font-semibold mb-2">Tu carrito está vacío</h2>
        <p className="text-white/60 mb-6">Agrega productos para continuar</p>
        <button
          onClick={() => router.push('/menu')}
          className="rounded-2xl bg-white px-8 py-3 font-semibold text-black transition hover:bg-white/90"
        >
          Ver menú
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-sm px-6 py-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="rounded-full p-2 text-white transition hover:bg-white/10"
          >
            <X className="h-6 w-6" />
          </button>
          <div>
            <h1 className="font-serif text-xl italic">Carrito, {cart.length} Artículos</h1>
          </div>
        </div>
      </header>

      {/* Cart Items */}
      <div className="px-6 py-4 space-y-4 pb-32">
        {cart.map((item) => (
          <div
            key={item.product.id}
            className="bg-[#1a1a1f]/50 rounded-2xl p-4"
          >
            <div className="flex items-center gap-4 mb-3">
              {/* Product Image */}
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20">
                <span className="text-4xl">🍔</span>
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white mb-1 truncate">{item.product.name}</h3>
                <p className="text-xs text-white/50 truncate">{item.product.description || '400g'}</p>
                <button
                  onClick={() => openEditNotes(item.product.id)}
                  className="mt-2 text-xs text-orange-500 underline"
                >
                  Editar Producto
                </button>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                >
                  <span className="text-lg font-bold leading-none">−</span>
                </button>
                <span className="min-w-[24px] text-center font-bold text-sm">{item.quantity}</span>
                <button
                  onClick={() => addToCart(item.product.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                >
                  <span className="text-lg font-bold leading-none">+</span>
                </button>
              </div>
            </div>

            {/* Price and Notes */}
            <div className="flex justify-between items-center border-t border-white/10 pt-3">
              {item.notes && (
                <p className="text-xs text-orange-400 flex-1 mr-4">📝 {item.notes}</p>
              )}
              <p className="text-lg font-bold text-orange-500">
                $ {(item.product.price * item.quantity).toLocaleString()}
              </p>
            </div>
          </div>
        ))}

        {/* Add Observations Section */}
        <div className="rounded-2xl bg-[#1a1a1f]/30 p-4 border border-dashed border-white/10">
          <p className="text-sm text-white/60 text-center italic">
            Añadir Observaciones
          </p>
        </div>
      </div>

      {/* Bottom Summary */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-black px-6 py-4 border-t border-white/10">
        <button
          onClick={() => router.push('/confirmar')}
          className="w-full rounded-2xl bg-white py-4 font-semibold text-black transition hover:bg-white/90"
        >
          Confirmar Orden
        </button>
      </div>

      {/* Notes Modal */}
      {editingItemId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setEditingItemId(null);
              setTempNotes("");
            }}
          />
          <div className="relative z-10 w-full max-w-lg bg-[#1a1a1f] rounded-t-3xl sm:rounded-3xl p-6 animate-slideUp">
            <button
              onClick={() => {
                setEditingItemId(null);
                setTempNotes("");
              }}
              className="absolute right-4 top-4 rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="mb-4 text-xl font-semibold">Editar Producto</h3>

            <div className="mb-4">
              <label className="mb-2 block text-sm text-white/70">
                Observaciones (opcional)
              </label>
              <textarea
                value={tempNotes}
                onChange={(e) => setTempNotes(e.target.value)}
                placeholder="Ej: Sin cebolla, sin tomate, punto medio..."
                rows={4}
                autoFocus
                maxLength={200}
                className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white placeholder-white/40 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none"
                onClick={(e) => e.stopPropagation()}
              />
              <p className="mt-2 text-xs text-white/50">
                {tempNotes.length}/200 caracteres
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setEditingItemId(null);
                  setTempNotes("");
                }}
                className="flex-1 rounded-2xl border border-white/10 py-3 font-semibold text-white transition hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                onClick={saveNotes}
                className="flex-1 rounded-2xl bg-orange-500 py-3 font-semibold text-white transition hover:bg-orange-600"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
