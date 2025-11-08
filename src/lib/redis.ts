import { Redis } from '@upstash/redis';

// Inicializar cliente de Redis
// IMPORTANTE: Configurar variables de entorno en Railway:
// UPSTASH_REDIS_REST_URL=https://your-redis-url
// UPSTASH_REDIS_REST_TOKEN=your-token

let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (!url || !token) {
      console.warn('⚠️ Redis no configurado. Rate limiting y caching deshabilitados.');
      console.warn('Configura UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN');
      
      // Retornar un mock que no falla pero no hace nada
      return {
        get: async () => null,
        set: async () => 'OK',
        del: async () => 1,
        incr: async () => 1,
        expire: async () => 1,
        ttl: async () => -1,
      } as any;
    }
    
    redis = new Redis({
      url,
      token,
    });
  }
  
  return redis;
}

// Helper para cache con TTL
export async function cacheSet(
  key: string, 
  value: any, 
  ttlSeconds: number = 300
): Promise<void> {
  const client = getRedisClient();
  await client.set(key, JSON.stringify(value), { ex: ttlSeconds });
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  const value = await client.get(key);
  
  if (!value) return null;
  
  try {
    return typeof value === 'string' ? JSON.parse(value) as T : value as T;
  } catch {
    return value as T;
  }
}

export async function cacheDelete(key: string): Promise<void> {
  const client = getRedisClient();
  await client.del(key);
}

// Helper para invalidar cache con patrón
export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  // Nota: Upstash Redis REST API no soporta SCAN
  // Para invalidación por patrón, mantener lista de keys en otra key
  const client = getRedisClient();
  const keysListKey = `keys:${pattern}`;
  const keys = await client.get(keysListKey);
  
  if (keys && Array.isArray(keys)) {
    await Promise.all(keys.map(k => client.del(k)));
    await client.del(keysListKey);
  }
}

export { redis };
