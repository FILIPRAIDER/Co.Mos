import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const isDashboard = req.nextUrl.pathname.startsWith("/dashboard");
      if (!isDashboard) return true;
      const role = token?.role as string | undefined;
      return role === "WORKER" || role === "ADMIN";
    },
  },
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
