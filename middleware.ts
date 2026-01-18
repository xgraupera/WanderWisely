// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: [
    "/(en|es)?/dashboard/:path*",
    "/(en|es)?/trips/:path*",
    "/(en|es)?/profile/:path*",
    "/(en|es)?/settings/:path*",
  ],
};

export default withAuth(
  function middleware(req: NextRequest) {
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
      // 🔁 Si NO hay sesión → landing
      signIn: "/",
    },
  }
);
