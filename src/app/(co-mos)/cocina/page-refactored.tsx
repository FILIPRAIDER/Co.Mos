'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ChefHat, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useOrdersSocket } from '@/hooks/useOrdersSocket';
import { useNotification } from '@/hooks/useNotification';
import { useNotificationSound, useWebPushNotifications } from '@/hooks/useNotificationSound';
import { OrderCard, ConnectionStatus } from '@/components/orders/OrderComponents';
import { OrderStatusManager } from '@/lib/order-status-manager';

type FilterType = 'ALL' | 'PENDIENTE' | 'PREPARANDO';

export default function CocinaPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const notification = useNotification();
  const { playSound } = useNotificationSound();
  const { showNotification, requestPermission } = useWebPushNotifications();
  
  const [filter, setFilter] = React.useState<FilterType>('ALL');
  const [previousOrderCount, setPreviousOrderCount] = React.useState(0);

  // Solicitar permisos de notificaciones al montar
  React.useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  // Hook personalizado que maneja todo: socket, fetching, estado
  const {
    orders,
    loading,
    error,
    isConnected,
    stats,
    updateOrderStatus,
  } = useOrdersSocket({
    channel: 'cocina',
    statusFilter: ['PENDIENTE', 'PREPARANDO'],
    autoFetch: true,
    onNewOrder: (order) => {
      // Sonido
      playSound('newOrder', { vibrate: true });
      
      // Notificación toast
      notification.info(
        '🔔 Nueva Orden',
        `Pedido ${order.orderNumber} - Mesa ${order.table.number}`
      );
      
      // Notificación push del navegador
      showNotification('Nueva Orden en Cocina', {
        body: `Mesa ${order.table.number} - ${order.items.length} items`,
        tag: `order-${order.id}`,
      });
    },
    onOrderStatusChange: (data) => {
      playSound('notification');
      notification.success(
        'Estado Actualizado',
        `Orden ${data.status.toLowerCase()}`
      );
    },
  });

  // Autenticación
  React.useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/auth/login');
    }
    if (
      authStatus === 'authenticated' &&
      session?.user?.role !== 'COCINERO' &&
      session?.user?.role !== 'ADMIN'
    ) {
      router.push('/dashboard');
    }
  }, [authStatus, session, router]);

  // Detectar nuevas órdenes urgentes
  React.useEffect(() => {
    if (!loading && stats.pendientes > previousOrderCount) {
      const urgentOrders = orders.filter(o => {
        const timeElapsed = Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 1000 / 60);
        return timeElapsed > 10 && o.status === 'PENDIENTE';
      });
      
      if (urgentOrders.length > 0) {
        playSound('urgent', { vibrate: true, repeat: 2 });
      }
    }
    setPreviousOrderCount(stats.pendientes);
  }, [stats.pendientes, previousOrderCount, loading, orders, playSound]);

  const handleStatusChange = async (orderId: string, newStatus: 'PENDIENTE' | 'ACEPTADA' | 'PREPARANDO' | 'LISTA' | 'ENTREGADA' | 'COMPLETADA' | 'PAGADA' | 'CANCELADA') => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Validar transición con Strategy Pattern
    const manager = new OrderStatusManager(order.status);
    if (!manager.canTransitionTo(newStatus)) {
      notification.error(
        'Transición Inválida',
        `No se puede cambiar de ${order.status} a ${newStatus}`
      );
      return;
    }

    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (err) {
      notification.error(
        'Error',
        'No se pudo actualizar la orden'
      );
    }
  };

  // Filtrar órdenes localmente
  const filteredOrders =
    filter === 'ALL'
      ? orders
      : orders.filter((order) => order.status === filter);

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
          <p className="mt-4 text-sm text-white/60">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg font-semibold">❌ {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-orange-500 rounded-lg hover:bg-orange-600 transition"
          >
            Reintentar
          </button>
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
              onClick={() => router.push('/dashboard')}
              className="rounded-lg bg-zinc-900 border border-zinc-800 p-2 transition hover:border-zinc-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Image src="/Logo.svg" alt="co.mos" width={32} height={32} />
              <span className="text-lg font-semibold">co.mos</span>
            </div>
            <div className="flex items-center gap-2">
              <ConnectionStatus isConnected={isConnected} />
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
                <span className="text-2xl">⏱️</span>
                <span className="text-xs text-gray-400">Pendientes</span>
              </div>
              <p className="text-2xl font-bold">{stats.pendientes}</p>
            </div>
            <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3">
              <div className="flex items-center gap-2 mb-1">
                <ChefHat className="h-4 w-4 text-orange-400" />
                <span className="text-xs text-gray-400">Preparando</span>
              </div>
              <p className="text-2xl font-bold">{stats.preparando}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 pb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {(['ALL', 'PENDIENTE', 'PREPARANDO'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  filter === f
                    ? 'bg-orange-500 text-white'
                    : 'bg-zinc-900 border border-zinc-800 text-white hover:border-zinc-700'
                }`}
              >
                {f === 'ALL' ? `Todas (${orders.length})` : `${f} (${orders.filter(o => o.status === f).length})`}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Orders Grid */}
      <div className="px-4 py-4">
        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mb-4 text-6xl">👨‍🍳</div>
            <p className="text-lg font-semibold mb-2">Todo listo por ahora</p>
            <p className="text-sm text-white/60">No hay órdenes para preparar</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
                showActions={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
