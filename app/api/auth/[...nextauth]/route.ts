// app/api/auth/[...nextauth]/route.ts
export const runtime = "nodejs";

import NextAuth, { NextAuthOptions } from "next-auth";
import type { Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();




export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error("Missing credentials");
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });
        if (!user) {
          throw new Error("User not found");
        }
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Invalid password");
        }
        return {
  id: Number(user.id),
  email: user.email,
  name: user.name || "",
  isPremium: user.isPremium, // 👈 CLAVE
};
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30, // 30 dias en segundos
  updateAge: 60 * 60 * 24, // renueva cada 24h si hay actividad
  },
   cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  
  callbacks: {
  async jwt({ token, user }) {
    // Cuando el usuario hace login, guardamos su id en el JWT
    if (user) {
      token.id = Number(user.id);    // 👈 guarda el id real en el JWT
      token.isPremium = user.isPremium; 
    }
    return token;
  },

  async session({ session, token }) {
  if (session.user) {
    session.user.id = token.id as number;

    (session.user as typeof session.user & {
      isPremium: boolean;
    }).isPremium = Boolean(token.isPremium);
  }
  return session;
},



},
  secret: process.env.NEXTAUTH_SECRET
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
