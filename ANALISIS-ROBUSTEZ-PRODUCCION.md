# 🔒 Análisis de Robustez para Producción

## Resumen Ejecutivo

Se ha realizado un análisis exhaustivo del sistema buscando vulnerabilidades, errores potenciales y mejoras críticas para garantizar que la aplicación sea **production-ready** para un restaurante real.

**Estado Actual:** ⚠️ Funcional pero con vulnerabilidades críticas que deben resolverse antes de uso intensivo en producción.

**Severidad de Hallazgos:**
- 🔴 **Crítico:** 8 problemas (seguridad, race conditions, pérdida de datos)
- 🟠 **Alto:** 12 problemas (validación, performance, manejo de errores)
- 🟡 **Medio:** 9 problemas (UX, logs, optimizaciones)

---

## 🔴 PROBLEMAS CRÍTICOS (Prioridad Máxima)

### 1. **Sin Validación de Inputs en APIs** 
**Severidad:** 🔴 CRÍTICO  
**Riesgo:** Inyección SQL, XSS, Data Corruption  
**Archivos Afectados:**
- `src/app/api/orders/route.ts` (líneas 10-65)
- `src/app/api/tables/route.ts` (línea 42)
- `src/app/api/sessions/[id]/route.ts` (línea 10)

**Problema:**
```typescript
// ❌ ACTUAL - Sin validación
const body = await request.json();
const { items, tableId, type, notes } = body; // Acepta cualquier cosa
```

**Impacto Real:**
- Un cliente malicioso podría enviar `items: "hola"` y crashear el servidor
- Podría inyectar HTML/scripts en `notes` que se renderizaría sin sanitizar
- Números negativos en `quantity` generarían órdenes con precios negativos

**Solución Requerida:**
```typescript
// ✅ CORRECTO - Con validación Zod
import { z } from 'zod';

const OrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().cuid(),
    quantity: z.number().int().min(1).max(50),
    notes: z.string().max(500).optional()
  })).min(1).max(20),
  tableId: z.string().cuid().optional(),
  type: z.enum(['COMER_AQUI', 'PARA_LLEVAR']),
  notes: z.string().max(1000).optional()
});

const validated = OrderSchema.safeParse(body);
if (!validated.success) {
  return NextResponse.json({ 
    error: 'Datos inválidos', 
    details: validated.error.issues 
  }, { status: 400 });
}
```

---

### 2. **Race Conditions en Creación de Sesiones**
**Severidad:** 🔴 CRÍTICO  
**Riesgo:** Múltiples sesiones activas en una mesa, órdenes perdidas  
**Archivo:** `src/app/api/orders/route.ts` (líneas 102-115)

**Problema:**
```typescript
// ❌ ACTUAL - Race condition
const existingSession = await prisma.tableSession.findFirst({
  where: { tableId, active: true }
});

if (!existingSession) {
  // Si 2 requests llegan simultáneamente, ambos pasarán este check
  session = await prisma.tableSession.create({
    data: { tableId, sessionCode, active: true }
  });
}
```

**Escenario Real:**
1. Cliente 1 escanea QR y hace pedido → Check de sesión (no existe)
2. Cliente 2 escanea QR simultáneamente → Check de sesión (no existe)
3. Ambos crean sesión nueva → **2 sesiones activas en misma mesa** 🔥
4. Órdenes se reparten entre sesiones → Factura incorrecta

**Solución Requerida:**
```typescript
// ✅ CORRECTO - Con SELECT FOR UPDATE
const session = await prisma.$transaction(async (tx) => {
  // Lock optimista: buscar y crear en una transacción atómica
  const existing = await tx.tableSession.findFirst({
    where: { tableId, active: true },
    // Lock a nivel DB previene race conditions
  });

  if (existing) return existing;

  return await tx.tableSession.create({
    data: { 
      tableId, 
      sessionCode, 
      active: true,
      startedAt: new Date()
    }
  });
}, {
  isolationLevel: 'Serializable', // Máxima protección
  maxWait: 5000,
  timeout: 10000
});
```

---

### 3. **Sin Rate Limiting en Endpoints Críticos**
**Severidad:** 🔴 CRÍTICO  
**Riesgo:** DDoS, abuso, costos de DB excesivos  
**Archivos:** Todos los `route.ts` (8 endpoints)

**Problema:**
Un usuario puede hacer 1000 requests/segundo y:
- Crear 1000 órdenes basura
- Saturar la base de datos
- Aumentar costos de Railway/PlanetScale
- Bloquear usuarios legítimos

**Solución Requerida:**
```typescript
// ✅ Implementar rate limiting con upstash/ratelimit
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 req cada 10 seg
  analytics: true,
});

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success, limit, remaining } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta en 10 segundos.' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString()
        }
      }
    );
  }
  // ... resto del código
}
```

---

### 4. **Falta de Idempotency Keys**
**Severidad:** 🔴 CRÍTICO  
**Riesgo:** Órdenes duplicadas, doble cobro  
**Archivo:** `src/app/api/orders/route.ts`

**Escenario Real:**
1. Cliente hace pedido
2. Network lento → Timeout del cliente
3. Cliente reintenta → **Pedido duplicado** 🔥
4. Se cobra 2 veces, cliente reclama

**Solución Requerida:**
```typescript
// ✅ Frontend envía idempotency key
const response = await fetch('/api/orders', {
  method: 'POST',
  headers: {
    'Idempotency-Key': crypto.randomUUID() // Único por pedido
  },
  body: JSON.stringify(order)
});

// ✅ Backend valida key (usar Redis o tabla de cache)
const idempotencyKey = request.headers.get('Idempotency-Key');
if (!idempotencyKey) {
  return NextResponse.json({ error: 'Falta Idempotency-Key' }, { status: 400 });
}

// Buscar si ya procesamos esta key
const cached = await redis.get(`idempotency:${idempotencyKey}`);
if (cached) {
  // Retornar respuesta cacheada
  return NextResponse.json(JSON.parse(cached));
}

// Procesar orden...
const order = await createOrder(data);

// Cachear respuesta por 24h
await redis.set(`idempotency:${idempotencyKey}`, JSON.stringify(order), {
  ex: 86400
});
```

---

### 5. **Socket.IO Sin Autenticación en Rooms**
**Severidad:** 🔴 CRÍTICO  
**Riesgo:** Cliente puede ver/modificar órdenes de otros restaurantes  
**Archivo:** `server.js`

**Problema:**
```javascript
// ❌ Cualquiera puede unirse a cualquier room
socket.on('join:cocina', () => {
  socket.join('cocina'); // Sin validar rol ni restaurante
});
```

**Escenario de Ataque:**
1. Competidor abre devtools en tu app
2. Ejecuta: `socket.emit('join:admin')`
3. **Ve todas las órdenes en tiempo real** 🔥
4. Puede emitir eventos falsos

**Solución Requerida:**
```javascript
// ✅ Validar autenticación y rol
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Sin token'));

  try {
    const session = await getSessionFromToken(token);
    socket.data.user = session.user;
    socket.data.restaurantId = session.user.restaurantId;
    next();
  } catch (error) {
    next(new Error('Token inválido'));
  }
});

socket.on('join:cocina', () => {
  const { user } = socket.data;
  if (user.role !== 'COCINERO' && user.role !== 'ADMIN') {
    return socket.emit('error', 'No autorizado');
  }
  
  // Unirse solo al room de su restaurante
  socket.join(`cocina:${user.restaurantId}`);
});
```

---

### 6. **Transacciones Sin Rollback Completo**
**Severidad:** 🔴 CRÍTICO  
**Riesgo:** Estado inconsistente, órdenes sin items  
**Archivo:** `src/app/api/orders/route.ts` (línea 145-190)

**Problema:**
```typescript
// ❌ Si falla al crear items, la orden queda vacía
const order = await prisma.order.create({ data: orderData });

// Si esto falla, la orden ya existe sin items ❌
for (const item of items) {
  await prisma.orderItem.create({ data: item });
}
```

**Solución Requerida:**
```typescript
// ✅ Todo en una transacción atómica
const order = await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({
    data: {
      ...orderData,
      items: {
        create: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes
        }))
      }
    }
  });

  // Validar inventario dentro de la transacción
  for (const item of items) {
    const product = await tx.product.findUnique({
      where: { id: item.productId }
    });

    if (!product.available) {
      throw new Error(`Producto ${product.name} no disponible`);
    }
  }

  return order;
}, {
  maxWait: 5000,
  timeout: 10000
});
```

---

### 7. **Información Sensible en Mensajes de Error**
**Severidad:** 🔴 CRÍTICO  
**Riesgo:** Exposición de estructura de DB, rutas internas  
**Archivos:** Todos los `route.ts`

**Problema:**
```typescript
// ❌ Expone detalles internos
catch (error) {
  console.error('Error creating order:', error);
  return NextResponse.json(
    { error: 'Error al crear la orden' }, // Genérico ✅
    { status: 500 }
  );
}

// Pero en development se ve el stack trace completo en console ❌
```

**Solución Requerida:**
```typescript
// ✅ Logger estructurado con redacción
import { logger } from '@/lib/logger';

catch (error) {
  logger.error('Error creating order', {
    error: error instanceof Error ? error.message : 'Unknown',
    userId: session?.user?.id,
    restaurantId: restaurant.id,
    // NO loguear datos sensibles
  });

  // Mensaje genérico al cliente
  return NextResponse.json(
    { error: 'Error al procesar la solicitud' },
    { status: 500 }
  );
}
```

---

### 8. **Sin Validación de Estado en Actualizaciones**
**Severidad:** 🔴 CRÍTICO  
**Riesgo:** Estados inconsistentes, órdenes COMPLETADA vuelve a PENDIENTE  
**Archivo:** `src/app/api/orders/[id]/route.ts`

**Problema:**
```typescript
// ❌ Permite cualquier transición de estado
const order = await prisma.order.update({
  where: { id },
  data: { status } // Sin validar transición
});
```

**Escenario Problemático:**
- Orden está COMPLETADA y PAGADA
- Admin accidentalmente la pone en PENDIENTE
- Cliente ya pagó pero sistema dice pendiente 🔥

**Solución Requerida:**
```typescript
// ✅ Máquina de estados validada
const VALID_TRANSITIONS = {
  PENDIENTE: ['ACEPTADA', 'CANCELADA'],
  ACEPTADA: ['PREPARANDO', 'CANCELADA'],
  PREPARANDO: ['LISTA', 'CANCELADA'],
  LISTA: ['ENTREGADA'],
  ENTREGADA: ['COMPLETADA'],
  COMPLETADA: ['PAGADA'],
  PAGADA: [], // Estado final
  CANCELADA: [] // Estado final
};

const currentOrder = await prisma.order.findUnique({ where: { id } });

if (!VALID_TRANSITIONS[currentOrder.status].includes(status)) {
  return NextResponse.json({
    error: `No se puede cambiar de ${currentOrder.status} a ${status}`
  }, { status: 400 });
}
```

---

## 🟠 PROBLEMAS DE ALTA PRIORIDAD

### 9. **N+1 Query Problem en Dashboard**
**Severidad:** 🟠 ALTO  
**Impacto:** Lentitud en dashboard con muchas mesas  
**Archivo:** `src/app/api/tables/route.ts`

**Problema:**
```typescript
// Para 20 mesas hace:
// 1 query de mesas
// 20 queries de sesiones
// 20 queries de órdenes
// = 41 queries 🐌
include: {
  sessions: {
    where: { active: true },
    include: { orders: true }
  }
}
```

**Solución:**
```typescript
// ✅ 1 query con JOIN
const tables = await prisma.table.findMany({
  where: { restaurantId },
  select: {
    id: true,
    number: true,
    capacity: true,
    available: true,
    _count: {
      select: { sessions: { where: { active: true } } }
    }
  }
});

// Fetch activas separadamente con 1 query
const activeSessions = await prisma.tableSession.findMany({
  where: { 
    table: { restaurantId },
    active: true 
  },
  include: { orders: true }
});

// Merge en memoria
```

### 10. **Sin Timeouts en Sesiones Inactivas**
**Severidad:** 🟠 ALTO  
**Impacto:** Mesas quedan ocupadas indefinidamente  

**Problema:**
- Cliente escanea QR pero no ordena → Mesa bloqueada forever
- No hay mecanismo de limpieza automática

**Solución:**
```typescript
// ✅ Cron job cada 30 minutos
export async function closeStaleSessions() {
  const staleThreshold = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 horas

  const staleSessions = await prisma.tableSession.findMany({
    where: {
      active: true,
      startedAt: { lt: staleThreshold },
      orders: { none: {} } // Sin órdenes
    }
  });

  for (const session of staleSessions) {
    await prisma.$transaction([
      prisma.tableSession.update({
        where: { id: session.id },
        data: { active: false, closedAt: new Date() }
      }),
      prisma.table.update({
        where: { id: session.tableId },
        data: { available: true }
      })
    ]);
  }
}
```

### 11. **Falta de Índices Importantes**
**Severidad:** 🟠 ALTO  
**Impacto:** Queries lentas con muchos datos

**Faltantes:**
```prisma
// ✅ Añadir en schema.prisma
model Order {
  // ...existing fields
  @@index([restaurantId, status, createdAt]) // Filtros dashboard
  @@index([sessionId, status]) // Cálculo de facturas
}

model OrderItem {
  @@index([orderId, productId]) // Reporte de productos
}
```

### 12. **Sin Manejo de Concurrencia en Inventario**
**Severidad:** 🟠 ALTO  
**Archivo:** `src/app/api/inventory/[id]/route.ts`

**Problema:**
```typescript
// ❌ Sin versioning
const item = await prisma.inventoryItem.update({
  where: { id },
  data: { quantity: newQuantity } // Race condition
});
```

**Solución:**
```typescript
// ✅ Optimistic locking
model InventoryItem {
  version Int @default(0)
}

const updated = await prisma.inventoryItem.updateMany({
  where: { 
    id,
    version: currentVersion 
  },
  data: { 
    quantity: { decrement: usedQuantity },
    version: { increment: 1 }
  }
});

if (updated.count === 0) {
  throw new Error('Conflicto de concurrencia, reintentar');
}
```

---

## 🟡 MEJORAS RECOMENDADAS (Media Prioridad)

### 13. **Logs Estructurados**
```typescript
// Implementar Winston o Pino
import { logger } from '@/lib/logger';

logger.info('Order created', {
  orderId: order.id,
  restaurantId,
  total: order.total,
  itemCount: items.length,
  duration: performance.now() - start
});
```

### 14. **Monitoreo con Sentry**
```typescript
// Capturar errores automáticamente
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV
});
```

### 15. **Caching de Productos**
```typescript
// Redis cache para menú (cambia poco)
const cachedMenu = await redis.get(`menu:${restaurantId}`);
if (cachedMenu) return JSON.parse(cachedMenu);

const menu = await prisma.product.findMany();
await redis.set(`menu:${restaurantId}`, JSON.stringify(menu), {
  ex: 300 // 5 minutos
});
```

---

## 📋 PLAN DE IMPLEMENTACIÓN

### **Fase 1: Quick Wins (1-2 días)** ⚡
**Impacto Inmediato, Bajo Esfuerzo**

1. ✅ **Validación con Zod** (4h)
   - Crear schemas en `src/lib/validations/`
   - Aplicar en orders, tables, sessions
   - Testing básico

2. ✅ **Rate Limiting** (2h)
   - Setup Upstash Redis
   - Middleware de rate limit
   - Aplicar a endpoints POST/PATCH

3. ✅ **Validación de Transiciones de Estado** (2h)
   - Crear máquina de estados
   - Aplicar en orders/[id]/route.ts
   - Testing de transiciones

4. ✅ **Mensajes de Error Seguros** (1h)
   - Revisar todos los catch
   - Mensajes genéricos al cliente
   - Logs detallados server-side

**Total Fase 1:** ~9 horas

---

### **Fase 2: Correcciones Críticas (3-5 días)** 🔥
**Alta Complejidad, Impacto Mayor**

1. ✅ **Socket.IO Authentication** (6h)
   - Middleware de auth
   - Validación de roles en rooms
   - Testing de permisos

2. ✅ **Race Conditions** (8h)
   - Transacciones con isolation level
   - Optimistic locking en sesiones
   - Testing concurrente con k6

3. ✅ **Idempotency Keys** (6h)
   - Setup Redis para keys
   - Modificar frontend
   - Testing de retries

4. ✅ **Transacciones Atómicas** (4h)
   - Refactor order creation
   - Nested creates
   - Rollback testing

**Total Fase 2:** ~24 horas (3 días)

---

### **Fase 3: Performance & Monitoreo (2-3 días)** ⚡
**Preparación para Escala**

1. ✅ **Optimización de Queries** (6h)
   - Fix N+1 problems
   - Añadir índices
   - Prisma query profiling

2. ✅ **Cron Jobs** (4h)
   - Sesiones stale
   - Limpieza de cache
   - Reportes diarios

3. ✅ **Logging & Monitoring** (4h)
   - Winston setup
   - Sentry integration
   - Dashboards básicos

4. ✅ **Caching Strategy** (4h)
   - Redis para menú
   - ISR para páginas estáticas
   - Cache headers

**Total Fase 3:** ~18 horas (2-3 días)

---

### **Fase 4: Testing & Documentation (2 días)** 📚

1. ✅ **Tests de Integración** (8h)
   - Scenarios de race conditions
   - Load testing con k6
   - Security testing

2. ✅ **Documentación** (4h)
   - API docs
   - Runbooks
   - Incident response guide

**Total Fase 4:** ~12 horas (1.5 días)

---

## 🎯 ROADMAP COMPLETO

```
Semana 1:
├─ Día 1-2: Fase 1 (Quick Wins)
└─ Día 3-5: Fase 2 (Críticos) inicio

Semana 2:
├─ Día 1-2: Fase 2 (Críticos) finalización
├─ Día 3-4: Fase 3 (Performance)
└─ Día 5: Fase 4 (Testing)

Deployment: Sábado temprano (bajo tráfico)
```

---

## 🚀 ARCHIVOS A CREAR

```
src/
├─ lib/
│  ├─ validations/
│  │  ├─ order.schema.ts
│  │  ├─ table.schema.ts
│  │  └─ session.schema.ts
│  ├─ rate-limit.ts
│  ├─ logger.ts
│  ├─ redis.ts
│  └─ state-machine.ts
├─ middleware/
│  ├─ auth.ts
│  ├─ error-handler.ts
│  └─ rate-limit.middleware.ts
└─ jobs/
   ├─ close-stale-sessions.ts
   └─ cleanup-cache.ts
```

---

## ✅ CHECKLIST DE PRODUCCIÓN

Antes de considerar la app production-ready:

### Seguridad
- [ ] Todas las APIs validadas con Zod
- [ ] Rate limiting en todos los endpoints
- [ ] Socket.IO con autenticación
- [ ] Idempotency keys implementadas
- [ ] Mensajes de error seguros
- [ ] CORS configurado correctamente
- [ ] Headers de seguridad (CSP, X-Frame-Options)

### Confiabilidad
- [ ] Race conditions resueltas
- [ ] Transacciones atómicas
- [ ] Estado consistente (máquina de estados)
- [ ] Rollback automático en fallos
- [ ] Timeouts en sesiones
- [ ] Cleanup de datos stale

### Performance
- [ ] N+1 queries eliminadas
- [ ] Índices de DB optimizados
- [ ] Caching implementado
- [ ] Connection pooling
- [ ] Queries < 100ms en promedio

### Observabilidad
- [ ] Logging estructurado
- [ ] Sentry configurado
- [ ] Métricas de performance
- [ ] Alertas configuradas
- [ ] Dashboards de monitoreo

### Testing
- [ ] Tests de integración
- [ ] Load testing (100 concurrent users)
- [ ] Security testing (OWASP Top 10)
- [ ] Disaster recovery tested

---

## 💰 ESTIMACIÓN DE ESFUERZO

| Fase | Horas | Días (8h/día) | Prioridad |
|------|-------|---------------|-----------|
| Fase 1: Quick Wins | 9h | 1-2 días | 🔴 Crítico |
| Fase 2: Críticos | 24h | 3 días | 🔴 Crítico |
| Fase 3: Performance | 18h | 2-3 días | 🟠 Alto |
| Fase 4: Testing | 12h | 1.5 días | 🟡 Medio |
| **TOTAL** | **63h** | **7-9 días** | |

---

## 📊 IMPACTO ESPERADO

Después de implementar todas las mejoras:

### Antes 🐌
- ⚠️ Vulnerable a ataques DoS
- ⚠️ Race conditions en ~5% de órdenes
- ⚠️ Dashboard lento (500ms+)
- ⚠️ Órdenes duplicadas ocasionales
- ⚠️ Mesas bloqueadas indefinidamente

### Después 🚀
- ✅ Protegido contra abuse (rate limit)
- ✅ 0 race conditions (transacciones serializables)
- ✅ Dashboard < 100ms
- ✅ Idempotencia garantizada
- ✅ Auto-limpieza cada 30min
- ✅ Logs & monitoring completo
- ✅ Production-ready para 100+ órdenes/hora

---

## 🎯 SIGUIENTE PASO RECOMENDADO

**Comenzar con Fase 1 inmediatamente:**

1. Instalar dependencias:
```bash
npm install zod @upstash/ratelimit @upstash/redis
```

2. Crear schemas de validación
3. Aplicar rate limiting
4. Deploy incremental (sin downtime)

¿Procedemos con la implementación?
