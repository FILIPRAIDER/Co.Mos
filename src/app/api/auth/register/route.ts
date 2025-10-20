import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

// Helper function to get current restaurant
async function getCurrentRestaurant() {
  const restaurant = await prisma.restaurant.findFirst();
  if (!restaurant) {
    throw new Error('No se encontró ningún restaurante');
  }
  return restaurant;
}

export async function POST(req: Request) {
  try {
    const { name, email, document, password, role } = await req.json();

    if (!name || !document || !password) {
      return NextResponse.json({ message: "Datos incompletos" }, { status: 400 });
    }

    // Validar que el rol sea válido
    if (!["ADMIN", "MESERO", "COCINERO"].includes(role)) {
      return NextResponse.json({ message: "Rol inválido" }, { status: 400 });
    }

    // Si es ADMIN, el email es requerido
    if (role === "ADMIN" && !email) {
      return NextResponse.json({ message: "El email es requerido para administradores" }, { status: 400 });
    }

    const exists = await prisma.user.findFirst({
      where: { 
        OR: [
          { document },
          ...(email ? [{ email }] : [])
        ] 
      },
    });
    if (exists) {
      return NextResponse.json({ message: "Usuario ya existe con esa cédula o email" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Obtener el restaurante actual
    const restaurant = await getCurrentRestaurant();

    const user = await prisma.user.create({
      data: {
        name,
        email: email || null,
        document,
        passwordHash,
        role,
        restaurantId: restaurant.id,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
