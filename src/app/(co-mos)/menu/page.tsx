"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ShoppingCart, X } from "lucide-react";
import Image from "next/image";

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

const categoryEmojis: Record<string, string> = {
  "Combos & Promociones": "🎁",
  "Platos Fuertes": "🍔",
  "Entradas & Snacks": "🍟",
  "Bebidas": "🥤",
  "Postres y Dulces": "🍰",
};

function MenuContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState<number | null>(null);

  // Cargar sessionCode y tableNumber desde query params o localStorage
  useEffect(() => {
    const sessionFromUrl = searchParams.get('session');
    if (sessionFromUrl) {
      setSessionCode(sessionFromUrl);
      localStorage.setItem('sessionCode', sessionFromUrl);
      
      // Obtener también el tableNumber del localStorage (fue guardado en el scan)
      const savedTableNumber = localStorage.getItem('tableNumber');
      if (savedTableNumber) {
        setTableNumber(parseInt(savedTableNumber));
      }
    } else {
      // Intentar cargar desde localStorage
      const savedSession = localStorage.getItem('sessionCode');
      const savedTableNumber = localStorage.getItem('tableNumber');
      if (savedSession) {
        setSessionCode(savedSession);
      }
      if (savedTableNumber) {
        setTableNumber(parseInt(savedTableNumber));
      }
    }
  }, [searchParams]);

  // Cargar carrito desde localStorage al montar el componente
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
  }, []);

  // Guardar carrito en localStorage cada vez que cambie
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart]);

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
        
        // Seleccionar primera categoría por defecto
        if (categoriesData.length > 0) {
          setSelectedCategory(categoriesData[0].id);
        }
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
    const matchesSearch = searchQuery === "" || product.name.toLowerCase().includes(searchQuery.toLowerCase());
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

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  const handleViewCart = () => {
    // Guardar carrito y sessionCode en localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    if (sessionCode) {
      localStorage.setItem('sessionCode', sessionCode);
    }
    router.push('/carrito');
  };

  const currentCategory = categories.find(cat => cat.id === selectedCategory);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0f] border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Image src="/Logo.svg" alt="co.mos" width={32} height={32} />
            <div className="flex flex-col">
              <span className="text-lg font-semibold">co.mos</span>
              {tableNumber && (
                <span className="text-xs text-orange-500 font-medium">
                  Mesa {tableNumber}
                </span>
              )}
            </div>
          </div>
          
          <button
            onClick={() => setShowCart(!showCart)}
            className="relative rounded-full bg-orange-500 p-3 transition hover:bg-orange-600"
          >
            <ShoppingCart className="h-5 w-5" />
            {getTotalItems() > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold">
                {getTotalItems()}
              </span>
            )}
          </button>
        </div>

        {/* Búsqueda */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Buscar Platos"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#1a1a1f] py-3 pl-10 pr-4 text-white placeholder-white/40 focus:border-white/30 focus:outline-none"
            />
          </div>
        </div>
      </header>

      {/* Categorías */}
      <div className="border-b border-white/10 bg-[#0a0a0f] px-4 py-4">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex shrink-0 flex-col items-center gap-2 rounded-lg p-3 transition min-w-[90px] ${
                selectedCategory === category.id
                  ? "bg-orange-500"
                  : "bg-[#1a1a1f] hover:bg-[#252530]"
              }`}
            >
              {category.imageUrl ? (
                <div className="relative h-10 w-10 rounded-full overflow-hidden">
                  <Image
                    src={category.imageUrl}
                    alt={category.name}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
              ) : (
                <div className="text-3xl">
                  {categoryEmojis[category.name] || "🍽️"}
                </div>
              )}
              <span className="text-xs font-medium text-center">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Productos */}
      <div className="p-4">
        {currentCategory && (
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{currentCategory.name}</h2>
            {currentCategory.description && (
              <p className="mt-1 text-sm text-white/60">{currentCategory.description}</p>
            )}
          </div>
        )}

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
          <div className="space-y-4">
            {filteredProducts.map((product) => {
              const cartItem = cart.find((item) => item.product.id === product.id);
              const inCart = cartItem ? cartItem.quantity : 0;

              return (
                <div
                  key={product.id}
                  className="flex gap-4 rounded-lg border border-white/10 bg-[#1a1a1f] p-4"
                >
                  <div 
                    onClick={() => router.push(`/producto/${product.id}`)}
                    className="relative h-24 w-24 shrink-0 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition"
                  >
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-zinc-800">
                        <svg className="h-10 w-10 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="9" cy="9" r="2" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-between">
                    <div 
                      onClick={() => router.push(`/producto/${product.id}`)}
                      className="cursor-pointer"
                    >
                      <h3 className="font-semibold text-white hover:text-orange-500 transition">{product.name}</h3>
                      <p className="mt-1 text-xs text-white/60 line-clamp-2">{product.description}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-orange-500">
                        ${product.price.toLocaleString()}
                      </span>

                      {inCart > 0 ? (
                        <div className="flex items-center gap-3 rounded-full bg-orange-500 px-3 py-1">
                          <button
                            onClick={() => removeFromCart(product.id)}
                            className="text-white transition hover:scale-110"
                          >
                            <span className="text-xl font-bold">−</span>
                          </button>
                          <span className="min-w-[20px] text-center font-bold text-white">
                            {inCart}
                          </span>
                          <button
                            onClick={() => addToCart(product)}
                            className="text-white transition hover:scale-110"
                          >
                            <span className="text-xl font-bold">+</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(product)}
                          className="rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600"
                        >
                          Añadir
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart Bottom Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#1a1a1f] p-4">
          <button
            onClick={handleViewCart}
            className="flex w-full items-center justify-between rounded-lg bg-orange-500 px-6 py-4 transition hover:bg-orange-600"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <span className="font-bold">{getTotalItems()}</span>
              </div>
              <span className="font-semibold">Ver carrito</span>
            </div>
            <span className="text-lg font-bold">${getSubtotal().toLocaleString()}</span>
          </button>
        </div>
      )}

      {/* Mini Cart Overlay */}
      {showCart && cart.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onClick={() => setShowCart(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-full max-w-md bg-[#0a0a0f] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <h3 className="text-lg font-semibold">Tu pedido</h3>
              <button
                onClick={() => setShowCart(false)}
                className="rounded-full p-2 transition hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-4">
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-3 rounded-lg bg-[#1a1a1f] p-3"
                  >
                    {item.product.imageUrl && (
                      <div className="relative h-12 w-12 shrink-0 rounded overflow-hidden">
                        <Image
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{item.product.name}</h4>
                      <p className="text-sm text-orange-500">
                        ${item.product.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="rounded-md bg-white/10 px-2 py-1 transition hover:bg-white/20"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => addToCart(item.product)}
                        className="rounded-md bg-white/10 px-2 py-1 transition hover:bg-white/20"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 p-4">
              <button
                onClick={handleViewCart}
                className="w-full rounded-lg bg-orange-500 py-3 font-semibold transition hover:bg-orange-600"
              >
                Continuar con el pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
          <p className="mt-4 text-sm text-white/60">Cargando menú...</p>
        </div>
      </div>
    }>
      <MenuContent />
    </Suspense>
  );
}
