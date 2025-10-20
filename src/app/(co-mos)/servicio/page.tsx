"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { UtensilsCrossed, CheckCircle, ArrowLeft, Clock } from "lucide-react";
import Image from "next/image";

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  notes?: string | null;
  product: {
    id: string;
    name: string;
    description?: string | null;
  };
};

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
  table: {
    id: string;
    number: number;
  };
};

type TableWithOrders = {
  id: string;
  number: number;
  available: boolean;
  sessions: Array<{
    id: string;
    active: boolean;
    customerName?: string | null;
    orders: Order[];
  }>;
};

export default function ServicioPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<TableWithOrders[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"orders" | "tables">("orders");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
    if (status === "authenticated" && session?.user?.role !== "MESERO" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    fetchOrders();
    fetchTables();
    // Polling cada 5 segundos
    const interval = setInterval(() => {
      fetchOrders();
      fetchTables();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      if (response.ok) {
        const data = await response.json();
        // Filtrar solo LISTA y ENTREGADA (recientes)
        const serviceOrders = data.filter((order: Order) => 
          order.status === "LISTA" || order.status === "ENTREGADA"
        );
        setOrders(serviceOrders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const response = await fetch("/api/tables");
      if (response.ok) {
        const data = await response.json();
        setTables(data);
      }
    } catch (error) {
      console.error("Error fetching tables:", error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchOrders();
      }
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const readyOrders = orders.filter(o => o.status === "LISTA");
  const deliveredOrders = orders.filter(o => o.status === "ENTREGADA");
  const activeTables = tables.filter(t => !t.available && t.sessions.some(s => s.active));

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
          <p className="mt-4 text-sm text-white/60">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-6">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black border-b border-zinc-800">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-lg bg-zinc-900 border border-zinc-800 p-2 transition hover:border-zinc-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Image src="/Logo.svg" alt="co.mos" width={32} height={32} />
              <span className="text-lg font-semibold">co.mos</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5">
              <UtensilsCrossed className="h-4 w-4" />
              <span className="text-sm font-medium">Servicio</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3">
              <div className="flex items-center gap-1 mb-1">
                <CheckCircle className="h-3 w-3 text-green-400" />
                <span className="text-xs text-gray-400">Listas</span>
              </div>
              <p className="text-xl font-bold">{readyOrders.length}</p>
            </div>
            <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3">
              <div className="flex items-center gap-1 mb-1">
                <Clock className="h-3 w-3 text-blue-400" />
                <span className="text-xs text-gray-400">Entregadas</span>
              </div>
              <p className="text-xl font-bold">{deliveredOrders.length}</p>
            </div>
            <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs text-gray-400">🪑 Mesas</span>
              </div>
              <p className="text-xl font-bold">{activeTables.length}</p>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="px-4 pb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setView("orders")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                view === "orders"
                  ? "bg-orange-500 text-white"
                  : "bg-zinc-900 border border-zinc-800 text-white hover:border-zinc-700"
              }`}
            >
              Órdenes ({orders.length})
            </button>
            <button
              onClick={() => setView("tables")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                view === "tables"
                  ? "bg-orange-500 text-white"
                  : "bg-zinc-900 border border-zinc-800 text-white hover:border-zinc-700"
              }`}
            >
              Mesas ({activeTables.length})
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-4">
        {view === "orders" ? (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mb-4 text-6xl">🍽️</div>
                <p className="text-lg font-semibold mb-2">Todo entregado</p>
                <p className="text-sm text-white/60">No hay órdenes pendientes de servir</p>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className={`rounded-lg border p-4 ${
                    order.status === "LISTA"
                      ? "bg-zinc-900 border-green-500"
                      : "bg-zinc-900 border-blue-500"
                  }`}
                >
                  {/* Order Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold">{order.orderNumber}</span>
                        <span
                          className={`rounded-lg px-2 py-0.5 text-xs font-medium ${
                            order.status === "LISTA"
                              ? "bg-green-500 text-white"
                              : "bg-blue-500 text-white"
                          }`}
                        >
                          {order.status === "LISTA" ? "✅ Lista" : "🚶 Entregada"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>🪑 Mesa {order.table.number}</span>
                        <span>•</span>
                        <span>{order.customerName || "Cliente"}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.createdAt).toLocaleTimeString("es-CO", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-2 mb-4">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg bg-zinc-800 border border-zinc-700 p-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-xs font-bold">
                            {item.quantity}
                          </span>
                          <span className="font-medium">{item.product.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  {order.status === "LISTA" && (
                    <button
                      onClick={() => updateOrderStatus(order.id, "ENTREGADA")}
                      className="w-full rounded-lg bg-green-500 px-4 py-3 font-semibold transition hover:bg-green-600 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Marcar como entregada
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {activeTables.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mb-4 text-6xl">🪑</div>
                <p className="text-lg font-semibold mb-2">Sin mesas activas</p>
                <p className="text-sm text-gray-400">No hay mesas ocupadas en este momento</p>
              </div>
            ) : (
              activeTables.map((table) => {
                const activeSession = table.sessions.find(s => s.active);
                const sessionOrders = activeSession?.orders || [];
                
                return (
                  <div
                    key={table.id}
                    className="rounded-lg bg-zinc-900 border border-zinc-800 p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold">Mesa {table.number}</h3>
                        {activeSession?.customerName && (
                          <p className="text-sm text-gray-400">{activeSession.customerName}</p>
                        )}
                      </div>
                      <div className="rounded-lg bg-orange-500/20 border border-orange-500/50 px-3 py-1">
                        <span className="text-sm font-medium text-orange-300">
                          {sessionOrders.length} {sessionOrders.length === 1 ? "orden" : "órdenes"}
                        </span>
                      </div>
                    </div>

                    {sessionOrders.length > 0 && (
                      <div className="space-y-2">
                        {sessionOrders.map((order) => (
                          <div
                            key={order.id}
                            className="rounded-lg bg-zinc-800 border border-zinc-700 p-2"
                          >
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{order.orderNumber}</span>
                              <span
                                className={`rounded-lg px-2 py-0.5 text-xs font-medium ${
                                  order.status === "PENDIENTE"
                                    ? "bg-yellow-500 text-black"
                                    : order.status === "PREPARANDO"
                                    ? "bg-orange-500 text-white"
                                    : order.status === "LISTA"
                                    ? "bg-green-500 text-white"
                                    : "bg-blue-500 text-white"
                                }`}
                              >
                                {order.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
