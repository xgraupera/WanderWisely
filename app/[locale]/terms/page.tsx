"use client";

import NavBar from "@/components/NavBar";
import { SessionProvider } from "next-auth/react";

export default function TermsPage() {
  return (
    <>
    <SessionProvider>
      <NavBar />
      <main className="p-8 bg-gray-50 text-center space-y-8 pt-20">
        <h1 className="text-4xl font-bold">📜 Terms & Conditions</h1>

        <section className="max-w-3xl mx-auto text-gray-700 leading-relaxed space-y-4 text-justify">
          <p>
            Welcome to Tripilot. By accessing or using our platform, you agree to these Terms and
            Conditions. Please read them carefully before using the app or website.
          </p>

          <h2 className="text-2xl font-semibold mt-6">1. Use of Service</h2>
          <p>
            Tripilot provides travel planning and budgeting tools for personal use. You agree not
            to misuse or attempt to disrupt our services.
          </p>

          <h2 className="text-2xl font-semibold mt-6">2. Accounts & Security</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials.
            We cannot be held liable for any unauthorized access caused by weak or shared passwords.
          </p>

          <h2 className="text-2xl font-semibold mt-6">3. Liability</h2>
          <p>
            Tripilot is provided “as is.” While we strive for accuracy, we do not guarantee that
            all information, calculations, or trip data are error-free. Use the platform at your own
            discretion.
          </p>

          <h2 className="text-2xl font-semibold mt-6">4. Changes</h2>
          <p>
            We may update these Terms from time to time. Continued use of Tripilot after changes
            constitutes acceptance of the new version.
          </p>

          <p className="text-gray-500 mt-8">
            Last updated: November 2025
          </p>
        </section>
      </main>
      </SessionProvider>
    </>
  );
}
