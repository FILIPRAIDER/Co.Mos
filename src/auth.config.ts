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
        document: { label: "Documento", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.document || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { document: credentials.document },
        });
        if (!user) return null;

        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email ?? undefined,
          role: user.role,
          document: user.document,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.document = (user as any).document;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).document = token.document;
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
