import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper function to get current restaurant
async function getCurrentRestaurant() {
  const restaurant = await prisma.restaurant.findFirst();
  if (!restaurant) {
    throw new Error('No se encontró ningún restaurante');
  }
  return restaurant;
}

export async function POST(request: Request) {
  try {
    const restaurant = await getCurrentRestaurant();
    const body = await request.json();
    const { sessionCode, items, customerName, type, notes } = body;

    // Validaciones
    if (!sessionCode || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Validar que la sesión existe y está activa
    const session = await prisma.tableSession.findUnique({
      where: { sessionCode },
      include: { table: true }
    });

    if (!session || !session.active) {
      return NextResponse.json(
        { error: 'Sesión no válida o inactiva' },
        { status: 400 }
      );
    }

    // Generar número de orden único
    const orderCount = await prisma.order.count({
      where: { restaurantId: restaurant.id }
    });
    const orderNumber = `ORD-${String(orderCount + 1).padStart(6, '0')}`;

    // Calcular totales
    let subtotal = 0;
    const itemsWithDetails = await Promise.all(
      items.map(async (item: any) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId }
        });
        if (!product) {
          throw new Error(`Producto ${item.productId} no encontrado`);
        }
        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;
        return {
          productId: item.productId,
          quantity: item.quantity,
          price: product.price,
          notes: item.notes || null,
        };
      })
    );

    const tax = subtotal * restaurant.taxRate;
    const total = subtotal + tax;

    // Crear la orden
    const order = await prisma.order.create({
      data: {
        orderNumber,
        restaurantId: restaurant.id,
        tableId: session.tableId,
        sessionId: session.id,
        customerName: customerName || session.customerName || 'Cliente',
        type: type || 'COMER_AQUI',
        status: 'PENDIENTE',
        notes,
        subtotal,
        tax,
        total,
        items: {
          create: itemsWithDetails,
        },
      },
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

    return NextResponse.json({ 
      success: true,
      order 
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear la orden' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const restaurant = await getCurrentRestaurant();
    const { searchParams } = new URL(request.url);
    const sessionCode = searchParams.get('sessionCode');
    const status = searchParams.get('status');
    const tableId = searchParams.get('tableId');

    const where: any = {
      restaurantId: restaurant.id,
    };

    if (sessionCode) {
      const session = await prisma.tableSession.findUnique({
        where: { sessionCode }
      });
      if (session) {
        where.sessionId = session.id;
      }
    }

    if (status) {
      where.status = status;
    }

    if (tableId) {
      where.tableId = tableId;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        table: true,
        session: true,
        user: {
          select: {
            name: true,
            role: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Error al obtener las órdenes' },
      { status: 500 }
    );
  }
}
