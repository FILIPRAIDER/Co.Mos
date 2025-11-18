import { NextRequest, NextResponse } from 'next/server';
import { checkAndCloseSessionIfInactive } from '@/lib/session-cleanup';
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/sessions/cleanup
 * Ejecutar limpieza manual de sesiones inactivas
 */
export async function POST(request: NextRequest) {
  return withRateLimit(request, 'general', async () => {
    try {
      const { closeInactiveSessions } = await import('@/lib/session-cleanup');
      
      const closedCount = await closeInactiveSessions();
      
      logger.info('Limpieza manual de sesiones ejecutada', { closedCount });
      
      return NextResponse.json({ 
        success: true,
        message: `Se cerraron ${closedCount} sesiones inactivas`,
        closedCount 
      });
    } catch (error) {
      logger.error('Error en limpieza manual de sesiones', {
        error: error instanceof Error ? error.message : 'Unknown'
      });
      
      return NextResponse.json(
        { error: 'Error al ejecutar limpieza de sesiones' },
        { status: 500 }
      );
    }
  });
}
