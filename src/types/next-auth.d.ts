import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      role?: "CLIENTE" | "MESERO" | "COCINERO" | "ADMIN";
      document?: string;
      mustChangePassword?: boolean;
      restaurantId?: string;
    };
  }

  interface User {
    name?: string | null;
    email?: string | null;
    role?: "CLIENTE" | "MESERO" | "COCINERO" | "ADMIN";
    document?: string;
    mustChangePassword?: boolean;
    restaurantId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "CLIENTE" | "MESERO" | "COCINERO" | "ADMIN";
    document?: string;
    mustChangePassword?: boolean;
    restaurantId?: string;
  }
}
