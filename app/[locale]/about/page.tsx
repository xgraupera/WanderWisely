"use client";

import { SessionProvider } from "next-auth/react";
import NavBar from "@/components/NavBar";

export default function AboutPage() {
  return (
    <>  <SessionProvider>
      <NavBar />
      <main className="p-8 bg-gray-50 text-center space-y-8 pt-20">
        <h1 className="text-4xl font-bold">🌍 About Tripilot</h1>

        <section className="max-w-3xl mx-auto text-gray-700 leading-relaxed space-y-4">
          <p>
            Tripilot was born from a love of travel and a passion for simple, smart planning.
            We believe every journey — whether across the world or across your country — deserves
            to be well organized, budget-conscious, and memorable for the right reasons.
          </p>

          <p>
            Our mission is to empower travelers to plan, track, and experience their adventures
            with confidence. Tripilot combines intuitive design with practical tools for managing
            budgets, checklists, itineraries, and shared travel expenses.
          </p>

          <p>
            We’re a small, independent team of explorers, designers, and developers who understand
            the challenges of planning trips. Tripilot is built for travelers, by travelers.
          </p>
        </section>

        <p className="text-gray-500 text-sm mt-8">
          Wander Smart. Travel Wisely. ✈️
        </p>
      </main>
        </SessionProvider>
    </>
  );
}
