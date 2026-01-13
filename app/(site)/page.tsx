import { redirect } from "next/navigation";

export default function RootRedirect() {
  // Detectar idioma del navegador si quieres usarlo:
  let userLang: string | null = null;

  if (typeof navigator !== "undefined") {
    userLang = navigator.language || navigator.languages[0];
  }

  // Solo soportamos "en" y "es"
  const lang = userLang?.startsWith("es") ? "es" : "en";

  // Redirigir a la ruta con el idioma
  redirect(`/${lang}`);
}