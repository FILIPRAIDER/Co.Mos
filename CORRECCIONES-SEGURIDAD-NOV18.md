# Correcciones de Seguridad y Bugs - 18 Nov 2025

## ✅ Problemas Resueltos

### 1. **Encoding de Caracteres en Dirección del Restaurante**
**Problema:** La dirección mostraba "Bogot�" en lugar de "Bogotá"

**Causa:** El carácter especial "á" estaba corrupto en la base de datos (bytes: `efbfbd`)

**Solución:**
- Creado script `fix-address-encoding.js` que detecta y corrige caracteres corruptos
- Actualizado registro en base de datos con encoding UTF-8 correcto
- Verificado que otros restaurantes no tienen el problema

**Archivos:**
- `scripts/check-encoding.js` - Detectar problemas de encoding
- `scripts/fix-address-encoding.js` - Corregir encoding automáticamente

---

### 2. **Lógica Peligrosa de Fallback de Restaurante**
**Problema:** Los APIs usaban "primer restaurante disponible" cuando el usuario no tenía `restaurantId`

**Riesgo:** **CRÍTICO** - Podía causar fuga de datos entre restaurantes diferentes

**APIs Afectados:**
- `/api/orders` (GET)
- `/api/products` (GET)
- `/api/categories` (GET)
- `/api/tables` (GET)

**Solución:**
1. **Eliminado** el fallback `prisma.restaurant.findFirst()`
2. Ahora retorna error 403 con mensaje claro: "Usuario no tiene restaurante asignado"
3. Verificado que todos los usuarios ADMIN tienen `restaurantId` configurado

**Verificación:**
```bash
node scripts/verify-admin-restaurant.js
# ✅ Todos los 5 usuarios ADMIN tienen restaurante asignado
```

**Cambios en código:**
```typescript
// ANTES (PELIGROSO):
if (!restaurantId) {
  const firstRestaurant = await prisma.restaurant.findFirst();
  if (firstRestaurant) {
    restaurantId = firstRestaurant.id; // ❌ Puede dar restaurante incorrecto
  }
}

// AHORA (SEGURO):
if (!restaurantId) {
  return NextResponse.json(
    { error: 'Usuario no tiene restaurante asignado. Contacta al administrador.' },
    { status: 403 }
  );
}
```

---

### 3. **Órdenes LISTA No Aparecían en Vista de Servicio**
**Problema:** Órdenes marcadas como LISTA no se mostraban en `/servicio`

**Causa:** La lógica de agrupación estaba tomando **solo el pedido más reciente por mesa**
- Si había dos pedidos LISTA de la misma mesa, solo mostraba uno
- Si había un pedido COMPLETADA más reciente, ocultaba los LISTA

**Ejemplo del problema:**
```
Mesa 1:
  - Orden 1: LISTA (9:54:38) ❌ Oculta
  - Orden 2: LISTA (9:55:13) ✅ Mostraba solo esta
  - Orden 3: COMPLETADA (10:00:00) ✅ Pero mostraba esta si era más reciente
```

**Solución:**
- Eliminada la lógica de agrupación por mesa
- Ahora muestra **todas las órdenes** con estado LISTA/ENTREGADA/COMPLETADA
- Cada orden debe ser entregada individualmente

**Código corregido en `servicio/page.tsx`:**
```typescript
// ANTES:
const ordersByTable = new Map<string, Order>();
serviceOrders.forEach((order: Order) => {
  const tableId = order.table.id;
  const existing = ordersByTable.get(tableId);
  if (!existing || new Date(order.createdAt) > new Date(existing.createdAt)) {
    ordersByTable.set(tableId, order); // Solo más reciente
  }
});
setOrders(Array.from(ordersByTable.values()));

// AHORA:
setOrders(serviceOrders); // Todas las órdenes LISTA/ENTREGADA/COMPLETADA
```

---

## 🛡️ Seguridad Mejorada

### Aislamiento de Restaurantes
Ahora **todos los APIs** validan correctamente el `restaurantId`:

1. **Usuarios autenticados:** Usan `getCurrentRestaurant()` desde su sesión
2. **Sin sesión:** Intentan obtener desde `sessionCode` o `tableId`
3. **Sin restaurantId:** Error 403 (antes usaban primer restaurante ❌)

### Verificación de Usuarios ADMIN
Script creado para verificar que todos los ADMIN tengan restaurante:
```bash
node scripts/verify-admin-restaurant.js
```

Resultado:
- ✅ 5 usuarios ADMIN verificados
- ✅ Todos tienen `restaurantId` configurado correctamente
- ✅ No hay riesgo de cross-restaurant data leakage

---

## 📝 Scripts Creados

1. **`verify-admin-restaurant.js`** - Verifica y asigna restaurantes a usuarios ADMIN
2. **`check-encoding.js`** - Detecta caracteres corruptos en direcciones
3. **`fix-address-encoding.js`** - Corrige encoding automáticamente
4. **`check-orders-status.js`** - Lista órdenes actuales con detalles
5. **`list-restaurants.js`** - Lista todos los restaurantes con estadísticas

---

## 🧪 Verificación

### Build Exitoso
```bash
npm run build
✓ Compiled successfully
✓ Generating static pages (46/46)
```

### Estado de Órdenes
```
📊 Órdenes actuales:
   LISTA: 3 ← Ahora se mostrarán todas en servicio
   COMPLETADA: 13
```

---

## 🚀 Impacto

### Antes:
- ❌ Dirección mostraba carácter corrupto
- ❌ APIs podían mezclar datos de restaurantes diferentes
- ❌ Órdenes LISTA desaparecían en vista de servicio
- ❌ Riesgo de seguridad por fallback inseguro

### Ahora:
- ✅ Dirección muestra correctamente "Bogotá"
- ✅ Aislamiento completo entre restaurantes
- ✅ Todas las órdenes LISTA visibles en servicio
- ✅ Error claro si usuario no tiene restaurante asignado
- ✅ Sistema seguro para presentación

---

## 📋 Próximos Pasos para Producción

1. **Deploy a Railway:**
   ```bash
   git add .
   git commit -m "fix: seguridad restaurantes + encoding + órdenes LISTA"
   git push origin main
   ```

2. **Verificar en producción:**
   - Dirección de restaurante sin carácter corrupto
   - Órdenes LISTA aparecen correctamente
   - No hay errores 403 para usuarios válidos

3. **Monitorear logs:**
   - Si aparece error 403, significa que un usuario no tiene `restaurantId`
   - Usar script `verify-admin-restaurant.js` para asignar

---

## ⚠️ Notas Importantes

### Múltiples Restaurantes Detectados
El sistema tiene **3 restaurantes** registrados:
1. **Co.Mos** (cmgzfzvac...) - 4 órdenes, 7 usuarios
2. **Cómo burgers** (cmh9lovgg...) - 0 órdenes, 1 usuario  
3. **Co.mos** (cmh9neilf...) - 24 órdenes, 2 usuarios

**Importante:** Cada usuario solo verá datos de **su propio restaurante**. Las correcciones de seguridad garantizan que no haya mezcla de datos.
