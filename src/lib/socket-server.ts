/**
 * Socket.IO Server Helper
 * Helper para emitir eventos Socket.IO desde las APIs del servidor
 */

import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

/**
 * Inicializar la instancia de Socket.IO
 * Debe ser llamado desde server.js
 */
export function initSocketIO(socketServer: SocketIOServer) {
  io = socketServer;
  console.log('✅ Socket.IO helper inicializado');
}

/**
 * Obtener la instancia de Socket.IO
 */
export function getIO(): SocketIOServer | null {
  return io;
}

/**
 * Emitir evento de nueva orden
 */
export function emitOrderCreated(orderData: any) {
  if (!io) {
    console.warn('⚠️ Socket.IO no inicializado - no se puede emitir order:created');
    return;
  }
  
  console.log('📤 Emitiendo order:new para:', orderData.orderNumber);
  
  // Emitir a todos los canales relevantes
  io.to('cocina').emit('order:new', orderData);
  io.to('servicio').emit('order:new', orderData);
  io.to('admin').emit('order:new', orderData);
}

/**
 * Emitir evento de actualización de orden
 */
export function emitOrderUpdated(orderData: any, previousStatus?: string) {
  if (!io) {
    console.warn('⚠️ Socket.IO no inicializado - no se puede emitir order:updated');
    return;
  }
  
  console.log('📤 Emitiendo order:update para:', orderData.orderNumber, '→', orderData.status);
  
  // Emitir actualización completa
  io.to('cocina').emit('order:update', orderData);
  io.to('servicio').emit('order:update', orderData);
  io.to('admin').emit('order:update', orderData);
  
  // Emitir cambio de estado específico
  io.to('cocina').emit('order:statusChange', {
    orderId: orderData.id,
    orderNumber: orderData.orderNumber,
    status: orderData.status,
    previousStatus,
    tableNumber: orderData.table?.number,
    timestamp: new Date().toISOString(),
  });
  
  io.to('servicio').emit('order:statusChange', {
    orderId: orderData.id,
    orderNumber: orderData.orderNumber,
    status: orderData.status,
    previousStatus,
    tableNumber: orderData.table?.number,
    timestamp: new Date().toISOString(),
  });
  
  io.to('admin').emit('order:statusChange', {
    orderId: orderData.id,
    orderNumber: orderData.orderNumber,
    status: orderData.status,
    previousStatus,
    tableNumber: orderData.table?.number,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emitir evento de mesa actualizada
 */
export function emitTableUpdated(tableData: any) {
  if (!io) {
    console.warn('⚠️ Socket.IO no inicializado - no se puede emitir table:updated');
    return;
  }
  
  console.log('📤 Emitiendo table:update para mesa:', tableData.number);
  
  io.to('admin').emit('table:update', tableData);
  io.to('servicio').emit('table:update', tableData);
}

/**
 * Emitir evento de sesión cerrada
 */
export function emitSessionClosed(sessionData: any) {
  if (!io) {
    console.warn('⚠️ Socket.IO no inicializado - no se puede emitir session:closed');
    return;
  }
  
  console.log('📤 Emitiendo session:close para:', sessionData.sessionCode);
  
  io.to('admin').emit('session:close', sessionData);
  io.to('servicio').emit('session:close', sessionData);
}

/**
 * Emitir evento de sesión creada
 */
export function emitSessionCreated(sessionData: any) {
  if (!io) {
    console.warn('⚠️ Socket.IO no inicializado - no se puede emitir session:created');
    return;
  }
  
  console.log('📤 Emitiendo session:new para:', sessionData.sessionCode);
  
  io.to('admin').emit('session:new', sessionData);
}
