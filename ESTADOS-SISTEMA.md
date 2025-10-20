# 📊 Sistema de Estados - Co.Mos Restaurant

## 🏗️ Arquitectura del Sistema

### 1. **Estados de Mesa** 🪑

Una mesa puede estar en dos estados:

```typescript
Table {
  available: boolean  // true = Libre | false = Ocupada
}
```

**Flujo:**
- `available: true` → Mesa libre, sin clientes
- `available: false` → Mesa ocupada, tiene sesión activa

---

### 2. **Estados de Sesión** 🎯

Una sesión representa el tiempo que los clientes están en una mesa:

```typescript
TableSession {
  active: boolean     // true = Activa | false = Cerrada
  sessionCode: string // Código único (ej: "ABC123")
  customerName: string
  tableId: string
}
```

**Flujo:**
```
┌─────────────────────────────────────────────────────┐
│ Cliente escanea QR → Se crea TableSession (active: true) │
│ Mesa pasa a available: false                         │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ Clientes pueden hacer múltiples pedidos             │
│ Cada pedido se vincula a sessionId                  │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ Cliente paga y se va → active: false                │
│ Todas las órdenes pasan a COMPLETADA               │
│ Mesa vuelve a available: true                       │
└─────────────────────────────────────────────────────┘
```

---

### 3. **Estados de Orden** 📋

Una orden pasa por múltiples estados durante su ciclo de vida:

```typescript
enum OrderStatus {
  PENDIENTE   // 🟡 Recién creada, esperando confirmación
  ACEPTADA    // 🔵 Vista/aceptada por cocina (opcional)
  PREPARANDO  // 🟠 En proceso de preparación
  LISTA       // 🟢 Terminada, lista para servir
  ENTREGADA   // ✅ Servida al cliente en la mesa
  COMPLETADA  // 🏁 Cliente satisfecho, sesión cerrada
  PAGADA      // 💰 Pago procesado
  CANCELADA   // ❌ Orden cancelada
}
```

**Flujo Completo:**

```
┌─────────────┐
│  PENDIENTE  │ ← Cliente crea orden desde /menu
└──────┬──────┘   🔔 Notificación a cocina (sonido + alerta visual)
       │           ⏱️ Si >10 min → Badge "URGENTE"
       ↓
┌─────────────┐
│ PREPARANDO  │ ← Cocinero acepta y empieza a preparar
└──────┬──────┘   👨‍🍳 Vista en /cocina
       │           📝 Observaciones destacadas
       ↓
┌─────────────┐
│    LISTA    │ ← Plato terminado, listo para servir
└──────┬──────┘   ✅ Notificación a meseros
       │           📍 Vista en /servicio
       ↓
┌─────────────┐
│ ENTREGADA   │ ← Mesero sirve el plato en la mesa
└──────┬──────┘   🚶 Confirmado por mesero
       │
       ↓
┌─────────────┐
│ COMPLETADA  │ ← Sesión cerrada, todo OK
└──────┬──────┘   🏁 Cliente pagó y se fue
       │
       ↓
┌─────────────┐
│   PAGADA    │ ← Pago procesado (futuro: integración de pagos)
└─────────────┘   💰 Registro contable
```

---

## 🎭 Roles y Permisos

### **CLIENTE** (No autenticado)
- ✅ Escanear QR y crear sesión
- ✅ Ver menú
- ✅ Hacer pedidos (múltiples por sesión)
- ✅ Ver carrito
- ❌ No puede ver cocina/servicio

### **COCINERO** 👨‍🍳
- ✅ Ver órdenes PENDIENTE y PREPARANDO
- ✅ Cambiar PENDIENTE → PREPARANDO
- ✅ Cambiar PREPARANDO → LISTA
- ✅ Ver observaciones de cada producto
- ✅ Alertas de nuevas órdenes
- ❌ No puede ver dashboard admin

### **MESERO** 🧑‍💼
- ✅ Ver órdenes LISTA
- ✅ Cambiar LISTA → ENTREGADA
- ✅ Ver todas las mesas activas
- ✅ Ver estado de cada orden por mesa
- ✅ Cerrar sesiones (liberar mesas)
- ❌ No puede ver dashboard admin

### **ADMIN** 👑
- ✅ Acceso completo a todo el sistema
- ✅ Gestión de mesas (CRUD, QR codes)
- ✅ Gestión de productos y categorías
- ✅ Ver estadísticas
- ✅ Gestión de usuarios
- ✅ Cerrar sesiones y manejar pagos

---

## 🔄 Casos de Uso Reales

### **Escenario 1: Pedido Simple**
```
1. Cliente escanea QR Mesa 5
   → Crea TableSession (sessionCode: "XYZ789")
   → Mesa 5: available = false

2. Cliente agrega 2 Hamburguesas al carrito
   → Hace pedido
   → Orden ORD-001: PENDIENTE
   → 🔔 Alerta en /cocina

3. Cocinero ve orden en pantalla
   → Clic "Empezar a preparar"
   → Orden ORD-001: PREPARANDO

4. 10 minutos después
   → Clic "Marcar como lista"
   → Orden ORD-001: LISTA
   → Aparece en /servicio

5. Mesero ve la orden
   → Clic "Marcar como entregada"
   → Orden ORD-001: ENTREGADA

6. Cliente come y paga
   → Mesero cierra sesión desde /servicio
   → Todas las órdenes: COMPLETADA
   → Mesa 5: available = true
```

### **Escenario 2: Múltiples Pedidos en la Misma Mesa**
```
1. Mesa 3 tiene sesión activa (sessionCode: "ABC123")

2. Cliente hace primer pedido (Entradas)
   → Orden ORD-010: PENDIENTE → PREPARANDO → LISTA → ENTREGADA

3. Cliente hace segundo pedido (Plato fuerte)
   → Orden ORD-011: PENDIENTE → PREPARANDO → LISTA → ENTREGADA

4. Cliente hace tercer pedido (Postre)
   → Orden ORD-012: PENDIENTE → PREPARANDO → LISTA → ENTREGADA

5. Cliente termina y pide la cuenta
   → Mesero cierra sesión
   → ORD-010, ORD-011, ORD-012: COMPLETADA
   → Mesa 3: available = true
```

### **Escenario 3: Orden Urgente**
```
1. Orden ORD-020 creada a las 12:00
   → Estado: PENDIENTE

2. A las 12:11 (11 minutos después)
   → 🚨 Badge "URGENTE" aparece
   → Card de la orden hace animate-pulse
   → Fondo rojo intenso

3. Cocinero nota la urgencia
   → Da prioridad a esa orden
   → PENDIENTE → PREPARANDO → LISTA (rápido)
```

---

## 🎨 Código de Colores en UI

- 🟡 **PENDIENTE**: Amarillo - `bg-yellow-500/10 border-yellow-500/40`
- 🔴 **URGENTE**: Rojo - `bg-red-500/20 border-red-500/50` + animate-pulse
- 🟠 **PREPARANDO**: Naranja - `bg-orange-500/10 border-orange-500/40`
- 🟢 **LISTA**: Verde - `bg-green-500/10 border-green-500/30`
- 🔵 **ENTREGADA**: Azul - `bg-blue-500/10 border-blue-500/30`

---

## 📱 Experiencia Mobile-First

### **Cocina (/cocina)**
- Cards grandes y legibles
- Cantidades en badges redondos destacados
- Observaciones en bloques con borde izquierdo naranja
- Botones grandes para tocar fácil
- Stats en header sticky
- Scroll suave
- Alertas visuales en top center

### **Servicio (/servicio)**
- Dos vistas: Órdenes | Mesas
- Cards compactas pero informativas
- Estado de cada orden por mesa
- Botones de acción claros
- Polling cada 3 segundos

---

## 🔮 Próximas Mejoras

1. **Socket.io** - Reemplazar polling con WebSockets
2. **Notificaciones Push** - Alertas nativas en dispositivos
3. **Historial de Órdenes** - Ver órdenes completadas
4. **Reportes** - Ventas por día/semana/mes
5. **Integración de Pagos** - QR para pagar desde la mesa
6. **Propinas** - Sistema de propinas opcional
7. **Split Bill** - Dividir cuenta entre clientes

---

## 🛠️ APIs Importantes

```typescript
// Crear orden
POST /api/orders
Body: { sessionCode, items, customerName, type }

// Actualizar estado de orden
PATCH /api/orders/[id]
Body: { status: "PREPARANDO" | "LISTA" | "ENTREGADA" | ... }

// Cerrar sesión (libera mesa)
PATCH /api/sessions/[id]
Body: { active: false }

// Obtener órdenes
GET /api/orders?status=PENDIENTE&sessionCode=ABC123

// Obtener mesas con sesiones
GET /api/tables
```

---

## 📝 Notas Técnicas

- **Polling Interval**: 3 segundos en cocina/servicio
- **Urgencia**: Órdenes >10 minutos en PENDIENTE
- **Notificación Sonora**: Web Audio API (800Hz, 0.5s)
- **Animaciones**: CSS `animate-pulse`, `animate-fadeIn`
- **Persistencia**: localStorage para sessionCode y tableNumber
- **Database**: MySQL con Prisma ORM
- **Multi-tenant**: Filtrado por restaurantId en todas las queries

---

Actualizado: 2025-10-20
