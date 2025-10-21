import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, sku, quantity, unit, minStock, cost } = body;

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        name: name || undefined,
        sku: sku || null,
        quantity: quantity !== undefined ? parseFloat(quantity) : undefined,
        unit: unit || undefined,
        minStock: minStock !== undefined ? (minStock ? parseFloat(minStock) : null) : undefined,
        cost: cost !== undefined ? (cost ? parseFloat(cost) : null) : undefined,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error updating inventory item:", error);
    return NextResponse.json(
      { error: "Error al actualizar artículo" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.inventoryItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    return NextResponse.json(
      { error: "Error al eliminar artículo" },
      { status: 500 }
    );
  }
}
