import type { ReactNode } from "react";
import { Poppins } from "next/font/google";
import FooterBar from "@/components/FooterBar";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { supportedLocales } from "@/i18n/locales";
import { notFound } from "next/navigation";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!supportedLocales.includes(locale)) {
    notFound();
  }
  return (
    <div className={`${poppins.className} flex flex-col min-h-screen`}>
      <main
        className="
          flex-1
          bg-gray-50
          pt-[env(safe-area-inset-top)]
          pb-[env(safe-area-inset-bottom)]
          pb-20
        "
      >
        {children}
      </main>

      <FooterBar />
      <SpeedInsights />
    </div>
  );
}
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title:
      locale === "es"
        ? "Tripilot - Planificador de viajes"
        : "Tripilot - Travel Planner",
  };
}