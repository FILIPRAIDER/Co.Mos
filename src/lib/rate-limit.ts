import { Ratelimit } from '@upstash/ratelimit';
import { getRedisClient } from './redis';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';

// Configuraciones de rate limit por tipo de endpoint
const RATE_LIMITS = {
  // Crear órdenes: 10 por minuto por IP
  'orders:create': {
    requests: 10,
    window: 60, // segundos
  },
  // Leer órdenes: 60 por minuto
  'orders:read': {
    requests: 60,
    window: 60,
  },
  // Crear mesas (admin): 5 por minuto
  'tables:create': {
    requests: 5,
    window: 60,
  },
  // APIs generales: 30 por minuto
  'general': {
    requests: 30,
    window: 60,
  },
  // Upload de archivos: 3 por minuto
  'upload': {
    requests: 3,
    window: 60,
  },
};

// Cache de instancias de Ratelimit
const rateLimiters = new Map<string, Ratelimit>();

export function getRateLimiter(key: keyof typeof RATE_LIMITS): Ratelimit {
  if (!rateLimiters.has(key)) {
    const config = RATE_LIMITS[key];
    const redis = getRedisClient();
    
    rateLimiters.set(
      key,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(config.requests, `${config.window} s`),
        analytics: true,
        prefix: `ratelimit:${key}`,
      })
    );
  }
  
  return rateLimiters.get(key)!;
}

// Obtener identificador único del cliente
export function getClientIdentifier(request: NextRequest): string {
  // Priorizar IP real detrás de proxies
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  // En desarrollo, usar user-agent como identificador adicional
  if (process.env.NODE_ENV === 'development') {
    const userAgent = request.headers.get('user-agent') || 'unknown';
    return `${ip}-${userAgent.substring(0, 50)}`;
  }
  
  return ip;
}

// Middleware de rate limiting
export async function withRateLimit(
  request: NextRequest,
  limitKey: keyof typeof RATE_LIMITS,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const identifier = getClientIdentifier(request);
    const rateLimiter = getRateLimiter(limitKey);
    
    const { success, limit, remaining, reset } = await rateLimiter.limit(identifier);
    
    // Agregar headers de rate limit a la respuesta
    const headers = {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': reset.toString(),
    };
    
    if (!success) {
      logger.warn('Rate limit excedido', {
        identifier,
        limitKey,
        limit,
        remaining,
        reset: new Date(reset * 1000).toISOString(),
      });
      
      const retryAfter = Math.ceil((reset * 1000 - Date.now()) / 1000);
      
      return NextResponse.json(
        {
          error: 'Demasiadas solicitudes. Por favor, intenta más tarde.',
          retryAfter: `${retryAfter} segundos`,
        },
        {
          status: 429,
          headers: {
            ...headers,
            'Retry-After': retryAfter.toString(),
          },
        }
      );
    }
    
    // Ejecutar handler y agregar headers
    const response = await handler();
    
    // Agregar headers de rate limit a la respuesta exitosa
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  } catch (error) {
    // Si Redis falla, permitir la request pero loguear el error
    logger.error('Error en rate limiting', { error, limitKey });
    return handler();
  }
}

// Helper para verificar rate limit sin bloquearlo
export async function checkRateLimit(
  identifier: string,
  limitKey: keyof typeof RATE_LIMITS
): Promise<{ success: boolean; remaining: number; reset: number }> {
  try {
    const rateLimiter = getRateLimiter(limitKey);
    const result = await rateLimiter.limit(identifier);
    
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    logger.error('Error checking rate limit', { error, limitKey });
    // En caso de error, permitir la request
    return { success: true, remaining: 999, reset: 0 };
  }
}
