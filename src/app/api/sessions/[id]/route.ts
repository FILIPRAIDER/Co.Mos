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
        include: { 
          table: true,
          orders: {
            include: {
              items: {
                include: {
                  product: true
                }
              }
            }
          }
        }
      });

      if (session) {
        // Calcular totales de la factura
        let subtotal = 0;
        let tax = 0;
        const items: any[] = [];

        session.orders.forEach(order => {
          order.items.forEach(item => {
            subtotal += item.price * item.quantity;
            items.push({
              name: item.product.name,
              quantity: item.quantity,
              price: item.price,
              total: item.price * item.quantity
            });
          });
        });

        tax = subtotal * 0.19; // 19% IVA
        const total = subtotal + tax;

        // Actualizar todas las órdenes de la sesión a COMPLETADA
        await prisma.order.updateMany({
          where: { sessionId: id },
          data: { status: 'COMPLETADA', completedAt: new Date() }
        });

        // Cerrar la sesión y liberar la mesa
        await prisma.$transaction([
          prisma.tableSession.update({
            where: { id },
            data: { 
              active: false,
              closedAt: new Date()
            }
          }),
          prisma.table.update({
            where: { id: session.tableId },
            data: { available: true }
          })
        ]);

        // Devolver información de la factura
        return NextResponse.json({ 
          success: true, 
          message: 'Sesión cerrada y mesa liberada',
          invoice: {
            sessionId: session.id,
            tableNumber: session.table.number,
            customerName: session.customerName || 'Cliente',
            items,
            subtotal,
            tax,
            total,
            date: new Date().toISOString(),
            orderNumbers: session.orders.map(o => o.orderNumber)
          }
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
