"use client";

import NavBar from "@/components/NavBar";
import { SessionProvider } from "next-auth/react";

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const formData = new FormData(form);

  const res = await fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: formData.get("name"),
      email: formData.get("email"),
      message: formData.get("message"),
    }),
  });

  const data = await res.json();
  alert(data.message || data.error);
  form.reset();
};


export default function ContactPage() {
  return (
    <>
      <SessionProvider>
      <NavBar />
      <main className="p-8 bg-gray-50 text-center space-y-8 pt-20">
        <h1 className="text-4xl font-bold">📬 Contact Us</h1>

        <p className="text-gray-700 max-w-2xl mx-auto leading-relaxed">
          We’d love to hear from you! Whether you have a question, feedback, or partnership idea,
          we’re always happy to connect with fellow travelers and creators.
        </p>

<form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-white p-6 rounded-2xl shadow-md space-y-4 text-left">
  <label>Your Name</label>
  <input name="name" className="w-full border  border-gray-200 p-2 rounded-lg" required placeholder="John Traveler"/>

  <label >Email</label>
  <input name="email" type="email" className="w-full border border-gray-200  p-2 rounded-lg" required placeholder="you@example.com" />

  <label >Message</label>
  <textarea name="message" className="w-full border border-gray-200  p-2 rounded-lg h-32" required placeholder="Write your message..."/>

  <button className="w-full bg-[#001e42] text-white py-2 rounded-lg hover:bg-[#DCC9A3] transition">
    Send Message
  </button>
</form>
        

        <p className="text-sm text-gray-500">
          Or email us directly at{" "}
          <a href="mailto:wanderwiselyapp@gmail.com" className="text-[#001e42] font-medium underline">
            wanderwiselyapp@gmail.com
          </a>
        </p>
      </main>
        </SessionProvider>
    </>
  );
}
