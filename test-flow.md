# 🧪 Plan de Pruebas - Sistema co.mos

## Estado Actual de las Correcciones

### ✅ Bugs Corregidos
1. **Error de navegación en /pedido-enviado**: 
   - Problema: React error "Cannot update component while rendering"
   - Solución: Separado setInterval (countdown) de setTimeout (navegación)
   
2. **Productos no se agregan al carrito desde /producto/[id]**:
   - Problema: Carrito no persistía al regresar al menú
   - Solución: Mapeo explícito de campos del producto + sincronización localStorage

3. **Carrito no se cargaba en /menu después de agregar productos**:
   - Problema: No se leía localStorage al montar el componente
   - Solución: Agregado useEffect para cargar cart desde localStorage al iniciar

### 🔧 Mejoras Implementadas
- ✅ Sincronización automática de carrito con localStorage en /menu
- ✅ Validación de email con regex en /confirmar
- ✅ Try-catch para operaciones de carrito
- ✅ Delay de 100ms antes de navegación para asegurar escritura en localStorage

---

## 📋 Checklist de Pruebas

### 1. Flujo Cliente Completo
- [ ] **Landing Page (/)**: Página carga correctamente
- [ ] **Botón "Ver menú"**: Navega a /menu

### 2. Página de Menú (/menu)
- [ ] Carga todas las categorías
- [ ] Carga todos los productos
- [ ] Filtro por categoría funciona
- [ ] Búsqueda por nombre funciona
- [ ] Click en producto navega a /producto/[id]
- [ ] Botón carrito muestra badge con cantidad correcta
- [ ] Carrito flotante muestra productos agregados

### 3. Detalle de Producto (/producto/[id])
- [ ] Carga información completa del producto
- [ ] Imagen se muestra correctamente
- [ ] Precio formateado (COP)
- [ ] Botón "Añadir a la orden" funciona
- [ ] Después de agregar, navega a /menu
- [ ] **CRÍTICO**: Al regresar a /menu, el producto agregado aparece en el carrito
- [ ] Sección de sugerencias muestra productos de la misma categoría

### 4. Página de Carrito (/carrito)
- [ ] Muestra todos los productos agregados
- [ ] Controles +/- ajustan cantidad
- [ ] Botón "Editar Producto" abre modal
- [ ] Modal permite editar notas
- [ ] Subtotal e IVA calculados correctamente
- [ ] Botón "Continuar" navega a /confirmar
- [ ] Si carrito vacío, muestra mensaje y botón para regresar

### 5. Página de Confirmación (/confirmar)
- [ ] Muestra resumen del pedido
- [ ] Inputs para nombre y email
- [ ] Validación: nombre requerido
- [ ] Validación: email requerido
- [ ] Validación: formato de email correcto
- [ ] Modal de confirmación aparece al hacer click
- [ ] Al confirmar, se crea orden en BD
- [ ] Navega a /pedido-enviado con orderId

### 6. Pedido Enviado (/pedido-enviado)
- [ ] Muestra número de orden
- [ ] Muestra información del cliente
- [ ] Countdown de 5 segundos funciona
- [ ] **CRÍTICO**: No hay error de React durante countdown
- [ ] Después de 5s, navega automáticamente a /resena
- [ ] Botón manual para ir a reseña funciona

### 7. Página de Reseña (/resena)
- [ ] Carga información de la orden
- [ ] Sistema de estrellas (1-5) funciona
- [ ] Textarea para comentario
- [ ] Al enviar, guarda review en BD
- [ ] Después de enviar, libera la mesa (available: true)
- [ ] Actualiza orden a status PAID
- [ ] Modal de agradecimiento aparece
- [ ] Navega a /menu o /

### 8. Persistencia de Datos
- [ ] localStorage persiste carrito entre navegaciones
- [ ] Carrito se limpia después de crear orden
- [ ] Recargar página en /menu mantiene carrito
- [ ] Recargar página en /carrito mantiene carrito

### 9. Dashboard Admin (/dashboard)
- [ ] Login funciona (admin@comos.com / 123456)
- [ ] Muestra estadísticas correctas
- [ ] Tarjetas de mesas muestran estado correcto
- [ ] Botones de acciones funcionan
- [ ] Auto-refresh cada 30s

### 10. Gestión de Pedidos (/dashboard/gestion)
- [ ] Lista todas las órdenes
- [ ] Filtros por estado funcionan
- [ ] Muestra detalles completos de cada orden
- [ ] Botón para cambiar estado funciona

---

## 🐛 Bugs Conocidos a Verificar

### Alta Prioridad
1. ~~Navegación causa error de React~~ ✅ CORREGIDO
2. ~~Productos no se agregan al carrito~~ ✅ CORREGIDO
3. ~~Carrito no persiste entre páginas~~ ✅ CORREGIDO

### Media Prioridad
- [ ] Verificar que todas las imágenes carguen
- [ ] Verificar responsive en móvil
- [ ] Verificar que modales funcionen en todas las páginas

### Baja Prioridad
- [ ] Optimizar tiempos de carga
- [ ] Añadir loading states
- [ ] Mejorar manejo de errores de red

---

## 🎯 Pruebas a Ejecutar AHORA

1. **Flujo completo de orden**:
   ```
   / → /menu → /producto/1 → Agregar → /menu (verificar carrito) 
   → /producto/2 → Agregar → /menu (verificar 2 items)
   → /carrito → /confirmar → /pedido-enviado (esperar countdown)
   → /resena → Enviar review
   ```

2. **Verificar localStorage**:
   - Abrir DevTools → Application → Local Storage
   - Verificar que 'cart' se actualice correctamente

3. **Verificar Base de Datos**:
   - Después de crear orden, verificar que existe en Orders table
   - Después de review, verificar que existe en Reviews table
   - Verificar que mesa se libera (Table.available = true)

---

## 📊 Resultados Esperados

### Flujo Exitoso
✅ Todos los checkpoints pasados sin errores
✅ No hay errores en consola del navegador
✅ No hay errores en terminal de Next.js
✅ Orden creada en BD con orderNumber único
✅ Review guardada con rating y comment
✅ Mesa liberada después de review
✅ localStorage limpio después de completar orden

### Próximos Pasos si Todo Funciona
- Deploy a producción
- Configurar variables de entorno
- Testing con usuarios reales
- Monitoreo de errores
