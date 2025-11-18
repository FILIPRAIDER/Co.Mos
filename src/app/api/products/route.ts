import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentRestaurant } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  try {
    // Intentar obtener el restaurante desde la sesión (para usuarios autenticados)
    let restaurantId: string | null = null;
    
    try {
      const restaurant = await getCurrentRestaurant();
      restaurantId = restaurant.id;
    } catch {
      // Si falla, intentar obtener desde el query parameter (para usuarios públicos)
      const { searchParams } = new URL(request.url);
      restaurantId = searchParams.get('restaurantId');
    }

    // Si no hay restaurantId, retornar error apropiado
    if (!restaurantId) {
      console.error('⚠️ No restaurantId disponible en GET /api/products - Usuario debe tener restaurante asignado');
      return NextResponse.json(
        { error: 'Usuario no tiene restaurante asignado. Contacta al administrador.' },
        { status: 403 }
      );
    }

    const products = await prisma.product.findMany({
      where: {
        restaurantId: restaurantId,
      },
      include: {
        categoryRef: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    // Devolver array vacío en lugar de objeto con error
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const restaurant = await getCurrentRestaurant();
    const body = await request.json();
    const { name, description, price, categoryId, imageUrl, available } = body;

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
        categoryId: categoryId || null,
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
