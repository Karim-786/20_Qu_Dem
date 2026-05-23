"use client";

import { useEffect } from "react";

import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  User,
  BarChart3,
  LogOut,
} from "lucide-react";

import { supabase } from "@/app/lib/supabase";

import { useRouter } from "next/navigation";

export default function DashboardPage() {

  const router = useRouter();

  useEffect(() => {

    const checkUser = async () => {

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
      }
    };

    checkUser();

  }, [router]);

  const handleLogout = async () => {

    await supabase.auth.signOut();

    router.push("/login");
  };

  return (
    <main className="min-h-screen bg-[#f5f5f5] flex">

      {/* SIDEBAR */}
      <aside className="w-72 bg-[#1f2937] text-white p-8 flex flex-col">

        <div>
          <h1 className="text-4xl font-black text-red-600">
            OneGrasp
          </h1>

          <p className="text-gray-00 text-sm tracking-[3px] mt-2 py-4">
            ASSESSMENT PLATFORM
          </p>
        </div>

        <nav className="mt-14 flex flex-col gap-4">

          <button className="flex items-center gap-4 bg-red-600 px-5 py-4 rounded-2xl font-medium">
            <LayoutDashboard size={22} />
            Dashboard
          </button>

          <button
            onClick={() =>
              router.push("/assessment")
            }
            className="flex items-center gap-4 hover:bg-gray-700 px-5 py-4 rounded-2xl transition"
          >

            <ClipboardList size={22} />

            Assessments

          </button>


        </nav>

        <div className="mt-auto">

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-2xl bg-red-600 hover:bg-red-700 transition font-medium"
          >
            <LogOut size={20} />
            Logout
          </button>

        </div>

      </aside>

      {/* CONTENT */}
      <section className="flex-1 p-10">

        <div className="bg-white rounded-[32px] shadow-sm border border-gray-200 p-8">

          <h1 className="text-4xl font-black text-gray-900">
            Student Dashboard
          </h1>

          <p className="mt-3 text-gray-500 text-lg">
            Welcome to the OneGrasp Career Assessment System
          </p>

        </div>

      </section>

    </main>
  );
}