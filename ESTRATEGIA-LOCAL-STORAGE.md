# Estrategia de Gestión de Local Storage

## Problema
Los clientes escanean un código QR que guarda la información de la mesa en el `localStorage`. Sin embargo, cuando un cliente regresa más tarde o escanea un QR diferente, la información anterior persiste, lo que puede causar:
- Clientes en la mesa incorrecta
- Sesiones obsoletas
- Carritos con productos de sesiones anteriores

## Solución Implementada

### 1. **Expiración Automática por Tiempo**
- **Duración**: 4 horas por defecto
- **Funcionamiento**: Cuando se escanea un QR, se guarda un timestamp (`scannedAt`)
- **Verificación**: Cada vez que se accede al contexto, se verifica si ha expirado
- **Limpieza**: Si el contexto expiró, se limpia automáticamente

### 2. **Detección de Cambio de Mesa**
- Cuando se escanea un nuevo QR, el sistema detecta si es una mesa diferente
- Si la sesión o mesa es diferente, limpia el contexto anterior automáticamente
- Esto incluye el carrito de compras

### 3. **Verificación Periódica**
- Se ejecuta una verificación cada 5 minutos en el layout principal
- Si la sesión expiró, redirige automáticamente al inicio
- Previene que usuarios naveguen con sesiones expiradas

### 4. **Advertencia de Expiración Próxima**
- Componente opcional `SessionExpirationWarning`
- Se muestra cuando quedan menos de 30 minutos
- Permite al usuario saber que debe escanear nuevamente el QR

## Configuración

### Cambiar el Tiempo de Expiración

Edita el archivo `src/lib/restaurant-context.ts`:

```typescript
// Configuración de expiración (4 horas por defecto)
const CONTEXT_EXPIRATION_MS = 4 * 60 * 60 * 1000; // 4 horas
```

**Ejemplos de configuración:**
```typescript
// 2 horas
const CONTEXT_EXPIRATION_MS = 2 * 60 * 60 * 1000;

// 6 horas
const CONTEXT_EXPIRATION_MS = 6 * 60 * 60 * 1000;

// 30 minutos (para pruebas rápidas)
const CONTEXT_EXPIRATION_MS = 30 * 60 * 1000;
```

### Usar el Componente de Advertencia

Para mostrar una advertencia cuando la sesión está por expirar, añade el componente en cualquier página:

```tsx
import SessionExpirationWarning from "@/components/SessionExpirationWarning";

export default function MenuPage() {
  return (
    <>
      {/* Tu contenido */}
      <SessionExpirationWarning />
    </>
  );
}
```

## Datos Limpiados Automáticamente

Cuando el contexto se limpia, se eliminan los siguientes items del localStorage:
- `restaurantId`
- `restaurantName`
- `restaurantSlug`
- `sessionCode`
- `tableNumber`
- `scannedAt`
- `cart` (carrito de compras)
- `tableId`

## Funciones Disponibles

### `getRestaurantContext()`
Obtiene el contexto actual y verifica automáticamente si ha expirado.

```typescript
const context = getRestaurantContext();
if (context) {
  console.log(`Mesa: ${context.tableNumber}`);
}
```

### `setRestaurantContext(context)`
Guarda un nuevo contexto. Si detecta cambio de mesa, limpia el anterior.

```typescript
setRestaurantContext({
  restaurantId: "123",
  restaurantName: "Mi Restaurante",
  restaurantSlug: "mi-restaurante",
  sessionCode: "ABC123",
  tableNumber: 5
});
```

### `clearRestaurantContext()`
Limpia manualmente todo el contexto.

```typescript
clearRestaurantContext();
```

### `getContextTimeRemaining()`
Obtiene los milisegundos restantes antes de la expiración.

```typescript
const remaining = getContextTimeRemaining();
if (remaining) {
  const minutes = Math.floor(remaining / (60 * 1000));
  console.log(`Tiempo restante: ${minutes} minutos`);
}
```

### `isContextNearExpiration()`
Verifica si quedan menos de 30 minutos.

```typescript
if (isContextNearExpiration()) {
  console.log("¡La sesión está por expirar!");
}
```

## Flujo de Usuario

### Escenario 1: Primera Visita
1. Cliente escanea QR de la Mesa 5
2. Sistema guarda contexto con timestamp
3. Cliente navega y hace pedidos normalmente
4. Después de 4 horas, el contexto expira automáticamente

### Escenario 2: Cambio de Mesa
1. Cliente escanea QR de la Mesa 5
2. Cliente navega y añade items al carrito
3. Cliente escanea QR de la Mesa 8 (mesa diferente)
4. Sistema detecta el cambio y limpia el contexto anterior
5. Se crea nueva sesión para Mesa 8

### Escenario 3: Cliente Regresa Después de Días
1. Cliente había escaneado QR hace 3 días
2. Cliente abre la app desde su navegador
3. Sistema detecta que el contexto expiró
4. Limpia automáticamente y redirige al inicio
5. Cliente debe escanear nuevo QR

## Consideraciones

### ¿Por Qué 4 Horas?
- Tiempo suficiente para una experiencia de comida completa
- Previene sesiones obsoletas de días anteriores
- Balance entre comodidad y seguridad

### ¿Qué Pasa con el Carrito?
- El carrito se limpia junto con el contexto
- Esto previene que clientes vean items de sesiones antiguas
- Si un cliente cambia de mesa, el carrito se reinicia

### Pruebas
Para probar la expiración rápidamente, cambia temporalmente:

```typescript
// SOLO PARA PRUEBAS - 2 minutos
const CONTEXT_EXPIRATION_MS = 2 * 60 * 1000;
```

Luego:
1. Escanea un QR
2. Espera 2 minutos
3. Navega o recarga
4. Deberías ver que el contexto se limpió automáticamente

## Monitoreo

Todos los eventos importantes se registran en la consola:
- "Contexto guardado - Mesa: X, Sesión: Y"
- "Detectado cambio de mesa, limpiando contexto anterior..."
- "Contexto del restaurante expirado, limpiando..."
- "Sesión expirada, redirigiendo al inicio..."

Puedes ver estos logs en las DevTools del navegador (F12).

## Mejoras Futuras Posibles

1. **Sincronización con Backend**: Validar sesión activa contra el servidor
2. **Renovación Automática**: Extender automáticamente si hay actividad
3. **Persistencia Selectiva**: Guardar preferencias del usuario más allá de la sesión
4. **Notificaciones Push**: Alertar al usuario antes de expirar (si tiene permisos)
