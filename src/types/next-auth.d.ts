import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      role?: "CLIENT" | "WORKER" | "ADMIN";
      document?: string;
    };
  }
}
