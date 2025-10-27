import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentRestaurant } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const restaurant = await getCurrentRestaurant();

    const products = await prisma.product.findMany({
      where: {
        restaurantId: restaurant.id,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Error al obtener productos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const restaurant = await getCurrentRestaurant();
    const body = await request.json();
    const { name, description, price, category, imageUrl, available } = body;

    if (!name || !price) {
      return NextResponse.json(
        { error: 'Nombre y precio son requeridos' },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        category: category || "PLATO_PRINCIPAL",
        imageUrl,
        available: available !== undefined ? available : true,
        restaurantId: restaurant.id,
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Error al crear producto' },
      { status: 500 }
    );
  }
}
