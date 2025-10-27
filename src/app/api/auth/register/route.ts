import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

// Helper function to get current restaurant
async function getCurrentRestaurant() {
  const restaurant = await prisma.restaurant.findFirst();
  if (!restaurant) {
    throw new Error('No se encontró ningún restaurante');
  }
  return restaurant;
}

export async function POST(req: Request) {
  try {
    const { 
      name, 
      email, 
      document, 
      password, 
      role,
      restaurantName,
      restaurantDescription,
      restaurantCategory,
      restaurantAddress,
      restaurantPhone,
      restaurantLogoUrl
    } = await req.json();

    if (!name || !document || !password) {
      return NextResponse.json({ message: "Datos incompletos" }, { status: 400 });
    }

    // Validar que el rol sea válido
    if (!["ADMIN", "MESERO", "COCINERO"].includes(role)) {
      return NextResponse.json({ message: "Rol inválido" }, { status: 400 });
    }

    // Si es ADMIN, el email es requerido
    if (role === "ADMIN" && !email) {
      return NextResponse.json({ message: "El email es requerido para administradores" }, { status: 400 });
    }

    // Si es ADMIN, el nombre del restaurante es requerido
    if (role === "ADMIN" && !restaurantName) {
      return NextResponse.json({ message: "El nombre del restaurante es requerido" }, { status: 400 });
    }

    const exists = await prisma.user.findFirst({
      where: { 
        OR: [
          { document },
          ...(email ? [{ email }] : [])
        ] 
      },
    });
    if (exists) {
      return NextResponse.json({ message: "Usuario ya existe con esa cédula o email" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let restaurant;

    // Si es ADMIN, crear un nuevo restaurante
    if (role === "ADMIN") {
      const slug = restaurantName.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      // Verificar que el slug sea único
      let finalSlug = slug;
      let counter = 1;
      while (await prisma.restaurant.findUnique({ where: { slug: finalSlug } })) {
        finalSlug = `${slug}-${counter}`;
        counter++;
      }

      restaurant = await prisma.restaurant.create({
        data: {
          name: restaurantName,
          slug: finalSlug,
          description: restaurantDescription || null,
          category: restaurantCategory || null,
          address: restaurantAddress || null,
          phone: restaurantPhone || null,
          email: email,
          logoUrl: restaurantLogoUrl || null,
        },
      });
    } else {
      // Para otros roles, obtener el restaurante actual
      restaurant = await getCurrentRestaurant();
    }

    const user = await prisma.user.create({
      data: {
        name,
        email: email || null,
        document,
        passwordHash,
        role,
        restaurantId: restaurant.id,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
