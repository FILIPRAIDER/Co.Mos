import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentRestaurant } from '@/lib/auth-helpers';
import { CreateTableSchema, UpdateTableSchema } from '@/lib/validations/table.schema';
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/rate-limit';

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
          select: {
            id: true,
            sessionCode: true,
            active: true,
            customerName: true,
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

export async function POST(request: NextRequest) {
  return withRateLimit(request, 'tables:create', async () => {
    try {
      const restaurant = await getCurrentRestaurant();
      const body = await request.json();
      
      // Validación con Zod
      const validation = CreateTableSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: validation.error.issues },
          { status: 400 }
        );
      }
      
      const { number, capacity } = validation.data;

      // Verificar que no exista una mesa con ese número en el restaurante
      const existingTable = await prisma.table.findFirst({
        where: {
          restaurantId: restaurant.id,
          number: number,
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
    // Usar slug formateado correctamente
    const restaurantSlug = restaurant.slug.includes('-') ? restaurant.slug : 'co-mos';
    const qrCode = `${restaurantSlug}-mesa-${number}-${randomHash}`;

    // Detectar URL base: usar NEXTAUTH_URL si está definida, sino construir desde Railway
    const baseUrl = process.env.NEXTAUTH_URL || 
                    (process.env.RAILWAY_PUBLIC_DOMAIN 
                      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` 
                      : 'http://localhost:3000');

    console.log('🔗 Generando QR:', { baseUrl, qrCode, fullUrl: `${baseUrl}/scan/${qrCode}` });

    // Generar imagen QR
    const qrDataUrl = await QRCode.toDataURL(
      `${baseUrl}/scan/${qrCode}`,
      { width: 512, margin: 2 }
    );

      const table = await prisma.table.create({
        data: {
          number: number,
          capacity: capacity || 4,
          available: true,
          qrCode,
          qrImageUrl: qrDataUrl,
        restaurantId: restaurant.id,
      },
    });

      logger.info('Mesa creada', { tableId: table.id, number: table.number });
      return NextResponse.json({ success: true, table });
    } catch (error) {
      logger.error('Error creating table', { error: error instanceof Error ? error.message : 'Unknown' });
      return NextResponse.json(
        { error: 'Error al crear la mesa' },
        { status: 500 }
      );
    }
  });
}

export async function PATCH(request: NextRequest) {
  return withRateLimit(request, 'general', async () => {
    try {
      const body = await request.json();
      
      // Validación con Zod
      const validation = UpdateTableSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: validation.error.issues },
          { status: 400 }
        );
      }
      
      const { id, available } = validation.data;

    const table = await prisma.table.update({
      where: { id },
      data: { available },
    });

      logger.info('Mesa actualizada', { tableId: id, available });
      return NextResponse.json({ success: true, table });
    } catch (error) {
      logger.error('Error updating table', { error: error instanceof Error ? error.message : 'Unknown' });
      return NextResponse.json(
        { error: 'Error al actualizar la mesa' },
        { status: 500 }
      );
    }
  });
}
