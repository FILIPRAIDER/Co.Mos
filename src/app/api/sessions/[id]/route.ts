import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { active } = body;

    if (typeof active !== 'boolean') {
      return NextResponse.json(
        { error: 'El estado activo es requerido' },
        { status: 400 }
      );
    }

    // Si se está cerrando la sesión, liberar la mesa
    if (!active) {
      const session = await prisma.tableSession.findUnique({
        where: { id },
        include: { table: true }
      });

      if (session) {
        // Actualizar todas las órdenes de la sesión a COMPLETADA
        await prisma.order.updateMany({
          where: { sessionId: id },
          data: { status: 'COMPLETADA' }
        });

        // Cerrar la sesión y liberar la mesa
        await prisma.$transaction([
          prisma.tableSession.update({
            where: { id },
            data: { active: false }
          }),
          prisma.table.update({
            where: { id: session.tableId },
            data: { available: true }
          })
        ]);

        return NextResponse.json({ 
          success: true, 
          message: 'Sesión cerrada y mesa liberada' 
        });
      }
    }

    // Si se está activando la sesión, marcar mesa como ocupada
    const session = await prisma.tableSession.update({
      where: { id },
      data: { active },
      include: {
        table: true,
        orders: {
          orderBy: { createdAt: 'desc' }
        }
      },
    });

    if (active) {
      await prisma.table.update({
        where: { id: session.tableId },
        data: { available: false }
      });
    }

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la sesión' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await prisma.tableSession.findUnique({
      where: { id },
      include: {
        table: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        }
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Error al obtener la sesión' },
      { status: 500 }
    );
  }
}
