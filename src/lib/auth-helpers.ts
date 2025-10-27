import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/auth.config";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      restaurant: true,
    },
  });

  return user;
}

export async function getCurrentRestaurant() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  if (!user.restaurantId || !user.restaurant) {
    throw new Error('El usuario no está asociado a ningún restaurante');
  }

  return user.restaurant!;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('No autenticado');
  }
  
  return user;
}

export async function requireRestaurant() {
  const restaurant = await getCurrentRestaurant();
  return restaurant;
}
