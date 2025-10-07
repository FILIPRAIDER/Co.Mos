"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Plus, Minus, ShoppingCart } from "lucide-react";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  categoryId: string;
  available: boolean;
  category: {
    id: string;
    name: string;
  };
};

export default function ProductoDetallePage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    try {
      const savedCart = localStorage.getItem("cart");
      const cart = savedCart ? JSON.parse(savedCart) : [];

      const existingItemIndex = cart.findIndex(
        (item: any) => item.product.id === product.id
      );

      if (existingItemIndex >= 0) {
        cart[existingItemIndex].quantity += quantity;
      } else {
        cart.push({
          product: {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            imageUrl: product.imageUrl,
            categoryId: product.categoryId,
            available: product.available,
          },
          quantity,
        });
      }

      localStorage.setItem("cart", JSON.stringify(cart));
      
      // Pequeño delay para asegurar que se guarde
      setTimeout(() => {
        router.push("/menu");
      }, 100);
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Error al añadir al carrito");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-xl mb-4">Producto no encontrado</p>
          <button
            onClick={() => router.push("/menu")}
            className="rounded-lg bg-orange-500 px-6 py-3 font-semibold transition hover:bg-orange-600"
          >
            Volver al Menú
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-40 p-4">
        <button
          onClick={() => router.back()}
          className="rounded-full bg-black/50 backdrop-blur-sm p-2 text-white transition hover:bg-black/70"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      </header>

      {/* Product Image */}
      <div className="relative h-[50vh] flex items-center justify-center bg-black">
        <div className="text-[200px]">🍔</div>
        {!product.available && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="rounded-full bg-red-500 px-6 py-3 font-bold">
              NO DISPONIBLE
            </div>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="rounded-t-3xl bg-black px-6 pt-6 pb-32">
        {/* Title and Price */}
        <div className="mb-4">
          <h1 className="font-serif text-3xl font-bold italic mb-1">
            {product.name}
          </h1>
          <p className="text-sm text-white/50 mb-3">{product.description || '400g'}</p>
          <p className="text-2xl font-bold text-orange-500">
            ${product.price.toLocaleString()}
          </p>
        </div>

        {/* Description */}
        {product.description && (
          <p className="text-white/70 leading-relaxed mb-6">
            {product.description}
          </p>
        )}

        {/* Suggested Products */}
        <div className="mb-6">
          <h3 className="mb-4 font-semibold italic text-lg">Añadir a la orden</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="relative flex flex-col items-center">
              <div className="relative mb-2">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20">
                  <span className="text-5xl">🍕</span>
                </div>
                <button className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg">
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              <p className="text-center text-xs font-medium mb-1">Patacón con todo</p>
              <p className="text-xs text-orange-500 font-semibold">$ 24,000</p>
            </div>

            <div className="relative flex flex-col items-center">
              <div className="relative mb-2">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20">
                  <span className="text-5xl">🌭</span>
                </div>
                <button className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg">
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              <p className="text-center text-xs font-medium mb-1">Perro caliente v2</p>
              <p className="text-xs text-orange-500 font-semibold">$ 24,000</p>
            </div>

            <div className="relative flex flex-col items-center">
              <div className="relative mb-2">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/20 to-red-700/20">
                  <span className="text-5xl">🥤</span>
                </div>
                <button className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg">
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              <p className="text-center text-xs font-medium mb-1">Coca Cola 300ml</p>
              <p className="text-xs text-orange-500 font-semibold">$ 24,000</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-black px-6 py-4">
        <button
          onClick={handleAddToCart}
          disabled={!product.available}
          className="w-full rounded-2xl bg-white py-4 font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Añadir a la orden
        </button>
      </div>
    </div>
  );
}
