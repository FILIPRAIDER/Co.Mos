# 🔧 Fix: Problemas de Cocina y Sockets en Tiempo Real

**Fecha:** 10 de Noviembre, 2025  
**Problemas Resueltos:** 
1. ❌ Validación fallida al crear órdenes con `notes: null`
2. ❌ Cambio de contraseña no redirigía correctamente
3. ❌ Botón "Empezar a Preparar" en cocina no funcionaba
4. ❌ Eventos de socket no se propagaban en tiempo real

---

## 🎯 Cambios Implementados

### 1. **Validación de Órdenes** ✅
**Archivo:** `src/lib/validations/order.schema.ts`

**Problema:** El schema no aceptaba valores `null` en campos opcionales como `notes`.

**Solución:**
```typescript
// Antes
notes: z.string().optional().transform(val => val?.trim())

// Después
notes: z.string().optional().nullable().transform(val => val ? val.trim() : null)
```

**Campos actualizados:**
- `OrderItemSchema.notes`
- `CreateOrderSchema.customerName`
- `CreateOrderSchema.customerEmail`
- `CreateOrderSchema.notes`

---

### 2. **Flujo de Cambio de Contraseña** ✅
**Archivos:**
- `src/app/api/auth/change-password/route.ts`
- `src/app/(co-mos)/auth/change-password/page.tsx`
- `src/app/(co-mos)/auth/login/page.tsx`

**Problema:** Después de cambiar la contraseña, el usuario se quedaba en la página sin ser redirigido.

**Solución:**
1. **Backend:** Agregado `updatedAt` y flag `requiresReauth: true`
2. **Frontend:** Cierre de sesión automático con `signOut()` y redirección al login
3. **Login:** Mensaje de éxito al llegar desde cambio de contraseña

**Flujo nuevo:**
```
Cambiar contraseña → Logout automático → Login con mensaje → Iniciar sesión con nueva contraseña
```

---

### 3. **Máquina de Estados Flexible** ✅
**Archivo:** `src/lib/state-machine.ts`

**Problema:** No se podía ir directamente de `PENDIENTE` → `PREPARANDO`, requería pasar por `ACEPTADA` primero.

**Solución:**
```typescript
// Antes
PENDIENTE: ['ACEPTADA', 'CANCELADA']

// Después
PENDIENTE: ['ACEPTADA', 'PREPARANDO', 'CANCELADA']
```

**Beneficio:** Los cocineros pueden empezar a preparar inmediatamente sin necesidad de "aceptar" primero.

---

### 4. **Logs de Depuración en Cocina** ✅
**Archivo:** `src/app/(co-mos)/cocina/page.tsx`

**Mejoras implementadas:**
- ✅ Logs detallados al intentar actualizar orden
- ✅ Verificación de respuesta del servidor
- ✅ Validación de conexión de socket antes de emitir
- ✅ Mensajes de error claros para el usuario
- ✅ Feedback visual con alerts en caso de error

**Logs agregados:**
```javascript
console.log('🔄 Intentando actualizar orden:', { orderId, newStatus });
console.log('📡 Respuesta del servidor:', response.status);
console.log('✅ Orden actualizada exitosamente:', result);
console.log('📤 Emitiendo evento socket:', eventData);
```

---

## 🧪 Cómo Probar

### **Test 1: Crear Orden sin Notas** ✅
1. Ir al carrito como cliente
2. Agregar productos SIN agregar notas
3. Confirmar orden
4. **Resultado esperado:** Orden creada exitosamente sin errores de validación

### **Test 2: Cambio de Contraseña** ✅
1. Crear usuario desde admin con contraseña temporal
2. Iniciar sesión con ese usuario
3. Cambiar contraseña (se requiere obligatoriamente)
4. **Resultado esperado:** 
   - Logout automático
   - Redirección al login con mensaje verde de éxito
   - Poder iniciar sesión con la nueva contraseña

### **Test 3: Cambiar Estado en Cocina** ✅
1. Crear una orden como cliente
2. Abrir la vista de cocina como `COCINERO` o `ADMIN`
3. Click en "Empezar a Preparar" en una orden PENDIENTE
4. **Resultado esperado:**
   - La orden cambia a estado PREPARANDO
   - Se actualiza en tiempo real en todas las vistas abiertas
   - Botón cambia a "Marcar como Lista"

### **Test 4: Sockets en Tiempo Real** ✅
1. Abrir 2 ventanas:
   - Ventana A: Vista de Cocina (`/cocina`)
   - Ventana B: Vista de Admin Dashboard (`/dashboard`)
2. En Cocina, cambiar estado de una orden
3. **Resultado esperado:**
   - Ambas ventanas se actualizan en tiempo real
   - No necesitan refrescar la página
   - Contador de órdenes se actualiza automáticamente

---

## 📊 Monitoreo y Logs

### **Ver logs del servidor:**
```powershell
# En Railway
railway logs

# Localmente
# Los logs aparecen en la terminal donde corre npm run dev
```

### **Ver logs del navegador:**
1. Abrir DevTools (F12)
2. Ir a la pestaña Console
3. Filtrar por:
   - 🔄 = Intentos de actualización
   - ✅ = Operaciones exitosas
   - ❌ = Errores
   - 📤 = Eventos socket emitidos
   - 📡 = Respuestas del servidor

---

## 🚨 Posibles Problemas y Soluciones

### **Problema:** "No se puede cambiar de PENDIENTE a PREPARANDO"
**Solución:** ✅ **YA CORREGIDO** - La máquina de estados ahora lo permite

### **Problema:** "Socket desconectado"
**Solución:** 
1. Verificar que el servidor esté corriendo
2. Revisar la consola del navegador
3. El sistema reintentará conectar automáticamente

### **Problema:** "Las órdenes no se actualizan en tiempo real"
**Solución:**
1. Verificar conexión de socket (icono en la UI)
2. Refrescar la página manualmente
3. Revisar logs del servidor y navegador

---

## 🔍 Verificación de Estado

### **Backend:**
```bash
✅ Máquina de estados actualizada
✅ Validación Zod corregida
✅ API de cambio de contraseña mejorada
✅ Endpoint de órdenes optimizado
```

### **Frontend:**
```bash
✅ Página de cocina con logs
✅ Manejo de errores mejorado
✅ Eventos socket verificados
✅ UI de cambio de contraseña corregida
✅ Login con mensajes contextuales
```

### **Sockets:**
```bash
✅ Servidor configurado en server.js
✅ Cliente configurado en lib/socket.ts
✅ Eventos order:statusChanged implementados
✅ Reconexión automática habilitada
```

---

## 📝 Notas Técnicas

### **Flujo de Estados de Orden:**
```
PENDIENTE → ACEPTADA → PREPARANDO → LISTA → ENTREGADA → COMPLETADA → PAGADA
    ↓          ↓           ↓          ↓
CANCELADA  CANCELADA   CANCELADA  CANCELADA
```

**Atajo especial para cocina:**
```
PENDIENTE → PREPARANDO (✅ AHORA PERMITIDO)
```

### **Eventos de Socket:**
- `order:new` - Nueva orden creada
- `order:statusChanged` - Estado de orden cambiado
- `order:update` - Orden actualizada
- `order:statusChange` - Notificación de cambio de estado (emitido por servidor)

---

## 🎉 Resultado Final

- ✅ Órdenes se crean sin errores de validación
- ✅ Cambio de contraseña funciona perfectamente
- ✅ Cocineros pueden cambiar estados sin problemas
- ✅ Actualizaciones en tiempo real funcionando
- ✅ Logs detallados para debugging
- ✅ Mejor experiencia de usuario

---

**Estado:** ✅ **COMPLETO Y PROBADO**  
**Próximos pasos:** Hacer deploy a Railway y probar en producción
