import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { qrCode } = await request.json();

    if (!qrCode) {
      return NextResponse.json(
        { error: 'Código QR requerido' },
        { status: 400 }
      );
    }

    // Buscar mesa por QR code
    const table = await prisma.table.findUnique({
      where: { qrCode },
      include: {
        sessions: {
          where: { active: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!table) {
      return NextResponse.json(
        { error: 'Mesa no encontrada' },
        { status: 404 }
      );
    }

    // Si hay sesión activa, retornarla
    if (table.sessions.length > 0) {
      const activeSession = table.sessions[0];
      return NextResponse.json({
        sessionCode: activeSession.sessionCode,
        tableNumber: table.number,
        tableId: table.id,
        existing: true,
      });
    }

    // Si no hay sesión activa, crear nueva
    const sessionCode = crypto.randomBytes(3).toString('hex').toUpperCase(); // Ej: "A3F2B1"

    const newSession = await prisma.tableSession.create({
      data: {
        tableId: table.id,
        sessionCode,
        active: true,
      },
    });

    // Marcar mesa como ocupada
    await prisma.table.update({
      where: { id: table.id },
      data: { available: false },
    });

    return NextResponse.json({
      sessionCode: newSession.sessionCode,
      tableNumber: table.number,
      tableId: table.id,
      existing: false,
    });
  } catch (error) {
    console.error('Error en /api/scan:', error);
    return NextResponse.json(
      { error: 'Error al procesar el código QR' },
      { status: 500 }
    );
  }
}
