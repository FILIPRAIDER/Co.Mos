import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper para obtener el restaurante (por ahora hardcoded, después por subdomain/slug)
async function getCurrentRestaurant() {
  // Por ahora retornamos el primer restaurante (solo hay uno)
  const restaurant = await prisma.restaurant.findFirst();
  if (!restaurant) {
    throw new Error('No se encontró ningún restaurante');
  }
  return restaurant;
}

export async function GET() {
  try {
    const restaurant = await getCurrentRestaurant();

    const tables = await prisma.table.findMany({
      where: {
        restaurantId: restaurant.id,
      },
      include: {
        sessions: {
          where: { active: true },
          include: {
            orders: {
              select: {
                id: true,
                status: true,
                total: true,
              },
            },
          },
        },
      },
      orderBy: {
        number: 'asc',
      },
    });

    return NextResponse.json(tables);
  } catch (error) {
    console.error('Error fetching tables:', error);
    return NextResponse.json(
      { error: 'Error al obtener las mesas' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const restaurant = await getCurrentRestaurant();
    const body = await request.json();
    const { number, capacity } = body;

    if (!number) {
      return NextResponse.json(
        { error: 'El número de mesa es requerido' },
        { status: 400 }
      );
    }

    // Verificar que no exista una mesa con ese número en el restaurante
    const existingTable = await prisma.table.findFirst({
      where: {
        restaurantId: restaurant.id,
        number: parseInt(number),
      },
    });

    if (existingTable) {
      return NextResponse.json(
        { error: 'Ya existe una mesa con ese número' },
        { status: 409 }
      );
    }

    // Generar código QR único
    const crypto = await import('crypto');
    const QRCode = await import('qrcode');
    const randomHash = crypto.randomBytes(4).toString('hex');
    const qrCode = `${restaurant.slug}-mesa-${number}-${randomHash}`;

    // Generar imagen QR
    const qrDataUrl = await QRCode.toDataURL(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/scan/${qrCode}`,
      { width: 512, margin: 2 }
    );

    const table = await prisma.table.create({
      data: {
        number: parseInt(number),
        capacity: capacity || 4,
        available: true,
        qrCode,
        qrImageUrl: qrDataUrl,
        restaurantId: restaurant.id,
      },
    });

    return NextResponse.json({ success: true, table });
  } catch (error) {
    console.error('Error creating table:', error);
    return NextResponse.json(
      { error: 'Error al crear la mesa' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, available } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'El ID de la mesa es requerido' },
        { status: 400 }
      );
    }

    const table = await prisma.table.update({
      where: { id },
      data: { available },
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
