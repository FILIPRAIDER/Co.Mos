import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UpdateOrderStatusSchema } from '@/lib/validations/order.schema';
import { validateTransition } from '@/lib/state-machine';
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/rate-limit';
import { cacheDelete } from '@/lib/redis';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRateLimit(request, 'general', async () => {
    try {
      const { id } = await params;
      const body = await request.json();
      
      // Validar con Zod
      const validation = UpdateOrderStatusSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Estado inválido', details: validation.error.issues },
          { status: 400 }
        );
      }
      
      const { status } = validation.data;

      // Obtener orden actual
      const currentOrder = await prisma.order.findUnique({
        where: { id },
        select: { status: true, restaurantId: true }
      });

      if (!currentOrder) {
        return NextResponse.json(
          { error: 'Orden no encontrada' },
          { status: 404 }
        );
      }

      // Validar transición de estado
      const transitionValidation = validateTransition(currentOrder.status as any, status as any);
      if (!transitionValidation.valid) {
        logger.warn('Transición de estado inválida', {
          orderId: id,
          from: currentOrder.status,
          to: status,
          error: transitionValidation.error
        });
        
        return NextResponse.json(
          { error: transitionValidation.error },
          { status: 400 }
        );
      }

      // Actualizar estado
      const order = await prisma.order.update({
        where: { id },
        data: { status },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          table: true,
          session: true,
        },
      });

      logger.info('Estado de orden actualizado', {
        orderId: id,
        from: currentOrder.status,
        to: status
      });

      // Invalidar cache
      await cacheDelete(`orders:${currentOrder.restaurantId}`);

      return NextResponse.json({ success: true, order });
    } catch (error) {
      logger.error('Error actualizando orden', {
        error: error instanceof Error ? error.message : 'Unknown'
      });
      
      return NextResponse.json(
        { error: 'Error al actualizar la orden' },
        { status: 500 }
      );
    }
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRateLimit(request, 'orders:read', async () => {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        table: true,
        session: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

      return NextResponse.json(order);
    } catch (error) {
      logger.error('Error fetching order', { error: error instanceof Error ? error.message : 'Unknown' });
      return NextResponse.json(
        { error: 'Error al obtener la orden' },
        { status: 500 }
      );
    }
  });
}
