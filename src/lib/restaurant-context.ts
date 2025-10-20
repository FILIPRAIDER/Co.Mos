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
}

/**
 * Obtiene el contexto del restaurante desde localStorage
 */
export function getRestaurantContext(): RestaurantContext | null {
  if (typeof window === 'undefined') return null;

  try {
    const restaurantId = localStorage.getItem('restaurantId');
    const restaurantName = localStorage.getItem('restaurantName');
    const restaurantSlug = localStorage.getItem('restaurantSlug');
    const sessionCode = localStorage.getItem('sessionCode');
    const tableNumber = localStorage.getItem('tableNumber');

    if (!restaurantId || !sessionCode) {
      return null;
    }

    return {
      restaurantId,
      restaurantName: restaurantName || '',
      restaurantSlug: restaurantSlug || '',
      sessionCode,
      tableNumber: tableNumber ? parseInt(tableNumber) : 0,
    };
  } catch (error) {
    console.error('Error al obtener contexto del restaurante:', error);
    return null;
  }
}

/**
 * Guarda el contexto del restaurante en localStorage
 */
export function setRestaurantContext(context: RestaurantContext): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('restaurantId', context.restaurantId);
    localStorage.setItem('restaurantName', context.restaurantName);
    localStorage.setItem('restaurantSlug', context.restaurantSlug);
    localStorage.setItem('sessionCode', context.sessionCode);
    localStorage.setItem('tableNumber', context.tableNumber.toString());
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
    localStorage.removeItem('cart'); // También limpia el carrito
  } catch (error) {
    console.error('Error al limpiar contexto del restaurante:', error);
  }
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
    };
  }

  return {
    context: getRestaurantContext(),
    hasContext: hasValidRestaurantContext(),
    setContext: setRestaurantContext,
    clearContext: clearRestaurantContext,
  };
}
