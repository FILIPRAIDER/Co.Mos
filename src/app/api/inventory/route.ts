import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Filter by restaurantId when multi-tenant is fully implemented
    const items = await prisma.inventoryItem.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Error al obtener inventario" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, sku, quantity, unit, minStock, cost } = body;

    if (!name) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }

    // TODO: Get restaurantId from session
    const restaurantId = "cm3l15x0p0000z5mkz6ub6rvr"; // Hardcoded for now

    const item = await prisma.inventoryItem.create({
      data: {
        name,
        sku: sku || null,
        quantity: parseFloat(quantity) || 0,
        unit: unit || "unidad",
        minStock: minStock ? parseFloat(minStock) : null,
        cost: cost ? parseFloat(cost) : null,
        restaurantId,
      },
    });

    return NextResponse.json(item);
  } catch (error: any) {
    console.error("Error creating inventory item:", error);
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un artículo con ese SKU" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Error al crear artículo" },
      { status: 500 }
    );
  }
}
