import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { name, email, document, password, role } = await req.json();

    if (!name || !document || !password) {
      return NextResponse.json({ message: "Datos incompletos" }, { status: 400 });
    }

    const exists = await prisma.user.findFirst({
      where: { OR: [{ document }, { email: email ?? "" }] },
    });
    if (exists) {
      return NextResponse.json({ message: "Usuario ya existe" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: email ?? null,
        document,
        passwordHash,
        role: role === "ADMIN" || role === "WORKER" ? role : "CLIENT",
      },
      select: { id: true, name: true, role: true },
    });

    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
