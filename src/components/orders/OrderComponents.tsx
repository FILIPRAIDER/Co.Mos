import React from 'react';
import { Order, OrderItem as OrderItemType, OrderStatus } from '@/hooks/useOrdersSocket';
import Image from 'next/image';
import { ChefHat, CheckCircle, Clock } from 'lucide-react';

// ========================================
// ORDER STATUS BADGE
// ========================================
interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusBadge({ status, className = '' }: OrderStatusBadgeProps) {
  const config = {
    PENDIENTE: {
      label: '⏱️ Pendiente',
      className: 'bg-yellow-500 text-black',
    },
    ACEPTADA: {
      label: '✅ Aceptada',
      className: 'bg-blue-500 text-white',
    },
    PREPARANDO: {
      label: '👨‍🍳 Preparando',
      className: 'bg-orange-500 text-white',
    },
    LISTA: {
      label: '✅ Lista',
      className: 'bg-green-500 text-white',
    },
    ENTREGADA: {
      label: '🚶 Entregada',
      className: 'bg-blue-500 text-white',
    },
    COMPLETADA: {
      label: '✅ Completada',
      className: 'bg-green-600 text-white',
    },
    PAGADA: {
      label: '💳 Pagada',
      className: 'bg-emerald-500 text-white',
    },
    CANCELADA: {
      label: '❌ Cancelada',
      className: 'bg-red-500 text-white',
    },
  };

  const { label, className: statusClassName } = config[status] || config.PENDIENTE;

  return (
    <span
      className={`rounded-lg px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusClassName} ${className}`}
    >
      {label}
    </span>
  );
}

// ========================================
// ORDER ITEM COMPONENT
// ========================================
interface OrderItemComponentProps {
  item: OrderItemType;
  index: number;
  compact?: boolean;
}

export function OrderItemComponent({ item, index, compact = false }: OrderItemComponentProps) {
  if (compact) {
    return (
      <div className="rounded-lg bg-zinc-800 border border-zinc-700 p-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-xs font-bold">
            {item.quantity}×
          </span>
          {item.product.imageUrl && (
            <div className="relative h-10 w-10 shrink-0">
              <Image
                src={item.product.imageUrl}
                alt={item.product.name}
                fill
                className="rounded-lg object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <span className="font-medium text-sm block truncate">{item.product.name}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-zinc-800 border border-zinc-700 p-4 hover:border-zinc-600 transition-colors">
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
  );
}

// ========================================
// ORDER ACTION BUTTONS
// ========================================
interface OrderActionButtonsProps {
  order: Order;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  loading?: boolean;
}

export function OrderActionButtons({ order, onStatusChange, loading = false }: OrderActionButtonsProps) {
  const getNextAction = () => {
    switch (order.status) {
      case 'PENDIENTE':
        return {
          label: 'Empezar a Preparar',
          icon: <ChefHat className="h-5 w-5" />,
          nextStatus: 'PREPARANDO' as OrderStatus,
          className: 'bg-orange-500 hover:bg-orange-600',
        };
      case 'PREPARANDO':
        return {
          label: 'Marcar como Lista',
          icon: <CheckCircle className="h-5 w-5" />,
          nextStatus: 'LISTA' as OrderStatus,
          className: 'bg-green-500 hover:bg-green-600',
        };
      case 'LISTA':
        return {
          label: 'Marcar como Entregada',
          icon: <CheckCircle className="h-5 w-5" />,
          nextStatus: 'ENTREGADA' as OrderStatus,
          className: 'bg-green-500 hover:bg-green-600',
        };
      default:
        return null;
    }
  };

  const action = getNextAction();

  if (!action) return null;

  return (
    <button
      onClick={() => onStatusChange(order.id, action.nextStatus)}
      disabled={loading}
      className={`
        w-full rounded-lg px-6 py-4 font-bold text-base transition 
        active:scale-95 flex items-center justify-center gap-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${action.className}
      `}
    >
      {loading ? (
        <>
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Actualizando...
        </>
      ) : (
        <>
          {action.icon}
          {action.label}
        </>
      )}
    </button>
  );
}

// ========================================
// ORDER CARD
// ========================================
interface OrderCardProps {
  order: Order;
  onStatusChange?: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  compact?: boolean;
  showActions?: boolean;
}

export function OrderCard({ 
  order, 
  onStatusChange, 
  compact = false,
  showActions = true 
}: OrderCardProps) {
  const [updating, setUpdating] = React.useState(false);
  
  // Detectar si está en estado pendiente (optimistic update)
  const isPending = '_isPending' in order && (order as Order & { _isPending?: boolean })._isPending;
  
  const timeElapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000 / 60);
  const isUrgent = timeElapsed > 10 && order.status === 'PENDIENTE';

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    if (!onStatusChange) return;
    
    setUpdating(true);
    try {
      await onStatusChange(orderId, newStatus);
    } catch (error) {
      console.error('Error updating order:', error);
    } finally {
      setUpdating(false);
    }
  };

  const borderColor = {
    PENDIENTE: isUrgent ? 'border-red-500 animate-pulse' : 'border-yellow-500',
    PREPARANDO: 'border-orange-500',
    LISTA: 'border-green-500',
    ENTREGADA: 'border-blue-500',
    COMPLETADA: 'border-emerald-500',
    PAGADA: 'border-emerald-600',
    CANCELADA: 'border-red-500',
    ACEPTADA: 'border-blue-400',
  };

  return (
    <div className={`rounded-lg border p-5 transition-all bg-zinc-900 ${borderColor[order.status]} ${isPending ? 'opacity-75 animate-pulse' : ''}`}>
      {/* Order Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-2xl font-bold tracking-tight">{order.orderNumber}</span>
            <OrderStatusBadge status={order.status} />
            {isPending && (
              <span className="rounded-lg bg-blue-500/20 border border-blue-500 px-2 py-1 text-xs font-bold text-blue-300 flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                Actualizando...
              </span>
            )}
            {isUrgent && (
              <span className="rounded-lg bg-red-600 px-2 py-1 text-xs font-bold text-white animate-pulse">
                ⚠️ URGENTE
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400 flex-wrap">
            <div className="flex items-center gap-1.5 rounded-lg bg-zinc-800 border border-zinc-700 px-2 py-1">
              <span className="text-lg">🪑</span>
              <span className="font-semibold">Mesa {order.table.number}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base">👤</span>
              <span>{order.customerName || 'Cliente'}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1.5 mb-1">
            <p className="text-xs text-gray-400">Recibido</p>
            <p className="text-sm font-bold">
              {new Date(order.createdAt).toLocaleTimeString('es-CO', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <p className={`text-xs font-medium ${isUrgent ? 'text-red-400' : 'text-gray-400'}`}>
            <Clock className="h-3 w-3 inline mr-1" />
            Hace {timeElapsed} min
          </p>
        </div>
      </div>

      {/* Order Items */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-800">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Productos ({order.items.length})
          </span>
        </div>
        <div className="space-y-3">
          {order.items.map((item, index) => (
            <OrderItemComponent 
              key={item.id} 
              item={item} 
              index={index} 
              compact={compact}
            />
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && onStatusChange && (
        <OrderActionButtons 
          order={order} 
          onStatusChange={handleStatusChange}
          loading={updating}
        />
      )}
    </div>
  );
}

// ========================================
// CONNECTION STATUS
// ========================================
interface ConnectionStatusProps {
  isConnected: boolean;
}

export function ConnectionStatus({ isConnected }: ConnectionStatusProps) {
  return (
    <div
      className={`rounded-lg px-3 py-1.5 flex items-center gap-2 ${
        isConnected
          ? 'bg-green-500/20 border border-green-500/50'
          : 'bg-red-500/20 border border-red-500/50 animate-pulse'
      }`}
    >
      <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
      <span className="text-xs font-medium">{isConnected ? 'En línea' : 'Desconectado'}</span>
    </div>
  );
}
