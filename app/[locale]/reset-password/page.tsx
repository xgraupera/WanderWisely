"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import NavBar from "@/components/NavBar";
import { SessionProvider } from "next-auth/react";





function ResetPasswordForm() {
  const params = useSearchParams();
  const email = params.get("email");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Processing...");

    try {
      const res = await fetch("/api/recover/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        setStatus("✅ Password successfully updated!");
        setPassword("");
      } else {
        const data = await res.json();
        setStatus(`❌ ${data.error || "Error resetting password."}`);
      }
    } catch (error) {
      setStatus("❌ Server error. Please try again later.");
    }
  }

  if (!email)
    return (
  <SessionProvider>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center px-4">
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-md">
          <h2 className="text-xl font-semibold text-[#0c454a] mb-2">
            Invalid or Missing Link
          </h2>
          <p className="text-gray-600">
            The recovery link is invalid or has expired. Please request a new password reset.
          </p>
        </div>
      </div>
      </SessionProvider>
    );

  return (
    <SessionProvider>
    <main className="p-8 space-y-10 bg-gray-50 pt-20">
    <div className="flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="bg-white shadow-md rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-4 text-center">
          Reset Password
        </h1>
        <p className="text-gray-600 text-center mb-6 text-sm">
          Choose a strong new password to secure your Tripilot account.
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <div>
            <label className="text-gray-700 text-sm font-medium mb-1 block">
              New Password
            </label>
            <input
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-[#0c454a] outline-none"
              required
            />
          </div>

          <button
            type="submit"
            className="bg-[#001e42] hover:bg-[#DCC9A3] text-white py-2 rounded-lg font-semibold transition-all duration-200"
          >
            {status === "Processing..." ? "Processing..." : "Reset Password"}
          </button>
        </form>

        {status && (
          <p
            className={`mt-4 text-sm text-center ${
              status.startsWith("✅")
                ? "text-green-600"
                : status.startsWith("❌")
                ? "text-red-500"
                : "text-gray-600"
            }`}
          >
            {status}
          </p>
        )}
      </div>
    </div>
    </main>
    </SessionProvider>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
    <SessionProvider>
      <NavBar />
      <Suspense fallback={<p className="text-center mt-8 text-gray-500">Loading...</p>}>
        <ResetPasswordForm />
      </Suspense>
      </SessionProvider>
    </>
    
  );
}
