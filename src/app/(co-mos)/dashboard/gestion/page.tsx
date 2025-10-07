"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Clock, ChefHat, CheckCircle, Package } from "lucide-react";

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  notes?: string | null;
  product: {
    id: string;
    name: string;
  };
};

type Order = {
  id: string;
  orderNumber: string;
  type: string;
  status: string;
  customerName?: string | null;
  customerEmail?: string | null;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  table?: {
    number: number;
  } | null;
  items: OrderItem[];
};

const statusConfig = {
  PENDING: { label: 'Pendiente', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', icon: Clock },
  PREPARING: { label: 'Preparando', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: ChefHat },
  READY: { label: 'Listo', color: 'bg-green-500/20 text-green-300 border-green-500/30', icon: CheckCircle },
  DELIVERED: { label: 'Entregado', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: Package },
  PAID: { label: 'Pagado', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: CheckCircle },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: Clock },
};

export default function GestionOrdenesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('active');

  useEffect(() => {
    fetchOrders();
    // Auto-refresh cada 15 segundos
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        fetchOrders();
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'active') {
      return order.status !== 'PAID' && order.status !== 'CANCELLED';
    }
    if (filter === 'completed') {
      return order.status === 'PAID' || order.status === 'CANCELLED';
    }
    return order.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestión de Órdenes</h1>
          <p className="text-sm text-white/60">Administra el estado de todas las órdenes</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a1a1f] px-4 py-2 text-sm transition hover:bg-white/5"
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('active')}
          className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
            filter === 'active'
              ? 'bg-orange-500 text-white'
              : 'bg-[#1a1a1f] text-white/60 hover:bg-white/5'
          }`}
        >
          Activas ({orders.filter(o => o.status !== 'PAID' && o.status !== 'CANCELLED').length})
        </button>
        <button
          onClick={() => setFilter('PENDING')}
          className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
            filter === 'PENDING'
              ? 'bg-orange-500 text-white'
              : 'bg-[#1a1a1f] text-white/60 hover:bg-white/5'
          }`}
        >
          Pendientes
        </button>
        <button
          onClick={() => setFilter('PREPARING')}
          className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
            filter === 'PREPARING'
              ? 'bg-orange-500 text-white'
              : 'bg-[#1a1a1f] text-white/60 hover:bg-white/5'
          }`}
        >
          Preparando
        </button>
        <button
          onClick={() => setFilter('READY')}
          className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
            filter === 'READY'
              ? 'bg-orange-500 text-white'
              : 'bg-[#1a1a1f] text-white/60 hover:bg-white/5'
          }`}
        >
          Listos
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
            filter === 'completed'
              ? 'bg-orange-500 text-white'
              : 'bg-[#1a1a1f] text-white/60 hover:bg-white/5'
          }`}
        >
          Completadas
        </button>
      </div>

      {/* Orders Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full rounded-lg border border-white/10 bg-[#1a1a1f] p-12 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-white/20" />
            <p className="text-white/60">No hay órdenes {filter === 'active' ? 'activas' : 'en esta categoría'}</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const StatusIcon = statusConfig[order.status as keyof typeof statusConfig].icon;
            return (
              <article
                key={order.id}
                className="flex flex-col rounded-lg border border-white/10 bg-[#1a1a1f] p-4"
              >
                {/* Header */}
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="font-serif text-lg italic text-white">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-white/60">
                      {order.table ? `Mesa #${order.table.number}` : 'Para llevar'}
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${
                      statusConfig[order.status as keyof typeof statusConfig].color
                    }`}
                  >
                    <StatusIcon className="h-3.5 w-3.5" />
                    {statusConfig[order.status as keyof typeof statusConfig].label}
                  </div>
                </div>

                {/* Customer Info */}
                {order.customerName && (
                  <div className="mb-3 rounded-lg bg-white/5 p-2">
                    <p className="text-sm text-white">{order.customerName}</p>
                    {order.customerEmail && (
                      <p className="text-xs text-white/60">{order.customerEmail}</p>
                    )}
                  </div>
                )}

                {/* Items */}
                <div className="mb-3 flex-1 space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="text-sm text-white/80">
                      <span className="font-medium">{item.quantity}x</span> {item.product.name}
                      {item.notes && (
                        <p className="text-xs text-orange-400">Nota: {item.notes}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="mb-3 border-t border-white/10 pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Total</span>
                    <span className="font-bold text-orange-500">
                      ${order.total.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {order.status !== 'PAID' && order.status !== 'CANCELLED' && (
                  <div className="space-y-2">
                    {order.status === 'PENDING' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                        className="w-full rounded-lg bg-blue-500 py-2 text-sm font-medium transition hover:bg-blue-600"
                      >
                        Iniciar Preparación
                      </button>
                    )}
                    {order.status === 'PREPARING' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'READY')}
                        className="w-full rounded-lg bg-green-500 py-2 text-sm font-medium transition hover:bg-green-600"
                      >
                        Marcar como Listo
                      </button>
                    )}
                    {order.status === 'READY' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                        className="w-full rounded-lg bg-purple-500 py-2 text-sm font-medium transition hover:bg-purple-600"
                      >
                        Marcar como Entregado
                      </button>
                    )}
                    {order.status === 'DELIVERED' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'PAID')}
                        className="w-full rounded-lg bg-emerald-500 py-2 text-sm font-medium transition hover:bg-emerald-600"
                      >
                        Marcar como Pagado
                      </button>
                    )}
                    <button
                      onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                      className="w-full rounded-lg border border-red-500/50 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
                    >
                      Cancelar Orden
                    </button>
                  </div>
                )}

                {/* Time */}
                <div className="mt-3 text-xs text-white/40">
                  {new Date(order.createdAt).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
