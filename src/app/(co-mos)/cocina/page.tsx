"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChefHat, Clock, CheckCircle, ArrowLeft, Wifi, WifiOff } from "lucide-react";
import Image from "next/image";
import { useSocket, emitEvent } from "@/lib/socket";

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  notes?: string | null;
  product: {
    id: string;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
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

export default function CocinaPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { socket, isConnected } = useSocket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"PENDIENTE" | "PREPARANDO" | "ALL">("ALL");
  const [previousOrderCount, setPreviousOrderCount] = useState(0);
  const [newOrderAlert, setNewOrderAlert] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
    if (status === "authenticated" && session?.user?.role !== "COCINERO" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  // Configurar Socket.io
  useEffect(() => {
    if (socket) {
      // Unirse al canal de cocina
      socket.emit('join:cocina');

      // Escuchar nuevas órdenes
      socket.on('order:new', (data) => {
        console.log('🔔 Nueva orden recibida:', data);
        playNotificationSound();
        setNewOrderAlert(true);
        setTimeout(() => setNewOrderAlert(false), 3000);
        fetchOrders();
      });

      // Escuchar actualizaciones de órdenes
      socket.on('order:update', (data) => {
        console.log('🔄 Orden actualizada:', data);
        fetchOrders();
      });

      socket.on('order:statusChange', (data) => {
        console.log('✅ Estado de orden cambiado:', data);
        fetchOrders();
      });

      return () => {
        socket.off('order:new');
        socket.off('order:update');
        socket.off('order:statusChange');
      };
    }
  }, [socket]);

  // Cargar órdenes inicialmente
  useEffect(() => {
    fetchOrders();
  }, []);

  const playNotificationSound = () => {
    // Crear un sonido de notificación simple usando Web Audio API
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch {
      console.log("No se pudo reproducir el sonido");
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      if (response.ok) {
        const data = await response.json();
        // Filtrar solo PENDIENTE y PREPARANDO
        const kitchenOrders = data.filter((order: Order) => 
          order.status === "PENDIENTE" || order.status === "PREPARANDO"
        );
        
        // Detectar nuevas órdenes
        const pendingOrders = kitchenOrders.filter((o: Order) => o.status === "PENDIENTE");
        if (!loading && pendingOrders.length > previousOrderCount) {
          setNewOrderAlert(true);
          playNotificationSound();
          setTimeout(() => setNewOrderAlert(false), 3000);
        }
        
        setPreviousOrderCount(pendingOrders.length);
        setOrders(kitchenOrders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
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
        const updatedOrder = await response.json();
        
        // Emitir evento de Socket.io
        emitEvent('order:statusChanged', {
          orderId: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          status: newStatus,
          timestamp: new Date().toISOString(),
        });
        
        await fetchOrders();
      }
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const filteredOrders = filter === "ALL" 
    ? orders 
    : orders.filter(order => order.status === filter);

  const pendingCount = orders.filter(o => o.status === "PENDIENTE").length;
  const preparingCount = orders.filter(o => o.status === "PREPARANDO").length;

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
      {/* New Order Alert */}
      {newOrderAlert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-fadeIn">
          <div className="rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-4 shadow-2xl border-2 border-white/50 flex items-center gap-3">
            <div className="animate-bounce">
              <span className="text-3xl">🔔</span>
            </div>
            <div>
              <p className="font-bold text-white text-lg">¡Nueva Orden!</p>
              <p className="text-sm text-white/90">Pedido recibido en cocina</p>
            </div>
          </div>
        </div>
      )}

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
            <div className="flex items-center gap-2">
              {/* Connection Status */}
              <div className={`rounded-lg px-2 py-1 flex items-center gap-1.5 ${
                isConnected 
                  ? 'bg-green-500/20 border border-green-500/50' 
                  : 'bg-red-500/20 border border-red-500/50'
              }`}>
                {isConnected ? (
                  <Wifi className="h-3 w-3 text-green-300" />
                ) : (
                  <WifiOff className="h-3 w-3 text-red-300" />
                )}
                <span className="text-xs">{isConnected ? 'En línea' : 'Desconectado'}</span>
              </div>
              
              <div className="flex items-center gap-2 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5">
                <ChefHat className="h-4 w-4" />
                <span className="text-sm font-medium">Cocina</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-yellow-400" />
                <span className="text-xs text-gray-400">Pendientes</span>
              </div>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </div>
            <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3">
              <div className="flex items-center gap-2 mb-1">
                <ChefHat className="h-4 w-4 text-orange-400" />
                <span className="text-xs text-gray-400">Preparando</span>
              </div>
              <p className="text-2xl font-bold">{preparingCount}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 pb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setFilter("ALL")}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
                filter === "ALL"
                  ? "bg-orange-500 text-white"
                  : "bg-zinc-900 border border-zinc-800 text-white hover:border-zinc-700"
              }`}
            >
              Todas ({orders.length})
            </button>
            <button
              onClick={() => setFilter("PENDIENTE")}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
                filter === "PENDIENTE"
                  ? "bg-orange-500 text-white"
                  : "bg-zinc-900 border border-zinc-800 text-white hover:border-zinc-700"
              }`}
            >
              Pendientes ({pendingCount})
            </button>
            <button
              onClick={() => setFilter("PREPARANDO")}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
                filter === "PREPARANDO"
                  ? "bg-orange-500 text-white"
                  : "bg-zinc-900 border border-zinc-800 text-white hover:border-zinc-700"
              }`}
            >
              Preparando ({preparingCount})
            </button>
          </div>
        </div>
      </header>

      {/* Orders List */}
      <div className="px-4 py-4 space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mb-4 text-6xl">👨‍🍳</div>
            <p className="text-lg font-semibold mb-2">Todo listo por ahora</p>
            <p className="text-sm text-white/60">No hay órdenes para preparar</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const timeElapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000 / 60);
            const isUrgent = timeElapsed > 10;
            
            return (
              <div
                key={order.id}
                className={`rounded-lg border p-5 transition-all ${
                  order.status === "PENDIENTE"
                    ? isUrgent 
                      ? "bg-zinc-900 border-red-500 animate-pulse" 
                      : "bg-zinc-900 border-yellow-500"
                    : "bg-zinc-900 border-orange-500"
                }`}
              >
                {/* Order Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl font-bold tracking-tight">{order.orderNumber}</span>
                      <span
                        className={`rounded-lg px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                          order.status === "PENDIENTE"
                            ? isUrgent
                              ? "bg-red-500 text-white"
                              : "bg-yellow-500 text-black"
                            : "bg-orange-500 text-white"
                        }`}
                      >
                        {order.status === "PENDIENTE" ? "⏱️ Pendiente" : "👨‍🍳 Preparando"}
                      </span>
                      {isUrgent && order.status === "PENDIENTE" && (
                        <span className="rounded-lg bg-red-600 px-2 py-1 text-xs font-bold text-white animate-pulse">
                          ⚠️ URGENTE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <div className="flex items-center gap-1.5 rounded-lg bg-zinc-800 border border-zinc-700 px-2 py-1">
                        <span className="text-lg">🪑</span>
                        <span className="font-semibold">Mesa {order.table.number}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">👤</span>
                        <span>{order.customerName || "Cliente"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1.5 mb-1">
                      <p className="text-xs text-gray-400">Recibido</p>
                      <p className="text-sm font-bold">
                        {new Date(order.createdAt).toLocaleTimeString("es-CO", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <p className={`text-xs font-medium ${isUrgent ? "text-red-400" : "text-gray-400"}`}>
                      Hace {timeElapsed} min
                    </p>
                  </div>
                </div>

                {/* Order Items - Professional Layout */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-800">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Productos ({order.items.length})
                    </span>
                  </div>
                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <div
                        key={item.id}
                        className="rounded-lg bg-zinc-800 border border-zinc-700 p-4 hover:border-zinc-600 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {/* Quantity Badge */}
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500 font-bold text-lg">
                            {item.quantity}×
                          </div>

                          {/* Product Image */}
                          {item.product.imageUrl && (
                            <div className="relative h-12 w-12 shrink-0">
                              <Image
                                src={item.product.imageUrl}
                                alt={item.product.name}
                                fill
                                className="rounded-lg object-cover"
                              />
                            </div>
                          )}

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-bold text-base text-white leading-tight">
                                {item.product.name}
                              </h4>
                              <span className="shrink-0 rounded-md bg-zinc-700 px-2 py-0.5 text-xs font-medium text-gray-300">
                                #{index + 1}
                              </span>
                            </div>
                            {item.product.description && (
                              <p className="text-xs text-gray-400 leading-relaxed mb-2">
                                {item.product.description}
                              </p>
                            )}
                            
                            {/* Notes - Highlighted */}
                            {item.notes && (
                              <div className="mt-3 rounded-lg bg-orange-500/20 border-l-4 border-orange-500 p-3">
                                <div className="flex items-start gap-2">
                                  <span className="text-lg shrink-0">📝</span>
                                  <div className="flex-1">
                                    <p className="text-xs font-bold text-orange-300 uppercase tracking-wide mb-1">
                                      Observaciones:
                                    </p>
                                    <p className="text-sm text-white font-medium leading-relaxed">
                                      {item.notes}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {order.status === "PENDIENTE" ? (
                    <button
                      onClick={() => updateOrderStatus(order.id, "PREPARANDO")}
                      className="flex-1 rounded-lg bg-orange-500 px-6 py-4 font-bold text-base transition hover:bg-orange-600 active:scale-95 flex items-center justify-center gap-2"
                    >
                      <ChefHat className="h-5 w-5" />
                      Empezar a Preparar
                    </button>
                  ) : (
                    <button
                      onClick={() => updateOrderStatus(order.id, "LISTA")}
                      className="flex-1 rounded-lg bg-green-500 px-6 py-4 font-bold text-base transition hover:bg-green-600 active:scale-95 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="h-5 w-5" />
                      ✓ Marcar como Lista
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
