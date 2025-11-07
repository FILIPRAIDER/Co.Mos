// src/components/OfflineIndicator.tsx
'use client';

import { Wifi, WifiOff, RefreshCw, AlertTriangle, Clock } from 'lucide-react';
import { useOfflineMode } from '@/hooks/useOfflineMode';
import { useEffect, useState } from 'react';

export function OfflineIndicator() {
  const { 
    isOnline, 
    pendingOrders, 
    isSyncing,
    lastSyncTime,
    syncPendingOrders 
  } = useOfflineMode();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Auto-expandir cuando hay pedidos pendientes
  useEffect(() => {
    if (pendingOrders.length > 0) {
      setIsExpanded(true);
    }
  }, [pendingOrders.length]);

  // No mostrar nada si todo está bien
  if (isOnline && pendingOrders.length === 0) {
    return null;
  }

  const failedOrders = pendingOrders.filter(o => o.status === 'failed');
  const pendingCount = pendingOrders.filter(o => o.status === 'pending-sync').length;

  return (
    <>
      {/* Indicador principal */}
      <div className="fixed bottom-6 right-6 z-50">
        <div
          className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm transition-all ${
            isOnline
              ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
              : 'border-rose-500/50 bg-rose-500/10 text-rose-400 animate-pulse'
          } ${isExpanded ? 'min-w-[280px]' : 'min-w-[160px]'}`}
        >
          {/* Icono de estado */}
          {isOnline ? (
            <Wifi className="h-5 w-5 shrink-0" />
          ) : (
            <WifiOff className="h-5 w-5 shrink-0" />
          )}

          {/* Información */}
          <div className="flex-1">
            <p className="text-sm font-medium">
              {isOnline ? 'Conectado' : 'Sin Conexión'}
            </p>
            
            {pendingCount > 0 && (
              <p className="text-xs opacity-80 flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3" />
                {pendingCount} pedido(s) pendiente(s)
              </p>
            )}
            
            {failedOrders.length > 0 && (
              <p className="text-xs text-rose-400 flex items-center gap-1 mt-0.5">
                <AlertTriangle className="h-3 w-3" />
                {failedOrders.length} fallido(s)
              </p>
            )}

            {isSyncing && (
              <p className="text-xs opacity-80 flex items-center gap-1 mt-0.5">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Sincronizando...
              </p>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-2 shrink-0">
            {isOnline && pendingCount > 0 && !isSyncing && (
              <button
                onClick={syncPendingOrders}
                className="rounded-md bg-white/10 p-2 transition hover:bg-white/20"
                title="Sincronizar ahora"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}

            {pendingOrders.length > 0 && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="rounded-md bg-white/10 px-3 py-1 text-xs transition hover:bg-white/20"
              >
                {showDetails ? 'Ocultar' : 'Ver'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Panel de detalles */}
      {showDetails && pendingOrders.length > 0 && (
        <div className="fixed bottom-24 right-6 z-50 w-[400px] max-h-[500px] overflow-y-auto rounded-lg border border-white/10 bg-[#0f0f15] shadow-xl">
          <div className="sticky top-0 border-b border-white/10 bg-[#0f0f15] p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                Pedidos Pendientes ({pendingOrders.length})
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-white/60 transition hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="divide-y divide-white/10">
            {pendingOrders.map((order) => (
              <div key={order.id} className="p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {order.type === 'COMER_AQUI' ? '🍽️ Para mesa' : '📦 Para llevar'}
                    </p>
                    <p className="text-xs text-white/40">
                      {new Date(order.createdAt).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      order.status === 'pending-sync'
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : order.status === 'failed'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {order.status === 'pending-sync'
                      ? 'Pendiente'
                      : order.status === 'failed'
                      ? 'Fallido'
                      : 'Sincronizado'}
                  </span>
                </div>

                <div className="space-y-1">
                  {order.items.map((item, idx) => (
                    <p key={idx} className="text-xs text-white/70">
                      {item.quantity}x {item.productName}
                    </p>
                  ))}
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-orange-500">
                    ${order.total.toLocaleString()}
                  </span>
                  {order.syncAttempts > 0 && (
                    <span className="text-xs text-white/40">
                      {order.syncAttempts} intento(s)
                    </span>
                  )}
                </div>

                {order.errorMessage && (
                  <p className="mt-2 rounded bg-rose-500/10 px-2 py-1 text-xs text-rose-400">
                    {order.errorMessage}
                  </p>
                )}
              </div>
            ))}
          </div>

          {lastSyncTime && (
            <div className="border-t border-white/10 bg-white/5 p-3 text-center">
              <p className="text-xs text-white/40">
                Última sincronización:{' '}
                {new Date(lastSyncTime).toLocaleTimeString('es-ES')}
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
