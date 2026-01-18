"use client";

import { useState } from "react";
import Head from "next/head";
import NavBar from "@/components/NavBar";
import FooterBar from "@/components/FooterBar";
import { signIn } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { useParams } from "next/navigation";
import en from "@/i18n/en.json";
import es from "@/i18n/es.json";

export default function HomePage() {
  const router = useRouter();
  const params = useParams();

  const pathname = usePathname();

    // Extrae el locale de la URL
  const segments = pathname?.split("/") || [];
  const locale = segments[1] === "es" ? "es" : "en";
  const t = locale === "es" ? es : en;

function withLocale(path: string) {
  if (!path.startsWith("/")) path = "/" + path;
  return `/${locale}${path}`;
}

  return (
    <>
      <Head>
        <title>
          Tripilot | Plan Smarter. Travel Freely.
        </title>
        <meta
  name="description"
  content="Tripilot is your financial copilot for longer trips. Track spending, forecast risks, and avoid budget surprises while you travel."
/>

      </Head>

    

      <main className="flex flex-col bg-gradient-to-b from-white to-[#f9f9f9]">

        {/* 🏞️ HERO SECTION */}
        <section className="flex flex-col items-center justify-center flex-grow bg-[#001e42] text-center px-6 py-20 md:px-12">
          <Image
            src="/icon.png"
            alt="Tripilot logo"
            width={120}
            height={120}
            className="mb-6"
            priority
          />
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
            {t.hero?.headline ?? "Tripilot"}
          </h1>
          
          <p className="text-lg md:text-xl text-white max-w-2xl mb-10 leading-relaxed">
            {t.hero.subheadline}  <br />
            {t.hero.subheadline2}
          </p>
         

        </section>


        <section className="py-20 text-center"> <h2 className="text-3xl font-bold text-[#001e42] mb-8"> {t.hero.buttontitle} </h2> <button onClick={() => router.push(withLocale("/login"))} className="bg-[#001e42] text-white px-10 py-4 rounded-xl text-lg hover:bg-[#DCC9A3] transition shadow-lg hover:scale-105 hover:bg-[#e6d6b3] transition" > {t.hero.cta} </button> </section>

{/* 🌟 WHY Tripilot SECTION */}
<section className="py-5 px-6 text-center">
 <h2 className="text-3xl font-bold text-[#001e42] mb-10">
  {t.why.title}
</h2>


  <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
    

    <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-xl transition flex flex-col items-center">
      <span className="text-4xl mb-4">💰</span>
      <h3 className="font-semibold text-xl mb-2">{t.why.cards.budgeting.title}</h3>
      <p className="text-gray-600 text-center">{t.why.cards.budgeting.desc}</p>
    </div>

    <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-xl transition flex flex-col items-center">
      <span className="text-4xl mb-4">📊</span>
<h3 className="font-semibold text-xl mb-2">{t.why.cards.forecast.title}</h3>
<p className="text-gray-600 text-center">
{t.why.cards.forecast.desc}
</p>

    </div>

    <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-xl transition flex flex-col items-center">

    <span className="text-4xl mb-4">⚠️</span>
<h3 className="font-semibold text-xl mb-2">{t.why.cards.warnings.title}</h3>
<p className="text-gray-600 text-center">
{t.why.cards.warnings.desc}
</p>
</div>
    <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-xl transition flex flex-col items-center">
      <span className="text-4xl mb-4">🗺️</span>
      <h3 className="font-semibold text-xl mb-2">{t.why.cards.itinerary.title}</h3>
      <p className="text-gray-600 text-center">{t.why.cards.itinerary.desc}</p>
    </div>

  </div>
</section>

 {/* 📝 HOW IT WORKS */}
        <section className="py-20 px-6 text-center">
          <div className=" mx-auto grid  gap-8 text-[#001e42]">
            <h2 className="text-3xl font-bold text-[#001e42]">
  {t.how.title}
</h2>
  <div className=" p-2 flex flex-col items-center">
    
    <h3 className="font-semibold text-xl mb-2">{t.how.steps.one.title}</h3>
    <p className="text-center">{t.how.steps.one.desc}</p>
  </div>

  <div className=" p-2 flex flex-col items-center">
    
    <h3 className="font-semibold text-xl mb-2">{t.how.steps.two.title}</h3>
    <p className="text-center">{t.how.steps.two.desc}</p>
  </div>

  <div className="p-2 flex flex-col items-center">
    
    <h3 className="font-semibold text-xl mb-2">{t.how.steps.three.title}</h3>
    <p className="text-center">{t.how.steps.three.desc}</p>
  </div>
</div>


        </section>
           


         

       

       

      </main>

    </>
  );
}
