import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/login" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        identifier: { label: "Cédula o Email", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null;

        // Buscar por cédula o email
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { document: credentials.identifier },
              { email: credentials.identifier },
            ],
          },
        });
        
        if (!user) return null;

        // Verificar si el usuario está activo
        if (!user.active) {
          throw new Error("Usuario desactivado");
        }

        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email ?? undefined,
          role: user.role,
          document: user.document,
          mustChangePassword: user.mustChangePassword,
          restaurantId: user.restaurantId,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.document = (user as any).document;
        token.mustChangePassword = (user as any).mustChangePassword;
        token.restaurantId = (user as any).restaurantId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).document = token.document;
        (session.user as any).mustChangePassword = token.mustChangePassword;
        (session.user as any).restaurantId = token.restaurantId;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Si viene de /auth/login y es worker/admin, mandamos a /dashboard
      try {
        const u = new URL(url, baseUrl);
        if (u.pathname === "/") return baseUrl;
      } catch {}
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
};
