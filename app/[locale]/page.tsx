"use client";

import { useState } from "react";
import Head from "next/head";
import NavBar from "@/components/NavBar";
import FooterBar from "@/components/FooterBar";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useParams } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const params = useParams();
const locale = params?.locale || "en"; // fallback

function withLocale(path: string) {
  if (!path.startsWith("/")) path = "/" + path;
  return `/${locale}${path}`;
}

  return (
    <>
      <Head>
        <title>Tripilot | Plan Smarter. Travel Freely.</title>
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
            Tripilot
          </h1>
          
          <p className="text-lg md:text-xl text-white max-w-2xl mb-10 leading-relaxed">
            Your financial copilot for longer trips. <br />
            Plan your budget, track your spending, and know before it’s too late if your trip is going off track.
          </p>
         

        </section>


        <section className="py-20 text-center"> <h2 className="text-3xl font-bold text-[#001e42] mb-8"> Ready to travel without money stress? </h2> <button onClick={() => router.push(withLocale("/login"))} className="bg-[#001e42] text-white px-10 py-4 rounded-xl text-lg hover:bg-[#DCC9A3] transition shadow-lg hover:scale-105 hover:bg-[#e6d6b3] transition" > Create your trip </button> </section>

{/* 🌟 WHY Tripilot SECTION */}
<section className="py-5 px-6 text-center">
 <h2 className="text-3xl font-bold text-[#001e42] mb-10">
  Most trips don’t fail on planning. They fail on money.
</h2>


  <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
    

    <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-xl transition flex flex-col items-center">
      <span className="text-4xl mb-4">💰</span>
      <h3 className="font-semibold text-xl mb-2">Smart Budgeting</h3>
      <p className="text-gray-600 text-center">Track your expenses and plan budgets effortlessly.</p>
    </div>

    <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-xl transition flex flex-col items-center">
      <span className="text-4xl mb-4">📊</span>
<h3 className="font-semibold text-xl mb-2">Spending Forecast</h3>
<p className="text-gray-600 text-center">
See if your current pace puts the rest of your trip at risk — before it’s too late.
</p>

    </div>

    <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-xl transition flex flex-col items-center">

    <span className="text-4xl mb-4">⚠️</span>
<h3 className="font-semibold text-xl mb-2">Early Warnings</h3>
<p className="text-gray-600 text-center">
Know which category is breaking your budget — before it ruins your trip.
</p>
</div>
    <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-xl transition flex flex-col items-center">
      <span className="text-4xl mb-4">🗺️</span>
      <h3 className="font-semibold text-xl mb-2">Organized Itineraries</h3>
      <p className="text-gray-600 text-center">Plan day-by-day trips cleanly, no messy spreadsheets.</p>
    </div>

  </div>
</section>

 {/* 📝 HOW IT WORKS */}
        <section className="py-20 px-6 text-center">
          <div className=" mx-auto grid  gap-8 text-[#001e42]">
            <h2 className="text-3xl font-bold text-[#001e42]">
  How Tripilot works
</h2>
  <div className=" p-2 flex flex-col items-center">
    
    <h3 className="font-semibold text-xl mb-2">1. Set your trip budget</h3>
    <p className="text-center">Define how much you plan to spend for each category before you travel.</p>
  </div>

  <div className=" p-2 flex flex-col items-center">
    
    <h3 className="font-semibold text-xl mb-2">2. Log expenses</h3>
    <p className="text-center">Track your spending in seconds as you travel, no spreadsheets required.</p>
  </div>

  <div className="p-2 flex flex-col items-center">
    
    <h3 className="font-semibold text-xl mb-2">3. Stay on track</h3>
    <p className="text-center">Tripilot warns you early if your spending pace will break your budget — and tells you how to adjust.</p>
  </div>
</div>


        </section>
           


         

       

       

      </main>

    </>
  );
}
