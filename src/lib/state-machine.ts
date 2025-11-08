// Máquina de estados para las órdenes
// Define las transiciones válidas entre estados

export type OrderStatus =
  | 'PENDIENTE'
  | 'ACEPTADA'
  | 'PREPARANDO'
  | 'LISTA'
  | 'ENTREGADA'
  | 'COMPLETADA'
  | 'PAGADA'
  | 'CANCELADA';

// Definir transiciones válidas
const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDIENTE: ['ACEPTADA', 'CANCELADA'],
  ACEPTADA: ['PREPARANDO', 'CANCELADA'],
  PREPARANDO: ['LISTA', 'CANCELADA'],
  LISTA: ['ENTREGADA', 'CANCELADA'],
  ENTREGADA: ['COMPLETADA'],
  COMPLETADA: ['PAGADA'],
  PAGADA: [], // Estado final
  CANCELADA: [], // Estado final
};

// Validar si una transición es válida
export function isValidTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): boolean {
  const allowedTransitions = ORDER_TRANSITIONS[currentStatus];
  return allowedTransitions.includes(newStatus);
}

// Obtener transiciones permitidas desde un estado
export function getAllowedTransitions(currentStatus: OrderStatus): OrderStatus[] {
  return ORDER_TRANSITIONS[currentStatus] || [];
}

// Validar y retornar error descriptivo si la transición no es válida
export function validateTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): { valid: boolean; error?: string } {
  if (currentStatus === newStatus) {
    return { valid: false, error: 'La orden ya está en ese estado' };
  }
  
  const allowedTransitions = ORDER_TRANSITIONS[currentStatus];
  
  if (!allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      error: `No se puede cambiar de "${currentStatus}" a "${newStatus}". Estados permitidos: ${allowedTransitions.join(', ')}`,
    };
  }
  
  return { valid: true };
}

// Verificar si un estado es final (no permite más transiciones)
export function isFinalState(status: OrderStatus): boolean {
  return ORDER_TRANSITIONS[status].length === 0;
}

// Obtener el flujo completo recomendado
export function getOrderFlow(): OrderStatus[] {
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

// Calcular progreso de la orden (0-100%)
export function calculateOrderProgress(status: OrderStatus): number {
  const flow = getOrderFlow();
  const index = flow.indexOf(status);
  
  if (index === -1) {
    // CANCELADA
    return 0;
  }
  
  return Math.round((index / (flow.length - 1)) * 100);
}
