/**
 * Restaurant Context Management
 * 
 * Este módulo maneja el contexto del restaurante en el cliente.
 * Se utiliza para asegurar que los clientes solo vean productos y órdenes
 * del restaurante correcto después de escanear un QR.
 */

export interface RestaurantContext {
  restaurantId: string;
  restaurantName: string;
  restaurantSlug: string;
  sessionCode: string;
  tableNumber: number;
  scannedAt?: number; // Timestamp de cuándo se escaneó el QR
}

// Configuración de expiración (4 horas por defecto)
const CONTEXT_EXPIRATION_MS = 4 * 60 * 60 * 1000; // 4 horas

/**
 * Obtiene el contexto del restaurante desde localStorage
 * Verifica automáticamente si ha expirado y lo limpia si es necesario
 */
export function getRestaurantContext(): RestaurantContext | null {
  if (typeof window === 'undefined') return null;

  try {
    const restaurantId = localStorage.getItem('restaurantId');
    const restaurantName = localStorage.getItem('restaurantName');
    const restaurantSlug = localStorage.getItem('restaurantSlug');
    const sessionCode = localStorage.getItem('sessionCode');
    const tableNumber = localStorage.getItem('tableNumber');
    const scannedAt = localStorage.getItem('scannedAt');

    if (!restaurantId || !sessionCode) {
      return null;
    }

    // Verificar si el contexto ha expirado
    if (scannedAt) {
      const scanTimestamp = parseInt(scannedAt);
      const now = Date.now();
      const elapsed = now - scanTimestamp;

      if (elapsed > CONTEXT_EXPIRATION_MS) {
        console.log('Contexto del restaurante expirado, limpiando...');
        clearRestaurantContext();
        return null;
      }
    }

    return {
      restaurantId,
      restaurantName: restaurantName || '',
      restaurantSlug: restaurantSlug || '',
      sessionCode,
      tableNumber: tableNumber ? parseInt(tableNumber) : 0,
      scannedAt: scannedAt ? parseInt(scannedAt) : undefined,
    };
  } catch (error) {
    console.error('Error al obtener contexto del restaurante:', error);
    return null;
  }
}

/**
 * Guarda el contexto del restaurante en localStorage
 * Si hay un contexto previo diferente, lo limpia primero
 */
export function setRestaurantContext(context: RestaurantContext): void {
  if (typeof window === 'undefined') return;

  try {
    // Obtener contexto anterior si existe
    const previousContext = getRestaurantContext();
    
    // Si hay un contexto previo y es de una mesa diferente, limpiarlo primero
    if (previousContext && 
        (previousContext.sessionCode !== context.sessionCode || 
         previousContext.tableNumber !== context.tableNumber)) {
      console.log('Detectado cambio de mesa, limpiando contexto anterior...');
      clearRestaurantContext();
    }

    // Guardar nuevo contexto con timestamp
    const scannedAt = context.scannedAt || Date.now();
    localStorage.setItem('restaurantId', context.restaurantId);
    localStorage.setItem('restaurantName', context.restaurantName);
    localStorage.setItem('restaurantSlug', context.restaurantSlug);
    localStorage.setItem('sessionCode', context.sessionCode);
    localStorage.setItem('tableNumber', context.tableNumber.toString());
    localStorage.setItem('scannedAt', scannedAt.toString());
    
    console.log(`Contexto guardado - Mesa: ${context.tableNumber}, Sesión: ${context.sessionCode}`);
  } catch (error) {
    console.error('Error al guardar contexto del restaurante:', error);
  }
}

/**
 * Limpia el contexto del restaurante de localStorage
 */
export function clearRestaurantContext(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem('restaurantId');
    localStorage.removeItem('restaurantName');
    localStorage.removeItem('restaurantSlug');
    localStorage.removeItem('sessionCode');
    localStorage.removeItem('tableNumber');
    localStorage.removeItem('scannedAt');
    localStorage.removeItem('cart'); // También limpia el carrito
    localStorage.removeItem('tableId'); // Limpia tableId si existe
    console.log('Contexto del restaurante limpiado');
  } catch (error) {
    console.error('Error al limpiar contexto del restaurante:', error);
  }
}

/**
 * Obtiene el tiempo restante antes de que expire el contexto (en ms)
 */
export function getContextTimeRemaining(): number | null {
  if (typeof window === 'undefined') return null;

  try {
    const scannedAt = localStorage.getItem('scannedAt');
    if (!scannedAt) return null;

    const scanTimestamp = parseInt(scannedAt);
    const now = Date.now();
    const elapsed = now - scanTimestamp;
    const remaining = CONTEXT_EXPIRATION_MS - elapsed;

    return remaining > 0 ? remaining : 0;
  } catch (error) {
    return null;
  }
}

/**
 * Verifica si el contexto está próximo a expirar (menos de 30 minutos)
 */
export function isContextNearExpiration(): boolean {
  const remaining = getContextTimeRemaining();
  if (remaining === null) return false;
  
  const thirtyMinutes = 30 * 60 * 1000;
  return remaining < thirtyMinutes;
}

/**
 * Verifica si el usuario tiene un contexto de restaurante válido
 */
export function hasValidRestaurantContext(): boolean {
  const context = getRestaurantContext();
  return context !== null && !!context.restaurantId && !!context.sessionCode;
}

/**
 * Hook de React para usar el contexto del restaurante
 */
export function useRestaurantContext() {
  if (typeof window === 'undefined') {
    return {
      context: null,
      hasContext: false,
      setContext: () => {},
      clearContext: () => {},
      timeRemaining: null,
      isNearExpiration: false,
    };
  }

  return {
    context: getRestaurantContext(),
    hasContext: hasValidRestaurantContext(),
    setContext: setRestaurantContext,
    clearContext: clearRestaurantContext,
    timeRemaining: getContextTimeRemaining(),
    isNearExpiration: isContextNearExpiration(),
  };
}

/**
 * Inicializa un listener para verificar periódicamente la expiración del contexto
 * Debe llamarse en el componente raíz o layout principal
 */
export function initContextExpirationCheck(onExpired?: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  // Verificar cada 5 minutos
  const interval = setInterval(() => {
    const context = getRestaurantContext();
    
    // Si getRestaurantContext retorna null, ya se limpió automáticamente
    if (context === null && hasValidRestaurantContext()) {
      console.log('Sesión expirada');
      if (onExpired) {
        onExpired();
      }
    }
  }, 5 * 60 * 1000); // Cada 5 minutos

  // Retornar función de limpieza
  return () => clearInterval(interval);
}
