// src/lib/offline-db.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineDB extends DBSchema {
  orders: {
    key: string;
    value: {
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
  };
  products: {
    key: string;
    value: {
      id: string;
      name: string;
      description?: string | null;
      price: number;
      categoryId: string;
      imageUrl?: string | null;
      available: boolean;
      lastSync: number;
    };
    indexes: { 'by-category': string };
  };
  categories: {
    key: string;
    value: {
      id: string;
      name: string;
      description?: string | null;
      order: number;
      lastSync: number;
    };
  };
  tables: {
    key: string;
    value: {
      id: string;
      number: number;
      capacity: number;
      available: boolean;
      lastSync: number;
    };
  };
}

class OfflineDatabase {
  private db: IDBPDatabase<OfflineDB> | null = null;
  private dbName = 'comos-offline';
  private version = 1;

  async init() {
    if (this.db) return this.db;

    this.db = await openDB<OfflineDB>(this.dbName, this.version, {
      upgrade(db) {
        // Store para órdenes pendientes de sincronización
        if (!db.objectStoreNames.contains('orders')) {
          db.createObjectStore('orders', { keyPath: 'id' });
        }
        
        // Store para productos (cache local)
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('by-category', 'categoryId', { unique: false });
        }
        
        // Store para categorías (cache local)
        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'id' });
        }

        // Store para mesas (cache local)
        if (!db.objectStoreNames.contains('tables')) {
          db.createObjectStore('tables', { keyPath: 'id' });
        }
      },
    });

    return this.db;
  }

  /**
   * ORDERS - Manejo de pedidos offline
   */

  async saveOfflineOrder(orderData: {
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
  }) {
    await this.init();
    
    const offlineOrder = {
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...orderData,
      status: 'pending-sync' as const,
      createdAt: Date.now(),
      syncAttempts: 0,
    };
    
    await this.db!.put('orders', offlineOrder);
    console.log('💾 Orden guardada offline:', offlineOrder.id);
    return offlineOrder;
  }

  async getPendingOrders() {
    await this.init();
    const all = await this.db!.getAll('orders');
    return all.filter(o => o.status === 'pending-sync');
  }

  async getAllOfflineOrders() {
    await this.init();
    return await this.db!.getAll('orders');
  }

  async markOrderSynced(id: string) {
    await this.init();
    const order = await this.db!.get('orders', id);
    if (order) {
      await this.db!.put('orders', { ...order, status: 'synced' });
      console.log('✅ Orden marcada como sincronizada:', id);
    }
  }

  async incrementSyncAttempts(id: string, errorMessage?: string) {
    await this.init();
    const order = await this.db!.get('orders', id);
    if (order) {
      const newAttempts = order.syncAttempts + 1;
      await this.db!.put('orders', {
        ...order,
        syncAttempts: newAttempts,
        status: newAttempts >= 3 ? 'failed' : 'pending-sync',
        errorMessage,
      });
      console.warn(`⚠️ Intento de sync ${newAttempts} fallido para orden ${id}`);
    }
  }

  async deleteOrder(id: string) {
    await this.init();
    await this.db!.delete('orders', id);
    console.log('🗑️ Orden eliminada:', id);
  }

  /**
   * PRODUCTS - Cache de productos
   */

  async cacheProducts(products: any[]) {
    await this.init();
    const tx = this.db!.transaction('products', 'readwrite');
    const timestamp = Date.now();
    
    await Promise.all([
      ...products.map(p => tx.store.put({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        categoryId: p.categoryId,
        imageUrl: p.imageUrl,
        available: p.available,
        lastSync: timestamp,
      })),
      tx.done,
    ]);
    
    console.log(`💾 ${products.length} productos cacheados`);
  }

  async getCachedProducts() {
    await this.init();
    return await this.db!.getAll('products');
  }

  async getProductsByCategory(categoryId: string) {
    await this.init();
    const tx = this.db!.transaction('products', 'readonly');
    const index = tx.store.index('by-category');
    return await index.getAll(IDBKeyRange.only(categoryId));
  }

  /**
   * CATEGORIES - Cache de categorías
   */

  async cacheCategories(categories: any[]) {
    await this.init();
    const tx = this.db!.transaction('categories', 'readwrite');
    const timestamp = Date.now();
    
    await Promise.all([
      ...categories.map(c => tx.store.put({
        id: c.id,
        name: c.name,
        description: c.description,
        order: c.order,
        lastSync: timestamp,
      })),
      tx.done,
    ]);
    
    console.log(`💾 ${categories.length} categorías cacheadas`);
  }

  async getCachedCategories() {
    await this.init();
    return await this.db!.getAll('categories');
  }

  /**
   * TABLES - Cache de mesas
   */

  async cacheTables(tables: any[]) {
    await this.init();
    const tx = this.db!.transaction('tables', 'readwrite');
    const timestamp = Date.now();
    
    await Promise.all([
      ...tables.map(t => tx.store.put({
        id: t.id,
        number: t.number,
        capacity: t.capacity,
        available: t.available,
        lastSync: timestamp,
      })),
      tx.done,
    ]);
    
    console.log(`💾 ${tables.length} mesas cacheadas`);
  }

  async getCachedTables() {
    await this.init();
    return await this.db!.getAll('tables');
  }

  /**
   * UTILITIES
   */

  async clearAllData() {
    await this.init();
    await this.db!.clear('orders');
    await this.db!.clear('products');
    await this.db!.clear('categories');
    await this.db!.clear('tables');
    console.log('🗑️ Base de datos offline limpiada');
  }

  async getStats() {
    await this.init();
    const [orders, products, categories, tables] = await Promise.all([
      this.db!.count('orders'),
      this.db!.count('products'),
      this.db!.count('categories'),
      this.db!.count('tables'),
    ]);

    return {
      orders,
      products,
      categories,
      tables,
    };
  }
}

// Singleton instance
export const offlineDB = new OfflineDatabase();
