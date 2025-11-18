/**
 * Sistema de Auto-cierre de Sesiones Inactivas
 * Cierra automáticamente sesiones de mesas que no tienen pedidos activos después de un tiempo
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// Configuración: tiempo de inactividad antes de cerrar sesión (en minutos)
const INACTIVITY_TIMEOUT_MINUTES = 30;

/**
 * Verificar y cerrar sesiones inactivas
 * Una sesión se considera inactiva si:
 * - La mesa está ocupada (sesión activa)
 * - No hay pedidos activos (todos están pagados, completados o cancelados)
 * - Han pasado más de INACTIVITY_TIMEOUT_MINUTES desde el último pedido
 */
export async function closeInactiveSessions() {
  try {
    const now = new Date();
    const timeoutDate = new Date(now.getTime() - INACTIVITY_TIMEOUT_MINUTES * 60 * 1000);

    // Buscar todas las sesiones activas
    const activeSessions = await prisma.tableSession.findMany({
      where: {
        active: true,
      },
      include: {
        table: true,
        orders: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    logger.info(`🔍 Verificando ${activeSessions.length} sesiones activas para auto-cierre`);

    let closedCount = 0;

    for (const session of activeSessions) {
      // Verificar si hay pedidos activos
      const activeOrders = session.orders.filter(
        (order) =>
          order.status !== 'PAGADA' &&
          order.status !== 'COMPLETADA' &&
          order.status !== 'CANCELADA'
      );

      // Si hay pedidos activos, no cerrar la sesión
      if (activeOrders.length > 0) {
        continue;
      }

      // Si no hay pedidos en absoluto, cerrar inmediatamente
      if (session.orders.length === 0) {
        await closeSession(session.id, session.table.id, 'sin_pedidos');
        closedCount++;
        continue;
      }

      // Si todos los pedidos están completos, verificar el tiempo de inactividad
      const lastOrder = session.orders[0]; // El más reciente
      const lastOrderTime = new Date(lastOrder.updatedAt || lastOrder.createdAt);

      if (lastOrderTime < timeoutDate) {
        await closeSession(session.id, session.table.id, 'inactividad');
        closedCount++;
      }
    }

    if (closedCount > 0) {
      logger.info(`✅ Se cerraron ${closedCount} sesiones inactivas automáticamente`);
    }

    return closedCount;
  } catch (error) {
    logger.error('Error al cerrar sesiones inactivas', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return 0;
  }
}

/**
 * Cerrar una sesión específica
 */
async function closeSession(sessionId: string, tableId: string, reason: string) {
  try {
    // Actualizar sesión
    await prisma.tableSession.update({
      where: { id: sessionId },
      data: { active: false },
    });

    // Marcar mesa como disponible
    await prisma.table.update({
      where: { id: tableId },
      data: { available: true },
    });

    logger.info(`🔒 Sesión cerrada automáticamente`, {
      sessionId,
      tableId,
      reason,
    });

    // Emitir evento Socket.IO si está disponible
    if (global.io) {
      const session = await prisma.tableSession.findUnique({
        where: { id: sessionId },
        include: { table: true },
      });

      if (session) {
        global.io.to('admin').emit('session:close', {
          sessionId: session.id,
          sessionCode: session.sessionCode,
          tableNumber: session.table.number,
          reason: 'auto_close_' + reason,
        });

        global.io.to('servicio').emit('session:close', {
          sessionId: session.id,
          sessionCode: session.sessionCode,
          tableNumber: session.table.number,
          reason: 'auto_close_' + reason,
        });

        global.io.to('admin').emit('table:update', {
          tableId: session.table.id,
          tableNumber: session.table.number,
          available: true,
        });
      }
    }
  } catch (error) {
    logger.error('Error al cerrar sesión', {
      sessionId,
      error: error instanceof Error ? error.message : 'Unknown',
    });
  }
}

/**
 * Verificar sesión específica y cerrar si está inactiva
 */
export async function checkAndCloseSessionIfInactive(sessionId: string) {
  try {
    const session = await prisma.tableSession.findUnique({
      where: { id: sessionId },
      include: {
        table: true,
        orders: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!session || !session.active) {
      return false;
    }

    // Verificar si hay pedidos activos
    const activeOrders = session.orders.filter(
      (order) =>
        order.status !== 'PAGADA' &&
        order.status !== 'COMPLETADA' &&
        order.status !== 'CANCELADA'
    );

    if (activeOrders.length > 0) {
      return false;
    }

    // Si no hay pedidos activos, cerrar la sesión
    await closeSession(session.id, session.table.id, 'verificacion_manual');
    return true;
  } catch (error) {
    logger.error('Error al verificar sesión', {
      sessionId,
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return false;
  }
}

/**
 * Iniciar job periódico para cerrar sesiones inactivas
 * Se ejecuta cada 5 minutos
 */
export function startSessionCleanupJob() {
  const INTERVAL_MINUTES = 5;
  
  logger.info(`🕐 Iniciando job de limpieza de sesiones (cada ${INTERVAL_MINUTES} minutos)`);
  
  // Ejecutar inmediatamente al inicio
  closeInactiveSessions();
  
  // Luego ejecutar periódicamente
  setInterval(() => {
    closeInactiveSessions();
  }, INTERVAL_MINUTES * 60 * 1000);
}
