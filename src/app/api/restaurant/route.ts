import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth.config";
import { prisma } from "@/lib/prisma";

// GET - Get restaurant info
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Get current user with restaurantId
    const currentUser = await prisma.user.findUnique({
      where: { document: session.user.document },
      select: { restaurantId: true },
    });

    if (!currentUser?.restaurantId) {
      return NextResponse.json(
        { error: "Usuario sin restaurante asignado" },
        { status: 400 }
      );
    }

    // Get restaurant
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: currentUser.restaurantId },
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurante no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ restaurant });
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    return NextResponse.json(
      { error: "Error al obtener información del restaurante" },
      { status: 500 }
    );
  }
}

// PUT - Update restaurant info (ADMIN only)
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Get current user with restaurantId
    const currentUser = await prisma.user.findUnique({
      where: { document: session.user.document },
      select: { restaurantId: true },
    });

    if (!currentUser?.restaurantId) {
      return NextResponse.json(
        { error: "Usuario sin restaurante asignado" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, category, address, phone, logoUrl } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "El nombre del restaurante es requerido" },
        { status: 400 }
      );
    }

    // Update restaurant
    const restaurant = await prisma.restaurant.update({
      where: { id: currentUser.restaurantId },
      data: {
        name,
        description: description || null,
        category: category || null,
        address: address || null,
        phone: phone || null,
        logoUrl: logoUrl || null,
      },
    });

    return NextResponse.json({
      restaurant,
      message: "Restaurante actualizado exitosamente",
    });
  } catch (error) {
    console.error("Error updating restaurant:", error);
    return NextResponse.json(
      { error: "Error al actualizar restaurante" },
      { status: 500 }
    );
  }
}
