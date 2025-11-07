// src/hooks/useOfflineMode.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { offlineDB } from '@/lib/offline-db';

export type OfflineOrder = {
  id: string;
  type: 'COMER_AQUI' | 'PARA_LLEVAR';
  tableId: string | null;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    notes?: string;
  }>;
  total: number;
  status: 'pending-sync' | 'synced' | 'failed';
  createdAt: number;
  syncAttempts: number;
  errorMessage?: string;
};

export function useOfflineMode() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingOrders, setPendingOrders] = useState<OfflineOrder[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  // Detectar estado de conexión
  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      console.log(online ? '🌐 Conexión restaurada' : '📵 Sin conexión');
    };

    // Check initial status
    updateOnlineStatus();

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Cargar pedidos pendientes al iniciar
  useEffect(() => {
    loadPendingOrders();
  }, []);

  // Auto-sincronizar cuando vuelva la conexión
  useEffect(() => {
    if (isOnline && pendingOrders.length > 0) {
      console.log(`🔄 Conexión detectada, sincronizando ${pendingOrders.length} pedido(s)...`);
      syncPendingOrders();
    }
  }, [isOnline]);

  const loadPendingOrders = async () => {
    try {
      const pending = await offlineDB.getPendingOrders();
      setPendingOrders(pending);
      console.log(`📦 ${pending.length} pedido(s) pendiente(s) de sincronización`);
    } catch (error) {
      console.error('Error cargando pedidos pendientes:', error);
    }
  };

  const syncPendingOrders = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    let successCount = 0;
    let failCount = 0;

    const pending = await offlineDB.getPendingOrders();

    for (const order of pending) {
      try {
        console.log(`🔄 Sincronizando orden ${order.id}...`);
        
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: order.type,
            tableId: order.tableId,
            items: order.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              notes: item.notes || null,
            })),
          }),
        });

        if (response.ok) {
          await offlineDB.markOrderSynced(order.id);
          successCount++;
          console.log(`✅ Orden ${order.id} sincronizada exitosamente`);
        } else {
          const errorData = await response.json();
          await offlineDB.incrementSyncAttempts(order.id, errorData.error || 'Error desconocido');
          failCount++;
          console.error(`❌ Error sincronizando orden ${order.id}:`, errorData.error);
        }
      } catch (error) {
        await offlineDB.incrementSyncAttempts(
          order.id, 
          error instanceof Error ? error.message : 'Error de red'
        );
        failCount++;
        console.error(`❌ Excepción sincronizando orden ${order.id}:`, error);
      }
    }

    // Actualizar lista después de sincronizar
    await loadPendingOrders();
    setIsSyncing(false);
    setLastSyncTime(Date.now());

    console.log(`✨ Sincronización completa: ${successCount} exitosas, ${failCount} fallidas`);
    return { successCount, failCount };
  }, [isOnline, isSyncing]);

  const createOfflineOrder = useCallback(async (orderData: {
    type: 'COMER_AQUI' | 'PARA_LLEVAR';
    tableId: string | null;
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      price: number;
      notes?: string;
    }>;
    total: number;
  }) => {
    try {
      const offlineOrder = await offlineDB.saveOfflineOrder(orderData);
      setPendingOrders(prev => [...prev, offlineOrder]);
      console.log('💾 Orden guardada offline:', offlineOrder.id);
      
      // Si hay conexión, intentar sincronizar inmediatamente
      if (isOnline) {
        await syncPendingOrders();
      }
      
      return offlineOrder;
    } catch (error) {
      console.error('Error guardando orden offline:', error);
      throw error;
    }
  }, [isOnline, syncPendingOrders]);

  const cacheData = useCallback(async (data: {
    products?: any[];
    categories?: any[];
    tables?: any[];
  }) => {
    try {
      if (data.products) {
        await offlineDB.cacheProducts(data.products);
      }
      if (data.categories) {
        await offlineDB.cacheCategories(data.categories);
      }
      if (data.tables) {
        await offlineDB.cacheTables(data.tables);
      }
      console.log('💾 Datos cacheados para modo offline');
    } catch (error) {
      console.error('Error cacheando datos:', error);
    }
  }, []);

  const getCachedData = useCallback(async () => {
    try {
      const [products, categories, tables] = await Promise.all([
        offlineDB.getCachedProducts(),
        offlineDB.getCachedCategories(),
        offlineDB.getCachedTables(),
      ]);
      
      return { products, categories, tables };
    } catch (error) {
      console.error('Error obteniendo datos cacheados:', error);
      return { products: [], categories: [], tables: [] };
    }
  }, []);

  return {
    isOnline,
    pendingOrders,
    isSyncing,
    lastSyncTime,
    createOfflineOrder,
    syncPendingOrders,
    loadPendingOrders,
    cacheData,
    getCachedData,
  };
}
