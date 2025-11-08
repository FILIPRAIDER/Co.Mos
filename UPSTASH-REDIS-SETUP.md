# 🔧 Configuración de Redis (Upstash) para Producción

## ¿Por qué Redis?

Redis se utiliza en esta aplicación para:
- **Rate Limiting**: Prevenir abuso de APIs (DDoS protection)
- **Caching**: Acelerar respuestas de queries frecuentes
- **Idempotency Keys**: Evitar órdenes duplicadas en retry

## Setup Rápido (Upstash)

### 1. Crear cuenta en Upstash

1. Ve a https://upstash.com/
2. Regístrate con GitHub o Email
3. Plan FREE incluye:
   - ✅ 10,000 comandos/día
   - ✅ 256 MB storage
   - ✅ Perfecto para empezar

### 2. Crear Database Redis

1. Click en "Create Database"
2. Nombre: `co-mos-production`
3. Región: **Selecciona la más cercana a tu Railway app**
   - US East (Virginia) → `us-east-1`
   - Europe (Ireland) → `eu-west-1`
   - Asia Pacific (Tokyo) → `ap-northeast-1`
4. Type: Regional (FREE)
5. Click "Create"

### 3. Obtener Credenciales

En el dashboard de tu database verás:
- **UPSTASH_REDIS_REST_URL**: `https://your-db-xxxxx.upstash.io`
- **UPSTASH_REDIS_REST_TOKEN**: `AYxxxx...`

### 4. Configurar en Railway

```bash
# Variables de entorno a añadir en Railway:
UPSTASH_REDIS_REST_URL=https://your-db-xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AYxxxx...
```

### 5. Verificar Funcionamiento

Después de deployar, verás en los logs:

```
✅ Rate limiting activo
✅ Cache de órdenes configurado
✅ Idempotency keys habilitadas
```

Si NO configuraste Redis, verás:
```
⚠️ Redis no configurado. Rate limiting y caching deshabilitados.
```

**La app funciona sin Redis**, pero sin las protecciones de seguridad.

---

## Configuración Local (Desarrollo)

Para desarrollo local, puedes:

### Opción 1: Usar Upstash (Recomendado)
Usar las mismas credenciales de producción en `.env.local`:

```env
UPSTASH_REDIS_REST_URL=https://your-db-xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AYxxxx...
```

### Opción 2: Redis Local (Docker)
Si prefieres Redis local:

```bash
# Instalar Redis con Docker
docker run -d -p 6379:6379 redis:alpine

# Usar upstash-redis local (requiere configuración adicional)
# No recomendado, mejor usar Upstash directamente
```

---

## Límites de Rate Limit

Los límites actuales son (ver `src/lib/rate-limit.ts`):

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| `POST /api/orders` | 10 req | 60 seg |
| `GET /api/orders` | 60 req | 60 seg |
| `POST /api/tables` | 5 req | 60 seg |
| `POST /api/upload` | 3 req | 60 seg |
| Otros endpoints | 30 req | 60 seg |

### Ajustar Límites

Edita `src/lib/rate-limit.ts`:

```typescript
const RATE_LIMITS = {
  'orders:create': {
    requests: 20, // Cambiar de 10 a 20
    window: 60,
  },
  // ...
};
```

---

## Monitoreo de Redis

### En Upstash Dashboard

1. Pestaña "Metrics"
2. Ver:
   - Comandos por hora
   - Storage usado
   - Latencia promedio

### Alertas Recomendadas

Configura alertas cuando:
- Uso > 80% del plan FREE
- Latencia > 100ms
- Errores > 1%

---

## Troubleshooting

### Error: "Rate limit excedido"

**Problema**: Usuario ve mensaje "Demasiadas solicitudes"

**Solución**:
1. Verificar si es abuse legítimo (bot, scraping)
2. Aumentar límites si es tráfico real
3. Revisar logs: `logger.warn('Rate limit excedido', ...)`

### Error: "Redis connection failed"

**Problema**: App funciona pero sin rate limiting

**Solución**:
1. Verificar credenciales en Railway
2. Revisar que Upstash database esté activa
3. Comprobar región (latencia alta si está lejos)

### Cache stale (datos viejos)

**Problema**: Cambios no se reflejan inmediatamente

**Solución**:
```typescript
// El cache se invalida automáticamente en:
// - POST /api/orders → cacheDelete(`orders:${restaurantId}`)
// - PATCH /api/orders/[id] → cacheDelete(`orders:${restaurantId}`)

// TTL actual: 30 segundos para orders
```

---

## Costos y Escalabilidad

### Plan FREE (Actual)
- ✅ 10,000 comandos/día
- ✅ 256 MB storage
- ✅ **Suficiente para ~100 órdenes/día**

### Cuándo Upgrade

Upgrade a **Pay as You Go** ($0.2 per 100K commands) cuando:
- Más de 100 órdenes/día
- Múltiples restaurantes
- Cache intensivo

### Estimación de Uso

Por orden promedio:
- 1 comando para idempotency check
- 1 comando para cache invalidation
- 1 comando para rate limit check
= **3 comandos por orden**

100 órdenes/día = **300 comandos** (well within FREE plan)

---

## Seguridad

### Protección de Tokens

```bash
# ❌ NUNCA commitear tokens
.env.local
.env

# ✅ Solo en Railway variables
```

### IP Whitelist (Opcional)

En Upstash:
1. Settings → Security
2. Añadir IPs de Railway
3. Bloquear acceso público

---

## Alternativas a Upstash

Si prefieres otra opción:

| Servicio | Pros | Contras |
|----------|------|---------|
| **Upstash** | REST API, FREE tier generoso | - |
| Redis Cloud | Oficial, robusto | Sin free tier real |
| Railway Redis | Integrado | $5/mes mínimo |
| Vercel KV | Integrado con Vercel | Vendor lock-in |

**Recomendación**: Quedarse con **Upstash** es lo mejor para este proyecto.

---

## Checklist de Implementación

- [ ] Crear cuenta Upstash
- [ ] Crear database Redis
- [ ] Copiar credenciales
- [ ] Añadir variables en Railway:
  - [ ] `UPSTASH_REDIS_REST_URL`
  - [ ] `UPSTASH_REDIS_REST_TOKEN`
- [ ] Deploy
- [ ] Verificar logs (sin warnings de Redis)
- [ ] Probar rate limiting (hacer 11 requests rápidos)
- [ ] Monitorear Upstash metrics

---

## Próximos Pasos

Una vez Redis esté configurado:

1. **Monitorear por 1 semana**
   - Ver patrones de uso
   - Ajustar límites si necesario

2. **Configurar alertas**
   - Email cuando uso > 80%
   - Slack cuando latencia > 100ms

3. **Optimizar cache**
   - Aumentar TTL para productos (cambian poco)
   - Reducir TTL para órdenes activas

---

## Soporte

- Upstash Docs: https://docs.upstash.com/redis
- Discord Upstash: https://discord.gg/upstash
- GitHub Issues: (tu repo)
