// types/hooks/useSession.ts
import { useSession as useNextAuthSession } from "next-auth/react";
import type { Session as NextAuthSession } from "next-auth";

export function useSession() {
  const result = useNextAuthSession();

  return result as {
    data: (NextAuthSession & { user: { isPremium: boolean } }) | null;
    status: "loading" | "authenticated" | "unauthenticated";
  };
}
