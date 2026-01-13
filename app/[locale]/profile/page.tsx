"use client"; // Esto es clave

import { SessionProvider } from "next-auth/react";
import ProfileContent from "./profilecontent";

export default function ProfilePage() {
  return (
    <SessionProvider>
      <ProfileContent />
    </SessionProvider>
  );
}
