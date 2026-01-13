"use client";

import NavBar from "@/components/NavBar";
import { SessionProvider } from "next-auth/react";

export default function PrivacyPolicyPage() {
  return (
    <>
    <SessionProvider>
      <NavBar />
      <main className="p-8 bg-gray-50 text-center space-y-8 pt-20">
        <h1 className="text-4xl font-bold">🔒 Privacy Policy</h1>

        <section className="max-w-3xl mx-auto text-gray-700 leading-relaxed space-y-4 text-justify">
          <p>
            Your privacy matters to us. Tripilot is designed with respect for your personal data
            and transparency in how it is used.
          </p>

          <h2 className="text-2xl font-semibold mt-6">1. Information We Collect</h2>
          <p>
            We only collect the information necessary to provide and improve the Tripilot
            experience — such as your email for login, and data related to your trips, budgets, and
            checklists.
          </p>

          <h2 className="text-2xl font-semibold mt-6">2. How We Use It</h2>
          <p>
            Your data is used solely to enhance your travel planning experience. We never sell or
            share personal data with third parties.
          </p>

          <h2 className="text-2xl font-semibold mt-6">3. Data Security</h2>
          <p>
            We use modern security measures to protect your information. However, no system is
            completely invulnerable, so please use unique passwords for your accounts.
          </p>

          <h2 className="text-2xl font-semibold mt-6">4. Your Rights</h2>
          <p>
            You can request to delete your account or any stored data at any time by contacting us from our {" "}
            <a href="/contact" className="underline text-[#001e42]">
              Contact
            </a> page.
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
