"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Plus, Minus, ShoppingCart, Package, Table2 } from "lucide-react";

type Category = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  order: number;
};

type Product = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  categoryId: string;
  available: boolean;
  category?: Category;
};

type CartItem = {
  product: Product;
  quantity: number;
  notes?: string;
};

export default function OrdenesPage() {
  const searchParams = useSearchParams();
  const mesaParam = searchParams.get("mesa");
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<"mesa" | "llevar">("mesa");
  const [selectedTable, setSelectedTable] = useState<string | null>(mesaParam);

  useEffect(() => {
    if (mesaParam) {
      setOrderType("mesa");
      setSelectedTable(mesaParam);
    }
  }, [mesaParam]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [categoriesRes, productsRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/products'),
        ]);
        
        const categoriesData = await categoriesRes.json();
        const productsData = await productsRes.json();
        
        setCategories(categoriesData);
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    const existingItem = cart.find((item) => item.product.id === productId);
    if (existingItem && existingItem.quantity > 1) {
      setCart(
        cart.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
      );
    } else {
      setCart(cart.filter((item) => item.product.id !== productId));
    }
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const iva = subtotal * 0.19;
  const total = subtotal + iva;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Nuevo pedido</h2>
          <p className="mt-1 text-sm text-white/60">
            Selecciona los productos para crear una orden
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex rounded-lg bg-[#1a1a1f] p-1">
            <button
              onClick={() => setOrderType("mesa")}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
                orderType === "mesa"
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Table2 className="h-4 w-4" />
              Mesa
            </button>
            <button
              onClick={() => setOrderType("llevar")}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
                orderType === "llevar"
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Package className="h-4 w-4" />
              Para llevar
            </button>
          </div>

          {orderType === "mesa" && (
            <select
              value={selectedTable || ""}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#1a1a1f] px-4 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
            >
              <option value="">Seleccionar mesa</option>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  Mesa #{num}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Productos */}
        <div className="lg:col-span-2">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#1a1a1f] py-3 pl-10 pr-4 text-white placeholder-white/40 focus:border-white/30 focus:outline-none"
              />
            </div>
          </div>

          <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
                selectedCategory === null
                  ? "bg-orange-500 text-white"
                  : "border border-white/10 bg-[#1a1a1f] text-white/70 hover:bg-white/5"
              }`}
            >
              Todos
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  selectedCategory === category.id
                    ? "bg-orange-500 text-white"
                    : "border border-white/10 bg-[#1a1a1f] text-white/70 hover:bg-white/5"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
              <p className="mt-4 text-sm text-white/60">Cargando productos...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-white/60">No se encontraron productos</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => {
                const cartItem = cart.find((item) => item.product.id === product.id);
                return (
                  <div
                    key={product.id}
                    className="rounded-lg border border-white/10 bg-[#1a1a1f] p-4"
                  >
                    <div className="mb-3 flex h-32 items-center justify-center rounded-lg bg-white/5">
                      <div className="text-6xl">🍔</div>
                    </div>
                    <h3 className="font-medium text-white">{product.name}</h3>
                    <p className="mt-1 text-xs text-white/50">{product.description}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-lg font-semibold text-orange-500">
                        ${product.price.toLocaleString()}
                      </span>
                      <button
                        onClick={() => addToCart(product)}
                        className="rounded-full bg-orange-500 p-2 text-white transition hover:bg-orange-600"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Carrito */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 rounded-lg border border-white/10 bg-[#1a1a1f] p-6">
            <div className="mb-4 flex items-center gap-3">
              <ShoppingCart className="h-5 w-5 text-white" />
              <h3 className="text-lg font-semibold text-white">
                Carrito ({cart.length})
              </h3>
            </div>

            {cart.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-white/40">No hay productos en el carrito</p>
              </div>
            ) : (
              <>
                <div className="mb-4 max-h-64 space-y-3 overflow-y-auto">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-start gap-3 rounded-lg bg-white/5 p-3"
                    >
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-white">
                          {item.product.name}
                        </h4>
                        <p className="mt-1 text-xs text-orange-500">
                          ${item.product.price.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="rounded-md bg-white/10 p-1 transition hover:bg-white/20"
                        >
                          <Minus className="h-3 w-3 text-white" />
                        </button>
                        <span className="text-sm font-medium text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => addToCart(item.product)}
                          className="rounded-md bg-white/10 p-1 transition hover:bg-white/20"
                        >
                          <Plus className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 border-t border-white/10 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Subtotal</span>
                    <span className="text-white">${subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">IVA 19%</span>
                    <span className="text-white">${iva.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-2">
                    <span className="font-semibold text-white">Total</span>
                    <span className="text-lg font-semibold text-orange-500">
                      ${total.toLocaleString()}
                    </span>
                  </div>
                </div>

                <button className="mt-4 w-full rounded-lg bg-orange-500 py-3 font-medium text-white transition hover:bg-orange-600">
                  Enviar a cocina
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
