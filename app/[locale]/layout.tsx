import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import type { ReactNode } from "react";
import FooterBar from "@/components/FooterBar";
import NavBar from "@/components/NavBar";
import { SpeedInsights } from '@vercel/speed-insights/next';

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const supportedLocales = ["en", "es"];

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!supportedLocales.includes(locale)) {
    throw new Error("Invalid locale");
  }

 return (
    <html lang={locale}>
      <body className={`${poppins.className} bg-[#F9F8F4] text-[#001e42] font-sans`}>
        
        {children}
        <FooterBar />
        <SpeedInsights />
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  metadataBase: new URL("https://tripilot.app"),

  title: "Tripilot - Your Smart Travel Planner",
  description:
    "Organiza itinerarios, presupuestos, reservas, checklist y gastos en un solo lugar. Planifica tus viajes sin caos.",
  keywords: [
    "travel planner",
    "trip planner",
    "itinerary builder",
    "travel budget",
    "Tripilot app"
  ],

  openGraph: {
    title: "Tripilot - Travel Planner",
    description:
      "Planifica tus viajes con itinerarios, presupuestos y reservas centralizadas.",
    images: ["/dashboard.png"],
    type: "website",
    url: "https://tripilot.app",
  },

  twitter: {
    card: "summary_large_image",
    title: "Tripilot - Travel Planner",
    description:
      "Planifica tus viajes con itinerarios, presupuestos y reservas centralizadas.",
    images: ["/dashboard.png"],
  },

  icons: {
    icon: "/favicon.ico",
    apple: "/icon_blue.png",
  },
};




