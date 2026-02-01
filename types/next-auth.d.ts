import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      isPremium: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: number;
    isPremium: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: number;
    isPremium: boolean;
  }
}

export {}; // 🔴 ESTO ES OBLIGATORIO
