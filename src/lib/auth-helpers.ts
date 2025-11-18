import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/auth.config";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    console.error('❌ getCurrentUser: No hay sesión');
    return null;
  }

  // Buscar por document (siempre presente) en lugar de email (opcional)
  const document = (session.user as any).document;
  
  console.log('🔍 getCurrentUser - Document desde sesión:', document);
  console.log('🔍 getCurrentUser - Session user:', JSON.stringify(session.user));
  
  if (!document) {
    console.error('❌ getCurrentUser: No hay document en la sesión');
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { document },
    include: {
      restaurant: true,
    },
  });
  
  if (user) {
    console.log('✅ getCurrentUser: Usuario encontrado:', user.name, 'RestaurantId:', user.restaurantId);
  } else {
    console.error('❌ getCurrentUser: Usuario NO encontrado para document:', document);
  }

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
