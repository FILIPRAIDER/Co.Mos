import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { Resend } from "resend";
import { render } from "@react-email/render";
import WelcomeEmail from "@/emails/WelcomeEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

// GET - List all users (ADMIN only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Get current user with restaurantId
    const currentUser = await prisma.user.findUnique({
      where: { document: session.user.document },
      select: { restaurantId: true },
    });

    if (!currentUser?.restaurantId) {
      return NextResponse.json({ error: "Usuario sin restaurante asignado" }, { status: 400 });
    }

    // Get users from the same restaurant
    const users = await prisma.user.findMany({
      where: {
        restaurantId: currentUser.restaurantId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        document: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 }
    );
  }
}

// POST - Create new user (ADMIN only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, document, role, sendEmail } = body;

    // Validate required fields
    if (!name || !document || !role) {
      return NextResponse.json(
        { error: "Nombre, cédula y rol son requeridos" },
        { status: 400 }
      );
    }

    // Validate role
    if (!["ADMIN", "MESERO", "COCINERO"].includes(role)) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
    }

    // Get current user with restaurantId
    const currentUser = await prisma.user.findUnique({
      where: { document: session.user.document },
      select: { restaurantId: true },
    });

    if (!currentUser?.restaurantId) {
      return NextResponse.json({ error: "Usuario sin restaurante asignado" }, { status: 400 });
    }

    // Check if document already exists
    const existingUser = await prisma.user.findUnique({
      where: { document },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe un usuario con esta cédula" },
        { status: 400 }
      );
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingEmail) {
        return NextResponse.json(
          { error: "Ya existe un usuario con este email" },
          { status: 400 }
        );
      }
    }

    // Generate a random password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Create user with restaurantId
    const newUser = await prisma.user.create({
      data: {
        name,
        email: email || null,
        document,
        passwordHash,
        role,
        restaurantId: currentUser.restaurantId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        document: true,
        role: true,
        createdAt: true,
      },
    });

    // Get restaurant name
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: currentUser.restaurantId },
    });
    const restaurantName = restaurant?.name || "co.mos";

    // Send email if requested and email is provided
    let emailSent = false;
    if (sendEmail && email) {
      try {
        const emailHtml = await render(
          WelcomeEmail({
            userName: name,
            userEmail: email,
            userDocument: document,
            userPassword: tempPassword,
            userRole: role,
            restaurantName,
            loginUrl: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/login`,
          })
        );

        await resend.emails.send({
          from: `${restaurantName} <onboarding@equipos.online>`,
          to: email,
          subject: `Bienvenido a ${restaurantName} - Tus credenciales de acceso`,
          html: emailHtml,
        });

        emailSent = true;
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      user: newUser,
      tempPassword: emailSent ? undefined : tempPassword, // Only return password if email wasn't sent
      emailSent,
      message: emailSent
        ? "Usuario creado y credenciales enviadas por email"
        : "Usuario creado exitosamente",
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Error al crear usuario" },
      { status: 500 }
    );
  }
}
