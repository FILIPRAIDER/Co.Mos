# 🎯 ESTRATEGIA COMPLETA - CO.MOS RESTAURANT APP

## 📊 ANÁLISIS DE SITUACIÓN ACTUAL

### ✅ Lo que YA funciona:
- Next.js 15 + Prisma + MySQL configurado
- Autenticación con NextAuth
- Modelos base: User, Category, Product, Table, Order, OrderItem, Review
- Flow básico de cliente (menú → carrito → orden)
- Dashboard admin con gestión básica
- Sistema de reviews

### ❌ Problemas Identificados:

1. **Error 500 en `/api/tables`** - Probablemente problema de conexión a BD o prisma client
2. **Warning de Image** - Aspecto ratio (CORREGIDO ✅)
3. **Sin modelo Restaurant** - Multi-tenant no implementado
4. **Sin roles al registro** - Todos se crean como CLIENT
5. **Sin sistema de QR** - No hay código QR para mesas
6. **Sin WebSockets** - No hay actualización en tiempo real
7. **Sin gestión de inventario** - No implementado
8. **Sin pantalla de cocina** - No hay vista para workers
9. **Sin sistema de propinas** - Implementado parcialmente
10. **Sin facturación completa** - Falta desglose detallado
11. **Sin multi-orden en misma mesa** - Un cliente no puede hacer varias órdenes

---

## 🏗️ ARQUITECTURA PROPUESTA

### 1. MODELO DE NEGOCIO

```
RESTAURANTE (Multi-tenant)
└── Tiene muchos ADMIN/WORKERS
└── Tiene muchas MESAS (con QR único)
└── Tiene muchos PRODUCTOS/CATEGORÍAS
└── Tiene muchas ÓRDENES

FLUJO CLIENTE (Sin registro):
1. Escanea QR de mesa → Se asigna mesa automáticamente
2. Ve menú y agrega productos
3. Confirma orden (nombre opcional)
4. Puede seguir pidiendo (nueva orden en misma sesión)
5. Trabajador marca estados en tiempo real (WebSocket)
6. Al finalizar, pide factura y puede dejar propina
7. Deja review opcional

FLUJO ADMIN/WORKER:
- Login con documento + password
- ADMIN: Gestiona todo (productos, mesas, workers, inventario)
- WORKER cocina: Ve órdenes pendientes, marca "READY"
- WORKER mesero: Ve órdenes "READY", marca "DELIVERED"
```

---

## 📐 NUEVO SCHEMA DE BASE DE DATOS

### Cambios Necesarios:

```prisma
// NUEVO: Multi-tenant
model Restaurant {
  id              String    @id @default(cuid())
  name            String
  slug            String    @unique  // para subdomain o URL
  address         String?
  phone           String?
  email           String?
  logoUrl         String?
  
  users           User[]
  categories      Category[]
  products        Product[]
  tables          Table[]
  orders          Order[]
  inventory       InventoryItem[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

// ACTUALIZADO: User con restaurantId
model User {
  id              String      @id @default(cuid())
  name            String
  email           String?     @unique
  document        String      @unique
  passwordHash    String
  role            Role        @default(CLIENT)
  
  restaurantId    String?     // NULL para clientes
  restaurant      Restaurant? @relation(fields: [restaurantId], references: [id])
  
  orders          Order[]
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}

// ACTUALIZADO: Table con QR
model Table {
  id              String      @id @default(cuid())
  number          Int
  capacity        Int         @default(4)
  available       Boolean     @default(true)
  qrCode          String      @unique  // Código único para QR
  qrImageUrl      String?     // URL de imagen QR generada
  
  restaurantId    String
  restaurant      Restaurant  @relation(fields: [restaurantId], references: [id])
  
  sessions        TableSession[]
  orders          Order[]
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  @@unique([restaurantId, number])
}

// NUEVO: Sesiones de mesa para multi-orden
model TableSession {
  id              String      @id @default(cuid())
  tableId         String
  table           Table       @relation(fields: [tableId], references: [id])
  
  sessionCode     String      @unique  // Código corto para identificar sesión
  customerName    String?
  active          Boolean     @default(true)
  
  orders          Order[]
  
  startedAt       DateTime    @default(now())
  closedAt        DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}

// ACTUALIZADO: Order con session y más estados
enum OrderStatus {
  PENDING         // Cliente confirmó, esperando preparación
  ACCEPTED        // Cocina aceptó (opcional)
  PREPARING       // Cocina preparando
  READY           // Listo para servir
  DELIVERED       // Entregado al cliente
  COMPLETED       // Cliente terminó (pidió cuenta)
  PAID            // Pagado
  CANCELLED       // Cancelado
}

model Order {
  id                String        @id @default(cuid())
  orderNumber       String        @unique
  type              OrderType     @default(DINE_IN)
  status            OrderStatus   @default(PENDING)
  
  // Relaciones
  restaurantId      String
  restaurant        Restaurant    @relation(fields: [restaurantId], references: [id])
  
  tableId           String?
  table             Table?        @relation(fields: [tableId], references: [id])
  
  sessionId         String?
  session           TableSession? @relation(fields: [sessionId], references: [id])
  
  userId            String?       // Quien tomó la orden (worker/admin)
  user              User?         @relation(fields: [userId], references: [id])
  
  // Info cliente (opcional)
  customerName      String?
  customerEmail     String?
  
  items             OrderItem[]
  review            Review?
  
  // Montos
  subtotal          Float
  tax               Float         @default(0)
  tip               Float         @default(0)
  discount          Float         @default(0)
  total             Float
  
  notes             String?       @db.Text
  
  // Tiempos
  preparedAt        DateTime?     // Cuando se marcó READY
  deliveredAt       DateTime?     // Cuando se marcó DELIVERED
  
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
}

// NUEVO: Inventario
model InventoryItem {
  id              String      @id @default(cuid())
  name            String
  sku             String?
  quantity        Float       // Puede ser decimal (ej: 1.5 kg)
  unit            String      @default("unidad")  // kg, litros, unidades, etc
  minStock        Float?      // Stock mínimo para alertar
  cost            Float?      // Costo unitario
  
  restaurantId    String
  restaurant      Restaurant  @relation(fields: [restaurantId], references: [id])
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  @@unique([restaurantId, sku])
}

// Category, Product, OrderItem, Review se mantienen igual 
// pero agregando restaurantId
```

---

## 🎨 VISTAS Y FUNCIONALIDADES

### A. CLIENTE (Sin Autenticación)

#### 1. `/scan/[qrCode]` - Landing después de escanear QR
```tsx
- Detecta mesa por QR
- Crea/recupera TableSession
- Redirige a /menu?session=xxx
- Muestra: "Bienvenido a Mesa #5"
```

#### 2. `/menu?session=xxx` - Menú del restaurante
```tsx
- Muestra productos por categoría
- Carrito flotante
- Botón "Ver mis órdenes" (muestra todas las órdenes de la sesión)
```

#### 3. `/orden/[sessionId]` - Resumen de órdenes activas
```tsx
- Lista todas las órdenes de la sesión
- Estados en tiempo real (WebSocket)
- Botón "Hacer nuevo pedido"
- Botón "Pedir cuenta" (cambia órdenes a COMPLETED)
```

#### 4. `/factura/[sessionId]` - Factura final
```tsx
- Desglose de todas las órdenes
- Subtotal + IVA
- Campo propina (sugerencias: 10%, 15%, 20%, custom)
- Total final
- Botón "Pagar" → Genera review
```

### B. WORKER COCINA

#### 1. `/cocina` - Pantalla de cocina (TV/Tablet)
```tsx
- Grid de órdenes PENDING y PREPARING
- Cada tarjeta muestra:
  * Mesa #
  * Items con cantidad
  * Tiempo desde creación
  * Botón "Marcar listo"
- Actualización en tiempo real (WebSocket)
- Sonido de notificación para nuevas órdenes
```

### C. WORKER MESERO

#### 1. `/servicio` - Órdenes listas para servir
```tsx
- Lista de órdenes READY
- Muestra mesa y items
- Botón "Marcar como entregado"
- Notificación cuando cocina marca READY
```

### D. ADMIN

#### 1. `/admin/restaurante` - Configuración
```tsx
- Nombre, dirección, logo
- Configuración de impuestos
- Horarios
```

#### 2. `/admin/mesas` - Gestión de mesas
```tsx
- Lista de mesas con:
  * Número
  * Capacidad
  * Estado (disponible/ocupada)
  * QR code (botón descargar)
  * Botón "Generar QR"
  * Botón "Editar"
  * Botón "Eliminar"
- Botón "Crear nueva mesa"
- Modal para crear: número, capacidad → Genera QR automáticamente
```

#### 3. `/admin/productos` - Gestión de productos
```tsx
- CRUD completo de productos
- Asignar a categorías
- Marcar disponible/no disponible
- Subir imagen
```

#### 4. `/admin/inventario` - Gestión de inventario
```tsx
- Lista de items de inventario
- Stock actual
- Alertas de stock mínimo
- Agregar/editar/eliminar items
- Historial de movimientos
```

#### 5. `/admin/trabajadores` - Gestión de usuarios
```tsx
- Lista de workers
- Crear worker (nombre, documento, rol: WORKER_COCINA / WORKER_MESERO)
- Editar/eliminar
```

#### 6. `/admin/ordenes` - Vista general de órdenes
```tsx
- Todas las órdenes con filtros
- Estadísticas
- Exportar reportes
```

---

## 🔌 IMPLEMENTACIÓN WEBSOCKET

### Tecnología: Socket.io

```typescript
// lib/socket.ts
import { Server } from 'socket.io'

// Eventos:
- 'order:created' → Notifica cocina
- 'order:status-changed' → Notifica cliente y staff
- 'table:occupied' → Actualiza dashboard
- 'table:available' → Actualiza dashboard
```

### Rooms por restaurante:
```
room: `restaurant:${restaurantId}:cocina`
room: `restaurant:${restaurantId}:servicio`
room: `session:${sessionId}` (para clientes)
```

---

## 📦 GENERACIÓN DE QR

### Tecnología: `qrcode` npm package

```typescript
import QRCode from 'qrcode'

// Al crear mesa, generar:
const qrCode = `${restaurantSlug}-table-${tableNumber}-${randomHash}`
const qrImageUrl = await QRCode.toDataURL(
  `${process.env.NEXT_PUBLIC_URL}/scan/${qrCode}`
)

// Guardar en Table: qrCode, qrImageUrl
```

---

## 🎯 PLAN DE IMPLEMENTACIÓN (ORDEN)

### FASE 1: Base Multi-tenant (Día 1-2)
1. ✅ Actualizar schema.prisma con Restaurant, TableSession, InventoryItem
2. ✅ Migrar base de datos
3. ✅ Actualizar seed con 1 restaurante demo
4. ✅ Actualizar API de registro para asignar restaurantId
5. ✅ Middleware para detectar restaurante actual

### FASE 2: Sistema de Mesas + QR (Día 2-3)
1. ✅ Instalar qrcode package
2. ✅ API para generar QR al crear mesa
3. ✅ Vista `/admin/mesas` CRUD completo
4. ✅ Vista `/scan/[qrCode]` para capturar sesión
5. ✅ Lógica TableSession (crear/recuperar)

### FASE 3: WebSocket en Tiempo Real (Día 3-4)
1. ✅ Configurar Socket.io en Next.js
2. ✅ Eventos de órdenes (created, status-changed)
3. ✅ Vista `/cocina` con actualización en tiempo real
4. ✅ Vista `/servicio` para meseros
5. ✅ Cliente recibe updates de sus órdenes

### FASE 4: Gestión Admin (Día 4-5)
1. ✅ Vista `/admin/productos` CRUD
2. ✅ Vista `/admin/inventario` básico
3. ✅ Vista `/admin/trabajadores` crear/editar
4. ✅ Vista `/admin/restaurante` configuración

### FASE 5: Flujo Cliente Completo (Día 5-6)
1. ✅ Multi-orden en misma sesión
2. ✅ Vista `/orden/[sessionId]` resumen de órdenes
3. ✅ Vista `/factura/[sessionId]` con propina
4. ✅ Finalizar sesión y liberar mesa

### FASE 6: Responsive + Pulido (Día 6-7)
1. ✅ Mobile-first para todas las vistas
2. ✅ Notificaciones sonoras en cocina
3. ✅ Animaciones suaves
4. ✅ Testing completo
5. ✅ Deploy a producción

---

## 💡 DECISIONES CLAVE

### 1. **Cliente sin autenticación**
- SessionId en URL
- localStorage como backup
- Al escanear QR → TableSession se crea/recupera
- Si cierra app y vuelve a escanear mismo QR → Recupera sesión activa

### 2. **Workers con autenticación simple**
- Login con documento + password
- Roles: WORKER_COCINA, WORKER_MESERO, ADMIN
- Sin registro público (solo admin crea workers)

### 3. **Multi-tenant preparado**
- Aunque inicia con 1 restaurante
- Schema listo para escalar
- Slug en URL: `app.comos.com` o `comos.com/{slug}`

### 4. **Estados de orden claros**
```
CLIENTE                    COCINA                 MESERO
Confirma orden    →    PENDING
                       Ve orden
                       Acepta       →    PREPARING
                       Cocina...
                       Marca listo  →    READY
                                                   Ve ready
                                                   Lleva    →    DELIVERED
                       Cliente consume...
                       Pide cuenta  →    COMPLETED
                       Paga         →    PAID
```

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

**¿Comenzamos con FASE 1?** Te propongo:

1. Actualizar schema.prisma completo
2. Correr migración
3. Actualizar seed.ts con datos completos
4. Probar que todo compile

**¿Estás de acuerdo con esta estrategia? ¿Algún cambio o ajuste antes de empezar?**
