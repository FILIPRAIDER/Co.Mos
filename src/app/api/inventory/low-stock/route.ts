import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import type { InventoryItem } from "@prisma/client";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Get items where quantity <= minStock
    const lowStockItems = await prisma.inventoryItem.findMany({
      where: {
        AND: [
          {
            minStock: {
              not: null,
            },
          },
          {
            OR: [
              {
                quantity: {
                  lte: prisma.inventoryItem.fields.minStock,
                },
              },
            ],
          },
        ],
      },
      orderBy: {
        quantity: "asc",
      },
    });

    // Filter in JavaScript since Prisma doesn't support column comparison in where clause
    const filteredItems = lowStockItems.filter(
      (item: InventoryItem) => item.minStock !== null && item.quantity <= item.minStock
    );

    return NextResponse.json({
      count: filteredItems.length,
      items: filteredItems,
    });
  } catch (error) {
    console.error("Error fetching low stock items:", error);
    return NextResponse.json(
      { error: "Error al obtener artículos con stock bajo" },
      { status: 500 }
    );
  }
}
