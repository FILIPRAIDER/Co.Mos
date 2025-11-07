import { OrderStatus } from '@/hooks/useOrdersSocket';

/**
 * PATRÓN STRATEGY - Gestión de Estados de Órdenes
 * 
 * Este patrón permite encapsular las reglas de negocio y transiciones
 * de estado en clases separadas, facilitando el mantenimiento y extensión.
 */

// ========================================
// INTERFACES
// ========================================
export interface OrderStatusTransition {
  from: OrderStatus;
  to: OrderStatus;
  validate: () => boolean;
  execute?: () => void | Promise<void>;
  undoable?: boolean;
}

export interface StatusStrategy {
  canTransitionTo(nextStatus: OrderStatus): boolean;
  getAvailableTransitions(): OrderStatus[];
  getNextRecommendedStatus(): OrderStatus | null;
  getStatusColor(): string;
  getStatusIcon(): string;
  getStatusLabel(): string;
  shouldNotify(): boolean;
  getNotificationMessage(): string;
}

// ========================================
// BASE STRATEGY (Abstract)
// ========================================
abstract class BaseStatusStrategy implements StatusStrategy {
  constructor(protected currentStatus: OrderStatus) {}

  abstract canTransitionTo(nextStatus: OrderStatus): boolean;
  abstract getAvailableTransitions(): OrderStatus[];
  abstract getNextRecommendedStatus(): OrderStatus | null;

  getStatusColor(): string {
    const colors: Record<OrderStatus, string> = {
      PENDIENTE: 'bg-yellow-500',
      ACEPTADA: 'bg-blue-500',
      PREPARANDO: 'bg-orange-500',
      LISTA: 'bg-green-500',
      ENTREGADA: 'bg-blue-600',
      COMPLETADA: 'bg-emerald-500',
      PAGADA: 'bg-emerald-600',
      CANCELADA: 'bg-red-500',
    };
    return colors[this.currentStatus] || 'bg-gray-500';
  }

  getStatusIcon(): string {
    const icons: Record<OrderStatus, string> = {
      PENDIENTE: '⏱️',
      ACEPTADA: '✅',
      PREPARANDO: '👨‍🍳',
      LISTA: '✅',
      ENTREGADA: '🚶',
      COMPLETADA: '✅',
      PAGADA: '💳',
      CANCELADA: '❌',
    };
    return icons[this.currentStatus] || '❓';
  }

  getStatusLabel(): string {
    const labels: Record<OrderStatus, string> = {
      PENDIENTE: 'Pendiente',
      ACEPTADA: 'Aceptada',
      PREPARANDO: 'Preparando',
      LISTA: 'Lista',
      ENTREGADA: 'Entregada',
      COMPLETADA: 'Completada',
      PAGADA: 'Pagada',
      CANCELADA: 'Cancelada',
    };
    return labels[this.currentStatus] || 'Desconocido';
  }

  shouldNotify(): boolean {
    return true;
  }

  getNotificationMessage(): string {
    return `Orden actualizada a ${this.getStatusLabel()}`;
  }
}

// ========================================
// CONCRETE STRATEGIES
// ========================================

class PendienteStrategy extends BaseStatusStrategy {
  canTransitionTo(nextStatus: OrderStatus): boolean {
    return ['ACEPTADA', 'PREPARANDO', 'CANCELADA'].includes(nextStatus);
  }

  getAvailableTransitions(): OrderStatus[] {
    return ['ACEPTADA', 'PREPARANDO', 'CANCELADA'];
  }

  getNextRecommendedStatus(): OrderStatus {
    return 'PREPARANDO';
  }

  shouldNotify(): boolean {
    return true; // Notificar a cocina
  }

  getNotificationMessage(): string {
    return '🔔 Nueva orden pendiente en cocina';
  }
}

class AceptadaStrategy extends BaseStatusStrategy {
  canTransitionTo(nextStatus: OrderStatus): boolean {
    return ['PREPARANDO', 'CANCELADA'].includes(nextStatus);
  }

  getAvailableTransitions(): OrderStatus[] {
    return ['PREPARANDO', 'CANCELADA'];
  }

  getNextRecommendedStatus(): OrderStatus {
    return 'PREPARANDO';
  }

  getNotificationMessage(): string {
    return '✅ Orden aceptada por cocina';
  }
}

class PreparandoStrategy extends BaseStatusStrategy {
  canTransitionTo(nextStatus: OrderStatus): boolean {
    return ['LISTA', 'CANCELADA'].includes(nextStatus);
  }

  getAvailableTransitions(): OrderStatus[] {
    return ['LISTA', 'CANCELADA'];
  }

  getNextRecommendedStatus(): OrderStatus {
    return 'LISTA';
  }

  getNotificationMessage(): string {
    return '👨‍🍳 Orden en preparación';
  }
}

class ListaStrategy extends BaseStatusStrategy {
  canTransitionTo(nextStatus: OrderStatus): boolean {
    return ['ENTREGADA'].includes(nextStatus);
  }

  getAvailableTransitions(): OrderStatus[] {
    return ['ENTREGADA'];
  }

  getNextRecommendedStatus(): OrderStatus {
    return 'ENTREGADA';
  }

  shouldNotify(): boolean {
    return true; // Notificar a servicio
  }

  getNotificationMessage(): string {
    return '🔔 Orden lista para servir';
  }
}

class EntregadaStrategy extends BaseStatusStrategy {
  canTransitionTo(nextStatus: OrderStatus): boolean {
    return ['COMPLETADA', 'PAGADA'].includes(nextStatus);
  }

  getAvailableTransitions(): OrderStatus[] {
    return ['COMPLETADA', 'PAGADA'];
  }

  getNextRecommendedStatus(): OrderStatus {
    return 'COMPLETADA';
  }

  getNotificationMessage(): string {
    return '🚶 Orden entregada al cliente';
  }
}

class CompletadaStrategy extends BaseStatusStrategy {
  canTransitionTo(nextStatus: OrderStatus): boolean {
    return ['PAGADA'].includes(nextStatus);
  }

  getAvailableTransitions(): OrderStatus[] {
    return ['PAGADA'];
  }

  getNextRecommendedStatus(): OrderStatus | null {
    return 'PAGADA';
  }

  getNotificationMessage(): string {
    return '✅ Orden completada';
  }
}

class PagadaStrategy extends BaseStatusStrategy {
  canTransitionTo(nextStatus: OrderStatus): boolean {
    return false; // Estado final
  }

  getAvailableTransitions(): OrderStatus[] {
    return [];
  }

  getNextRecommendedStatus(): OrderStatus | null {
    return null;
  }

  shouldNotify(): boolean {
    return true;
  }

  getNotificationMessage(): string {
    return '💳 Orden pagada - Sesión cerrada';
  }
}

class CanceladaStrategy extends BaseStatusStrategy {
  canTransitionTo(nextStatus: OrderStatus): boolean {
    return false; // Estado final
  }

  getAvailableTransitions(): OrderStatus[] {
    return [];
  }

  getNextRecommendedStatus(): OrderStatus | null {
    return null;
  }

  shouldNotify(): boolean {
    return true;
  }

  getNotificationMessage(): string {
    return '❌ Orden cancelada';
  }
}

// ========================================
// FACTORY - Strategy Factory
// ========================================
export class OrderStatusStrategyFactory {
  static createStrategy(status: OrderStatus): StatusStrategy {
    switch (status) {
      case 'PENDIENTE':
        return new PendienteStrategy(status);
      case 'ACEPTADA':
        return new AceptadaStrategy(status);
      case 'PREPARANDO':
        return new PreparandoStrategy(status);
      case 'LISTA':
        return new ListaStrategy(status);
      case 'ENTREGADA':
        return new EntregadaStrategy(status);
      case 'COMPLETADA':
        return new CompletadaStrategy(status);
      case 'PAGADA':
        return new PagadaStrategy(status);
      case 'CANCELADA':
        return new CanceladaStrategy(status);
      default:
        throw new Error(`Estado desconocido: ${status}`);
    }
  }
}

// ========================================
// ORDER STATUS MANAGER - Context
// ========================================
export class OrderStatusManager {
  private strategy: StatusStrategy;

  constructor(private currentStatus: OrderStatus) {
    this.strategy = OrderStatusStrategyFactory.createStrategy(currentStatus);
  }

  /**
   * Verifica si se puede transicionar al siguiente estado
   */
  canTransitionTo(nextStatus: OrderStatus): boolean {
    return this.strategy.canTransitionTo(nextStatus);
  }

  /**
   * Obtiene todos los estados disponibles para transición
   */
  getAvailableTransitions(): OrderStatus[] {
    return this.strategy.getAvailableTransitions();
  }

  /**
   * Obtiene el próximo estado recomendado
   */
  getNextRecommendedStatus(): OrderStatus | null {
    return this.strategy.getNextRecommendedStatus();
  }

  /**
   * Valida y ejecuta una transición de estado
   */
  async transitionTo(
    nextStatus: OrderStatus,
    onTransition?: (from: OrderStatus, to: OrderStatus) => Promise<void>
  ): Promise<{ success: boolean; message: string }> {
    if (!this.canTransitionTo(nextStatus)) {
      return {
        success: false,
        message: `No se puede transicionar de ${this.currentStatus} a ${nextStatus}`,
      };
    }

    try {
      // Ejecutar callback de transición (ej: actualizar en BD)
      if (onTransition) {
        await onTransition(this.currentStatus, nextStatus);
      }

      // Actualizar estrategia
      const previousStatus = this.currentStatus;
      this.currentStatus = nextStatus;
      this.strategy = OrderStatusStrategyFactory.createStrategy(nextStatus);

      return {
        success: true,
        message: this.strategy.getNotificationMessage(),
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error en la transición',
      };
    }
  }

  /**
   * Obtiene información del estado actual
   */
  getStatusInfo() {
    return {
      status: this.currentStatus,
      color: this.strategy.getStatusColor(),
      icon: this.strategy.getStatusIcon(),
      label: this.strategy.getStatusLabel(),
      shouldNotify: this.strategy.shouldNotify(),
      notificationMessage: this.strategy.getNotificationMessage(),
      availableTransitions: this.getAvailableTransitions(),
      nextRecommended: this.getNextRecommendedStatus(),
    };
  }

  /**
   * Verifica si el estado es final (no puede transicionar)
   */
  isFinalState(): boolean {
    return this.getAvailableTransitions().length === 0;
  }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Valida una transición de estado sin crear un manager
 */
export function validateStatusTransition(
  from: OrderStatus,
  to: OrderStatus
): boolean {
  const manager = new OrderStatusManager(from);
  return manager.canTransitionTo(to);
}

/**
 * Obtiene la cadena completa de estados posibles
 */
export function getStatusWorkflow(): OrderStatus[] {
  return [
    'PENDIENTE',
    'ACEPTADA',
    'PREPARANDO',
    'LISTA',
    'ENTREGADA',
    'COMPLETADA',
    'PAGADA',
  ];
}

/**
 * Obtiene el progreso (%) de una orden según su estado
 */
export function getOrderProgress(status: OrderStatus): number {
  const progressMap: Record<OrderStatus, number> = {
    PENDIENTE: 0,
    ACEPTADA: 15,
    PREPARANDO: 40,
    LISTA: 70,
    ENTREGADA: 85,
    COMPLETADA: 95,
    PAGADA: 100,
    CANCELADA: 0,
  };
  return progressMap[status] || 0;
}
