import { NextRequest, NextResponse } from 'next/server';
import { startSessionCleanupJob } from '@/lib/session-cleanup';
import { logger } from '@/lib/logger';

let jobStarted = false;

/**
 * GET /api/sessions/init-cleanup
 * Iniciar el job de limpieza de sesiones (solo se ejecuta una vez)
 */
export async function GET(request: NextRequest) {
  try {
    if (jobStarted) {
      return NextResponse.json({ 
        success: true,
        message: 'Job de limpieza ya está en ejecución'
      });
    }

    startSessionCleanupJob();
    jobStarted = true;
    
    logger.info('Job de limpieza de sesiones iniciado exitosamente');
    
    return NextResponse.json({ 
      success: true,
      message: 'Job de limpieza de sesiones iniciado exitosamente'
    });
  } catch (error) {
    logger.error('Error al iniciar job de limpieza', {
      error: error instanceof Error ? error.message : 'Unknown'
    });
    
    return NextResponse.json(
      { error: 'Error al iniciar job de limpieza de sesiones' },
      { status: 500 }
    );
  }
}
