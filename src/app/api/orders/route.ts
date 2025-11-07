import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentRestaurant } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  try {
    // Leer el body solo una vez
    const body = await request.json();
    const { sessionCode, tableId, items, customerName, type, notes } = body;

    // Intentar obtener restaurante desde sesión o desde body
    let restaurantId: string | null = null;
    
    try {
      const restaurant = await getCurrentRestaurant();
      restaurantId = restaurant.id;
    } catch {
      // Si no está autenticado, obtener desde sessionCode o tableId
      if (sessionCode) {
        const session = await prisma.tableSession.findUnique({
          where: { sessionCode },
          include: { table: { include: { restaurant: true } } }
        });
        if (session) {
          restaurantId = session.table.restaurantId;
        }
      } else if (tableId) {
        const table = await prisma.table.findUnique({
          where: { id: tableId },
          include: { restaurant: true }
        });
        if (table) {
          restaurantId = table.restaurantId;
        }
      }
    }

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'No se pudo identificar el restaurante' },
        { status: 400 }
      );
    }

    // Obtener datos del restaurante
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurante no encontrado' },
        { status: 404 }
      );
    }

    console.log('📝 Creando orden:', { sessionCode, tableId, itemsCount: items?.length, type });

    // Validaciones
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'El carrito está vacío' },
        { status: 400 }
      );
    }

    // Buscar sesión activa por sessionCode o tableId
    let session;
    if (sessionCode) {
      session = await prisma.tableSession.findUnique({
        where: { sessionCode },
        include: { table: true }
      });
    } else if (tableId) {
      // Primero verificar que la mesa existe
      const table = await prisma.table.findUnique({
        where: { id: tableId }
      });
      
      if (!table) {
        return NextResponse.json(
          { error: 'Mesa no encontrada' },
          { status: 404 }
        );
      }
      
      // Buscar sesión activa por tableId
      session = await prisma.tableSession.findFirst({
        where: { 
          tableId: tableId,
          active: true 
        },
        include: { table: true },
        orderBy: { createdAt: 'desc' }
      });
      
      // Si no hay sesión activa, crear una nueva
      if (!session) {
        const crypto = await import('crypto');
        const newSessionCode = crypto.randomBytes(3).toString('hex').toUpperCase();
        
        session = await prisma.tableSession.create({
          data: {
            tableId: tableId,
            sessionCode: newSessionCode,
            active: true,
          },
          include: { table: true }
        });
        
        // Marcar mesa como ocupada
        await prisma.table.update({
          where: { id: tableId },
          data: { available: false },
        });
      }
    } else {
      return NextResponse.json(
        { error: 'Se requiere sessionCode o tableId' },
        { status: 400 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { error: 'No se pudo crear o encontrar la sesión' },
        { status: 400 }
      );
    }

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

    // Crear la orden con transacción para evitar duplicados
    // Usar timestamp + random para garantizar unicidad
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const uniqueOrderNumber = `ORD-${timestamp}-${random}`;

    const order = await prisma.order.create({
      data: {
        orderNumber: uniqueOrderNumber,
        restaurantId: restaurant.id,
        tableId: session.tableId,
        sessionId: session.id,
        customerName: customerName || session.customerName || 'Cliente',
        type: type || 'COMER_AQUI',
        status: 'PENDIENTE',
        notes: notes || null,
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
    const { searchParams } = new URL(request.url);
    const sessionCode = searchParams.get('sessionCode');
    const status = searchParams.get('status');
    const tableId = searchParams.get('tableId');
    
    // Intentar obtener restaurante desde sesión o desde query params
    let restaurantId: string | null = null;
    
    try {
      const restaurant = await getCurrentRestaurant();
      restaurantId = restaurant.id;
    } catch {
      // Si no está autenticado, obtener desde sessionCode o tableId
      if (sessionCode) {
        const session = await prisma.tableSession.findUnique({
          where: { sessionCode },
          include: { table: true }
        });
        if (session) {
          restaurantId = session.table.restaurantId;
        }
      } else if (tableId) {
        const table = await prisma.table.findUnique({
          where: { id: tableId }
        });
        if (table) {
          restaurantId = table.restaurantId;
        }
      }
    }

    if (!restaurantId) {
      console.log('⚠️ No restaurantId disponible en GET /api/orders');
      return NextResponse.json([]);
    }

    const where: any = {
      restaurantId: restaurantId,
    };

    if (sessionCode) {
      const session = await prisma.tableSession.findUnique({
        where: { sessionCode }
      });
      if (session) {
        where.sessionId = session.id;
      }
    }

    // Si status es "active", buscar pedidos en estado activo (no entregados ni cancelados)
    if (status === 'active') {
      where.status = {
        notIn: ['ENTREGADA', 'COMPLETADA', 'PAGADA', 'CANCELADA']
      };
    } else if (status) {
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
    console.error('❌ Error fetching orders:', error);
    return NextResponse.json([]);
  }
}
