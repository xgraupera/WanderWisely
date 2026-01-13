"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";

export default function ProfileContent() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading")
    return (
    <>
    <NavBar /> <p className="p-8 bg-gray-50 text-center pt-20">Loading...</p>;</>
  );

  if (!session)
    return (
    <>
    <NavBar /><p className="p-8 bg-gray-50 text-center pt-20">You need to be logged in.</p>;</>
  );

  return (
    <>
    <NavBar />
      
          <main className="p-8 bg-gray-50 text-center space-y-8 pt-20">
    
      <h1 className="text-3xl font-bold mb-6 text-[#001e42]">Your Profile</h1>
      <div className="max-w-lg mx-auto bg-white p-6 rounded-2xl shadow-md space-y-4 text-left">
        <p className="text-gray-700"><span className="font-semibold">Email:</span> {session.user?.email}</p>
        <p className="text-gray-700"><span className="font-semibold">Name:</span> {session.user?.name || "N/A"}</p>

        <button
          onClick={() => router.push("/dashboard")}
          className="w-full bg-[#001e42] text-white py-2 rounded-lg hover:bg-[#DCC9A3] transition"
        >
          Go to Dashboard
        </button>
      </div>
    </main>
    </>
  );
  
}
