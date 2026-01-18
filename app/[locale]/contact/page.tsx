"use client";

import NavBar from "@/components/NavBar";
import { SessionProvider } from "next-auth/react";
import en from "@/i18n/en.json";
import es from "@/i18n/es.json";
import { useParams } from "next/navigation";

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

  const params = useParams();
const locale = params?.locale || "en";
const t = locale === "es" ? es : en;

  return (
    <>
      <SessionProvider>
      <NavBar />
      <main className="p-8 bg-gray-50 text-center space-y-8 pt-20">
        <h1 className="text-4xl font-bold">{t.contactpage.title}</h1>

        <p className="text-gray-700 max-w-2xl mx-auto leading-relaxed">
          {t.contactpage.intro}
        </p>

<form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-white p-6 rounded-2xl shadow-md space-y-4 text-left">
  <label>{t.contactpage.name}</label>
  <input name="name" className="w-full border  border-gray-200 p-2 rounded-lg" required placeholder={t.contactpage.namePlaceholder}/>

  <label >{t.contactpage.email}</label>
  <input name="email" type="email" className="w-full border border-gray-200  p-2 rounded-lg" required placeholder={t.contactpage.emailPlaceholder}   />

  <label >{t.contactpage.message}</label>
  <textarea name="message" className="w-full border border-gray-200  p-2 rounded-lg h-32" required placeholder={t.contactpage.messagePlaceholder}/>

  <button className="w-full bg-[#001e42] text-white py-2 rounded-lg hover:bg-[#DCC9A3] transition">
    {t.contactpage.send}
  </button>
</form>
        

        <p className="text-sm text-gray-500">
          {t.contactpage.direct}{" "}
          <a href="mailto:tripilotapp@gmail.com" className="text-[#001e42] font-medium underline">
            tripilotapp@gmail.com
          </a>
        </p>
      </main>
        </SessionProvider>
    </>
  );
}
