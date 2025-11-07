import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/lib/socket';

export type OrderStatus = 
  | 'PENDIENTE' 
  | 'ACEPTADA' 
  | 'PREPARANDO' 
  | 'LISTA' 
  | 'ENTREGADA' 
  | 'COMPLETADA' 
  | 'PAGADA' 
  | 'CANCELADA';

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  table: {
    id: string;
    number: number;
  };
  subtotal: number;
  tax: number;
  total: number;
  notes?: string | null;
}

export interface OrderItem {
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
}

export interface UseOrdersSocketOptions {
  channel?: 'cocina' | 'servicio' | 'admin';
  statusFilter?: OrderStatus[];
  autoFetch?: boolean;
  onNewOrder?: (order: Order) => void;
  onOrderUpdate?: (order: Order) => void;
  onOrderStatusChange?: (data: { orderId: string; status: OrderStatus }) => void;
}

/**
 * Hook personalizado para manejar órdenes con Socket.IO
 * Encapsula toda la lógica de sockets, fetching y estado de órdenes
 */
export function useOrdersSocket(options: UseOrdersSocketOptions = {}) {
  const { 
    channel, 
    statusFilter, 
    autoFetch = true,
    onNewOrder,
    onOrderUpdate,
    onOrderStatusChange 
  } = options;

  const { socket, isConnected } = useSocket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener órdenes
  const fetchOrders = useCallback(async (params?: { 
    sessionCode?: string; 
    status?: string;
    tableId?: string;
  }) => {
    try {
      setError(null);
      const queryParams = new URLSearchParams();
      
      if (params?.sessionCode) queryParams.append('sessionCode', params.sessionCode);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.tableId) queryParams.append('tableId', params.tableId);
      
      const response = await fetch(`/api/orders?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Error al obtener órdenes');
      }
      
      const data: Order[] = await response.json();
      
      // Aplicar filtro de estado si existe
      const filteredOrders = statusFilter 
        ? data.filter(order => statusFilter.includes(order.status))
        : data;
      
      setOrders(filteredOrders);
      return filteredOrders;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error fetching orders:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  // Función para actualizar estado de orden CON OPTIMISTIC UPDATE
  const updateOrderStatus = useCallback(async (
    orderId: string, 
    newStatus: OrderStatus
  ) => {
    // Guardar estado anterior para rollback
    const previousOrder = orders.find(o => o.id === orderId);
    if (!previousOrder) {
      throw new Error('Orden no encontrada');
    }

    try {
      setError(null);
      
      // 1️⃣ OPTIMISTIC UPDATE - Actualizar UI inmediatamente
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus, _isPending: true } as Order & { _isPending?: boolean }
            : order
        )
      );

      // 2️⃣ Hacer la petición al servidor
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar orden');
      }

      const { order: updatedOrder } = await response.json();
      
      // 3️⃣ CONFIRMAR - Actualizar con datos del servidor
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...updatedOrder, _isPending: false }
            : order
        )
      );

      // 4️⃣ Emitir evento de socket
      if (socket?.connected) {
        socket.emit('order:statusChanged', {
          orderId,
          orderNumber: updatedOrder.orderNumber,
          status: newStatus,
          timestamp: new Date().toISOString(),
        });
      }

      return updatedOrder;
    } catch (err) {
      // 5️⃣ ROLLBACK - Restaurar estado anterior en caso de error
      console.error('Error updating order, rolling back:', err);
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...previousOrder, _isPending: false }
            : order
        )
      );
      
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar';
      setError(errorMessage);
      throw err;
    }
  }, [socket, orders]);

  // Configurar Socket.IO
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Unirse al canal específico
    if (channel) {
      socket.emit(`join:${channel}`);
      console.log(`🔌 Unido al canal: ${channel}`);
    }

    // Escuchar nuevas órdenes
    const handleNewOrder = (data: Order) => {
      console.log('🆕 Nueva orden recibida:', data.orderNumber);
      
      // Verificar si la orden coincide con el filtro
      if (!statusFilter || statusFilter.includes(data.status)) {
        setOrders(prev => [data, ...prev]);
      }
      
      onNewOrder?.(data);
    };

    // Escuchar actualizaciones de órdenes
    const handleOrderUpdate = (data: Order) => {
      console.log('🔄 Orden actualizada:', data.orderNumber);
      
      setOrders(prev => {
        const index = prev.findIndex(o => o.id === data.id);
        if (index !== -1) {
          const updated = [...prev];
          
          // Si el nuevo estado no coincide con el filtro, remover
          if (statusFilter && !statusFilter.includes(data.status)) {
            updated.splice(index, 1);
          } else {
            updated[index] = data;
          }
          
          return updated;
        }
        
        // Si no existe y coincide con el filtro, agregar
        if (!statusFilter || statusFilter.includes(data.status)) {
          return [data, ...prev];
        }
        
        return prev;
      });
      
      onOrderUpdate?.(data);
    };

    // Escuchar cambios de estado
    const handleStatusChange = (data: { orderId: string; status: OrderStatus; orderNumber: string }) => {
      console.log('✅ Estado cambiado:', data.orderNumber, '→', data.status);
      
      setOrders(prev => {
        const updated = prev.map(order => {
          if (order.id === data.orderId) {
            return { ...order, status: data.status };
          }
          return order;
        });
        
        // Filtrar si el nuevo estado no coincide
        return statusFilter
          ? updated.filter(o => statusFilter.includes(o.status))
          : updated;
      });
      
      onOrderStatusChange?.(data);
    };

    socket.on('order:new', handleNewOrder);
    socket.on('order:update', handleOrderUpdate);
    socket.on('order:statusChange', handleStatusChange);

    return () => {
      socket.off('order:new', handleNewOrder);
      socket.off('order:update', handleOrderUpdate);
      socket.off('order:statusChange', handleStatusChange);
    };
  }, [socket, isConnected, channel, statusFilter, onNewOrder, onOrderUpdate, onOrderStatusChange]);

  // Auto-fetch inicial
  useEffect(() => {
    if (autoFetch) {
      fetchOrders();
    }
  }, [autoFetch, fetchOrders]);

  // Computed values
  const ordersByStatus = {
    pendiente: orders.filter(o => o.status === 'PENDIENTE'),
    preparando: orders.filter(o => o.status === 'PREPARANDO'),
    lista: orders.filter(o => o.status === 'LISTA'),
    entregada: orders.filter(o => o.status === 'ENTREGADA'),
    completada: orders.filter(o => o.status === 'COMPLETADA'),
  };

  const stats = {
    total: orders.length,
    pendientes: ordersByStatus.pendiente.length,
    preparando: ordersByStatus.preparando.length,
    listas: ordersByStatus.lista.length,
    entregadas: ordersByStatus.entregada.length,
  };

  return {
    // State
    orders,
    loading,
    error,
    isConnected,
    
    // Computed
    ordersByStatus,
    stats,
    
    // Actions
    fetchOrders,
    updateOrderStatus,
    setOrders,
  };
}
