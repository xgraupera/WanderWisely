"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function ProfileContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || "en";

  const [name, setName] = useState("");        // Nombre editable
  const [password1, setPassword1] = useState(""); // Contraseña nueva
  const [password2, setPassword2] = useState(""); // Confirmación
  const [changesMade, setChangesMade] = useState(false);

  // Inicializar nombre cuando carga la sesión
  useEffect(() => {
    if (session?.user?.name) setName(session.user.name);
  }, [session]);

  // Detectar cambios para habilitar botón
  useEffect(() => {
    if (!session) return;
    const passwordChanged = password1.length > 0 || password2.length > 0;
    setChangesMade(name !== (session.user?.name || "") || passwordChanged);
  }, [name, password1, password2, session]);

  if (status === "loading")
    return (
      <>
        <NavBar />
        <p className="p-8 bg-gray-50 text-center pt-20">Loading...</p>
      </>
    );

  if (!session)
    return (
      <>
        <NavBar />
        <p className="p-8 bg-gray-50 text-center pt-20">
          You need to be logged in.
        </p>
      </>
    );

  // Función para guardar cambios
  const saveProfile = async () => {
    if (password1 !== password2) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          name,
          password: password1 || undefined, // solo si se cambió
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error updating profile");

      alert("Profile updated ✅");
      setPassword1("");
      setPassword2("");

      // Refrescar sesión para actualizar nombre en NavBar
      signIn("credentials", {
        redirect: false,
        email: session.user.email,
        password: password1 || undefined,
      });
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Server error");
    }
  };

  return (
    <>
      <NavBar />

      <main className="p-8 bg-gray-50 text-center space-y-8 pt-20">
        <h1 className="text-3xl font-bold mb-6 text-[#001e42]">
          Your Profile
        </h1>

        {/* Cuadrado blanco */}
        <div className="max-w-lg mx-auto bg-white p-6 rounded-2xl shadow-md space-y-4 text-left">

          {/* Email no editable */}
          <div className="mb-4">
            <label className="block mb-1 font-semibold">Email</label>
            <input
              type="email"
              value={session.user?.email || ""}
              disabled
              className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-100 cursor-not-allowed"
            />
          </div>

          {/* Grid para nombre y contraseña */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block mb-1 font-semibold">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#DCC9A3] focus:border-transparent"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold">New Password</label>
              <input
                type="password"
                placeholder="Password"
                value={password1}
                onChange={(e) => setPassword1(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#DCC9A3] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold">Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#DCC9A3] focus:border-transparent"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="space-y-2">
            <button
              disabled={!changesMade}
              onClick={saveProfile}
              className={`w-full py-2 rounded-lg text-white font-medium transition ${
                changesMade ? "bg-[#001e42] hover:bg-[#DCC9A3]" : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              Save Changes
            </button>

            <button
              onClick={() => router.push(`/${locale}/dashboard`)}
              className="w-full bg-[#001e42] text-white py-2 rounded-lg hover:bg-[#DCC9A3] transition"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
