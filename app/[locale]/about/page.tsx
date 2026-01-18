"use client";

import { SessionProvider } from "next-auth/react";
import NavBar from "@/components/NavBar";
import en from "@/i18n/en.json";
import es from "@/i18n/es.json";
import { useParams } from "next/navigation";

export default function AboutPage() {

  const params = useParams();
const locale = params?.locale || "en";
const t = locale === "es" ? es : en;

  return (
    <>  <SessionProvider>
      <NavBar />
      <main className="p-8 bg-gray-50 text-center space-y-8 pt-20">
        <h1 className="text-4xl font-bold">{t.aboutpage.title}</h1>

        <section className="max-w-3xl mx-auto text-gray-700 leading-relaxed space-y-4">
          <p>
           {t.aboutpage.p1}
          </p>

          <p>
            {t.aboutpage.p2}
          </p>

          <p>
            {t.aboutpage.p3}
          </p>
        </section>

        <p className="text-gray-500 text-sm mt-8">
          {t.aboutpage.footer}
        </p>
      </main>
        </SessionProvider>
    </>
  );
}
