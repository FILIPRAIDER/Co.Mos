import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { available, action } = body;

    // Si es una acción de levantar mesa
    if (action === 'lift') {
      // 1. Buscar todas las órdenes activas de la mesa
      const activeSessions = await prisma.tableSession.findMany({
        where: {
          tableId: id,
          active: true
        },
        include: {
          orders: {
            where: {
              status: {
                notIn: ['COMPLETADA', 'PAGADA', 'CANCELADA']
              }
            }
          }
        }
      });

      // 2. Completar todas las órdenes en estado "ENTREGADA" (cliente comiendo)
      for (const session of activeSessions) {
        for (const order of session.orders) {
          if (order.status === 'ENTREGADA') {
            await prisma.order.update({
              where: { id: order.id },
              data: { 
                status: 'COMPLETADA',
                completedAt: new Date()
              }
            });
          }
        }
      }

      // 3. Cerrar todas las sesiones activas
      await prisma.tableSession.updateMany({
        where: {
          tableId: id,
          active: true
        },
        data: {
          active: false,
          closedAt: new Date()
        }
      });

      // 4. Marcar mesa como disponible
      const table = await prisma.table.update({
        where: { id },
        data: { available: true },
        include: {
          sessions: {
            where: { active: true },
            include: {
              orders: {
                orderBy: { createdAt: 'desc' }
              }
            }
          }
        },
      });

      return NextResponse.json({ success: true, table });
    }

    // Actualización normal de disponibilidad
    if (typeof available !== 'boolean') {
      return NextResponse.json(
        { error: 'El estado de disponibilidad es requerido' },
        { status: 400 }
      );
    }

    const table = await prisma.table.update({
      where: { id },
      data: { available },
      include: {
        sessions: {
          where: { active: true },
          include: {
            orders: {
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      },
    });

    return NextResponse.json({ success: true, table });
  } catch (error) {
    console.error('Error updating table:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la mesa' },
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

    const table = await prisma.table.findUnique({
      where: { id },
      include: {
        sessions: {
          where: { active: true },
          include: {
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
          }
        }
      },
    });

    if (!table) {
      return NextResponse.json(
        { error: 'Mesa no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(table);
  } catch (error) {
    console.error('Error fetching table:', error);
    return NextResponse.json(
      { error: 'Error al obtener la mesa' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar que no tenga sesiones activas
    const table = await prisma.table.findUnique({
      where: { id },
      include: {
        sessions: {
          where: { active: true }
        }
      }
    });

    if (!table) {
      return NextResponse.json(
        { error: 'Mesa no encontrada' },
        { status: 404 }
      );
    }

    if (table.sessions.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar una mesa con sesiones activas' },
        { status: 400 }
      );
    }

    await prisma.table.delete({
      where: { id }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Mesa eliminada correctamente' 
    });
  } catch (error) {
    console.error('Error deleting table:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la mesa' },
      { status: 500 }
    );
  }
}
