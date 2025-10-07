import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tables = await prisma.table.findMany({
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
    const body = await request.json();
    const { number, capacity } = body;

    if (!number) {
      return NextResponse.json(
        { error: 'El número de mesa es requerido' },
        { status: 400 }
      );
    }

    const table = await prisma.table.create({
      data: {
        number,
        capacity: capacity || 4,
        available: true,
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
