# 🎯 Implementación Completa de Gestión de Mesas

## ✅ Características Implementadas

### 1. **Botón de Cambio de Mesa** 🔄
- **Ubicación**: Al lado del carrito de compras en el header del menú
- **Funcionalidad**: Permite escanear un nuevo código QR sin salir de la página
- **Diseño**: Botón circular con ícono de QR Code

### 2. **Expiración Automática del Contexto** ⏰
- **Duración por defecto**: 4 horas
- **Verificación automática**: El contexto se verifica en cada acceso
- **Limpieza automática**: Si el contexto expiró, se limpia automáticamente
- **Monitoreo periódico**: Cada 5 minutos verifica si la sesión sigue válida

### 3. **Detección de Cambio de Mesa** 🏠
- **Automática**: Detecta cuando se escanea un QR de una mesa diferente
- **Limpieza inteligente**: Limpia el contexto anterior, incluyendo el carrito
- **Sin pérdida de datos**: Preserva la nueva información correctamente

### 4. **Diálogo de Confirmación Elegante** 💬
- **Activación**: Se muestra cuando hay items en el carrito y se intenta cambiar de mesa
- **Diseño moderno**: Modal con animaciones suaves
- **Opciones claras**: "Cancelar" o "Sí, cambiar mesa"
- **Protección**: Evita pérdida accidental de items del carrito

### 5. **Advertencia de Expiración Próxima** 🔔
- **Tiempo**: Se muestra cuando quedan menos de 30 minutos
- **Ubicación**: Banner en la parte inferior de la pantalla
- **Información**: Muestra el tiempo restante aproximado
- **Dismissible**: El usuario puede cerrar la advertencia

## 📁 Archivos Modificados/Creados

### Nuevos Archivos:
1. **`src/components/SessionExpirationWarning.tsx`**
   - Componente para advertir sobre expiración próxima
   - Muestra tiempo restante
   - Puede incluir botón de extensión (opcional)

2. **`src/components/ConfirmDialog.tsx`**
   - Componente reutilizable para diálogos de confirmación
   - Diseño moderno y elegante
   - Animaciones integradas

3. **`ESTRATEGIA-LOCAL-STORAGE.md`**
   - Documentación completa de la estrategia
   - Guía de configuración
   - Ejemplos de uso

### Archivos Modificados:
1. **`src/lib/restaurant-context.ts`**
   - Añadido timestamp `scannedAt`
   - Verificación automática de expiración
   - Detección de cambio de mesa
   - Nuevas funciones utilitarias
   - Función de inicialización de monitoreo

2. **`src/app/(co-mos)/layout.tsx`**
   - Inicialización del chequeo de expiración
   - Redirección automática al expirar

3. **`src/app/(co-mos)/menu/page.tsx`**
   - Botón de QR Code junto al carrito
   - Integración con diálogo de confirmación
   - Advertencia de expiración de sesión
   - Lógica mejorada de cambio de mesa

## 🎨 Interfaz de Usuario

### Header del Menú:
```
┌─────────────────────────────────────────┐
│  🔷 co.mos        [QR] [🛒 1]           │
│     Mesa 4                               │
└─────────────────────────────────────────┘
```

### Diálogo de Confirmación:
```
┌──────────────────────────────────┐
│ ⚠️  Cambiar de mesa        ✕    │
├──────────────────────────────────┤
│ Tienes productos en tu carrito.  │
│ Al cambiar de mesa, tu carrito   │
│ será vaciado. ¿Deseas continuar? │
├──────────────────────────────────┤
│  [  Cancelar  ] [Sí, cambiar mesa]│
└──────────────────────────────────┘
```

### Advertencia de Expiración:
```
┌──────────────────────────────────────┐
│ ⏰ Sesión por expirar           ✕    │
│ Tu sesión expirará en aprox 25 min.  │
│ Escanea el QR nuevamente.            │
└──────────────────────────────────────┘
```

## 🔧 Configuración

### Cambiar el Tiempo de Expiración:

Edita `src/lib/restaurant-context.ts`, línea 17:

```typescript
// Para 2 horas
const CONTEXT_EXPIRATION_MS = 2 * 60 * 60 * 1000;

// Para 6 horas
const CONTEXT_EXPIRATION_MS = 6 * 60 * 60 * 1000;

// Para pruebas (2 minutos)
const CONTEXT_EXPIRATION_MS = 2 * 60 * 1000;
```

## 🧪 Pruebas Recomendadas

### Escenario 1: Cambio de Mesa sin Carrito
1. ✅ Escanea QR de Mesa 5
2. ✅ Haz clic en botón de QR en el header
3. ✅ Escanea QR de Mesa 8
4. ✅ Verifica que cambió a Mesa 8 sin advertencias

### Escenario 2: Cambio de Mesa con Carrito
1. ✅ Escanea QR de Mesa 5
2. ✅ Añade productos al carrito
3. ✅ Haz clic en botón de QR en el header
4. ✅ Escanea QR de Mesa 8
5. ✅ Debe aparecer diálogo de confirmación
6. ✅ Si confirmas, el carrito se vacía y cambias a Mesa 8
7. ✅ Si cancelas, permaneces en Mesa 5 con el carrito intacto

### Escenario 3: Expiración Automática
1. ✅ Escanea un QR (o cambia temporalmente a 2 minutos)
2. ✅ Espera el tiempo de expiración
3. ✅ Intenta navegar o recarga
4. ✅ Debe limpiar el contexto y redirigir al inicio

### Escenario 4: Advertencia de Expiración
1. ✅ Ajusta el tiempo a 1 hora temporalmente
2. ✅ Escanea un QR
3. ✅ Espera 31 minutos
4. ✅ Debe aparecer la advertencia en pantalla

## 📊 Monitoreo y Logs

Todos los eventos importantes se registran en la consola:

```javascript
// Al guardar contexto
"Contexto guardado - Mesa: 5, Sesión: ABC123"

// Al detectar cambio de mesa
"Detectado cambio de mesa, limpiando contexto anterior..."

// Al expirar por tiempo
"Contexto del restaurante expirado, limpiando..."

// Al redirigir por expiración
"Sesión expirada, redirigiendo al inicio..."
```

## 🎯 Flujo Completo

```
Usuario escanea QR
       ↓
Guarda contexto con timestamp
       ↓
Usuario navega y hace pedidos
       ↓
[Opción A] Usuario escanea nuevo QR
       ↓
   ¿Tiene items en carrito?
       ├─ SÍ → Muestra diálogo
       └─ NO → Cambia directamente
       ↓
Limpia contexto anterior
       ↓
Guarda nuevo contexto
       
[Opción B] Pasa el tiempo (4 horas)
       ↓
Sistema detecta expiración
       ↓
Limpia contexto automáticamente
       ↓
Redirige al inicio
```

## 🚀 Mejoras Futuras Sugeridas

1. **Sincronización con Backend**: Validar sesión activa contra el servidor
2. **Renovación Automática**: Extender automáticamente si hay actividad reciente
3. **Persistencia Selectiva**: Guardar preferencias del usuario más allá de la sesión
4. **Notificaciones Push**: Alertar al usuario antes de expirar (requiere permisos)
5. **Modo Offline**: Manejar cuando no hay conexión a internet

## 💡 Notas Importantes

- ✅ **El carrito se vacía automáticamente** al cambiar de mesa o cuando la sesión expira
- ✅ **La verificación es automática** - no requiere acción del usuario
- ✅ **El botón de QR está siempre visible** en el header del menú
- ✅ **La experiencia es fluida** - las animaciones hacen que los cambios sean suaves
- ✅ **Es seguro** - previene situaciones donde un cliente vea items de otra mesa

## 🎨 Personalización del Diseño

Todos los componentes usan Tailwind CSS y son fáciles de personalizar:

- **Colores**: Busca `bg-orange-500` y cámbialo por tu color preferido
- **Animaciones**: Definidas en `src/app/globals.css`
- **Tiempos de transición**: Ajusta los valores en `transition` y `duration`

---

**Implementado por**: GitHub Copilot
**Fecha**: 21 de Octubre, 2025
**Estado**: ✅ Completo y funcional
