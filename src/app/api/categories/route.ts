import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper function to get current restaurant
async function getCurrentRestaurant() {
  const restaurant = await prisma.restaurant.findFirst();
  if (!restaurant) {
    throw new Error('No se encontró ningún restaurante');
  }
  return restaurant;
}

export async function GET() {
  try {
    const restaurant = await getCurrentRestaurant();
    
    const categories = await prisma.category.findMany({
      where: {
        restaurantId: restaurant.id,
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
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Error al obtener categorías' },
      { status: 500 }
    );
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
