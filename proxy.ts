// proxy.ts
import { withAuth } from "next-auth/middleware"; // <--- sigue siendo "middleware"
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Configuración de rutas protegidas
export const config = {
  matcher: [
    "/(en|es)?/dashboard/:path*",
    "/(en|es)?/trips/:path*",
    "/(en|es)?/profile/:path*",
    "/(en|es)?/settings/:path*",
  ],
};

// Exporta withAuth como Proxy
export default withAuth(
  function proxy(req: NextRequest) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // 🔐 Si hay token → acceso permitido
        return !!token;
      },
    },
    pages: {
      // 🔁 Si NO hay sesión → landing page
      signIn: "/",
    },
  }
);
