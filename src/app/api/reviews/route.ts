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
      include: { table: true },
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

    // Si la orden tiene mesa asignada, liberarla
    if (order.tableId) {
      await prisma.table.update({
        where: { id: order.tableId },
        data: { available: true },
      });
    }

    // Actualizar estado de la orden a PAGADA (completada)
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'PAGADA' },
    });

    return NextResponse.json({ 
      success: true,
      review,
      message: order.tableId ? 'Mesa liberada exitosamente' : 'Reseña guardada'
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
