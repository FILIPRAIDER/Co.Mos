import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, rating, comment } = body;

    // Validaciones
    if (!orderId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      );
    }

    // Verificar que la orden existe
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        table: true,
        session: {
          include: {
            orders: true
          }
        }
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    // Crear la reseña
    const review = await prisma.review.create({
      data: {
        orderId,
        rating,
        comment,
      },
    });

    // Actualizar estado de la orden a COMPLETADA
    await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: 'COMPLETADA',
        completedAt: new Date()
      },
    });

    // Actualizar rating promedio del restaurante
    if (order.restaurantId) {
      const allReviews = await prisma.review.findMany({
        where: {
          order: {
            restaurantId: order.restaurantId
          }
        }
      });
      
      const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      
      await prisma.restaurant.update({
        where: { id: order.restaurantId },
        data: {
          averageRating,
          totalReviews: allReviews.length
        }
      });
    }

    // Si la orden tiene sesión activa, verificar si todas las órdenes están completadas
    if (order.sessionId && order.session) {
      const sessionOrders = order.session.orders;
      const allCompleted = sessionOrders.every(o => 
        o.id === orderId || // Esta orden que acabamos de completar
        o.status === 'COMPLETADA' || 
        o.status === 'PAGADA' ||
        o.status === 'CANCELADA'
      );

      if (allCompleted) {
        // Cerrar la sesión
        await prisma.tableSession.update({
          where: { id: order.sessionId },
          data: {
            active: false,
            closedAt: new Date()
          }
        });

        // Liberar la mesa
        if (order.tableId) {
          await prisma.table.update({
            where: { id: order.tableId },
            data: { available: true },
          });
        }

        return NextResponse.json({ 
          success: true,
          review,
          message: 'Reseña guardada y mesa liberada automáticamente',
          tableLifted: true
        });
      }
    }

    return NextResponse.json({ 
      success: true,
      review,
      message: 'Reseña guardada exitosamente',
      tableLifted: false
    });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Error al crear la reseña' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        order: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Error al obtener las reseñas' },
      { status: 500 }
    );
  }
}
