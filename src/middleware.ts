import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    
    // Si el usuario debe cambiar su contraseña y no está en la página de cambio
    if (token?.mustChangePassword && pathname !== "/auth/change-password") {
      return NextResponse.redirect(new URL("/auth/change-password", req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isDashboard = req.nextUrl.pathname.startsWith("/dashboard");
        if (!isDashboard) return true;
        const role = token?.role as string | undefined;
        return role === "WORKER" || role === "ADMIN" || role === "MESERO" || role === "COCINERO";
      },
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/cocina/:path*", "/servicio/:path*", "/auth/change-password"],
};
