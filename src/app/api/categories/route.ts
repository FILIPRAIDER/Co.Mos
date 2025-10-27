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

    // Si no hay restaurantId, devolver array vacío en lugar de error
    if (!restaurantId) {
      console.log('⚠️ No restaurantId disponible en GET /api/categories');
      return NextResponse.json([]);
    }
    
    const categories = await prisma.category.findMany({
      where: {
        restaurantId: restaurantId,
      },
      orderBy: {
        order: 'asc',
      },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    // Devolver array vacío en lugar de objeto con error
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const restaurant = await getCurrentRestaurant();
    const body = await req.json();
    const { name, description, imageUrl, order } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        imageUrl,
        order: order || 0,
        restaurantId: restaurant.id,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Error al crear categoría' },
      { status: 500 }
    );
  }
}
