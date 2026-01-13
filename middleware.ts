// middleware.ts
import { withAuth } from "next-auth/middleware";

// Configuración de rutas protegidas
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/trips/:path*",
    "/profile/:path*",
    "/settings/:path*",
  ],
};

// Exporta withAuth directamente como middleware
export default withAuth({
  // Opcional: página a la que redirigir si no está autenticado
  pages: {
    signIn: "/login",
  },
});
