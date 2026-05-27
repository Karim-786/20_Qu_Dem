"use client";

import {
  useEffect,
  useState,
} from "react";

import { supabase }
from "@/app/lib/supabase";

import { useRouter }
from "next/navigation";

import DashboardCompleted
from "./comp";

import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
} from "lucide-react";

export default function DashboardPage() {

  const router = useRouter();

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    hasAssessment,
    setHasAssessment,
  ] = useState(false);

  useEffect(() => {

    const checkAssessment =
      async () => {

        // CHECK SESSION

        const {
          data: { session },
        } = await supabase.auth
          .getSession();

        if (!session) {

          router.push("/login");

          return;
        }

        // GET USER

        const {
          data: { user },
        } = await supabase.auth
          .getUser();

        if (!user) {

          router.push("/login");

          return;
        }

        // CHECK ASSESSMENTS

        const {
          data,
          error,
        } = await supabase

          .from(
            "career_assessments"
          )

          .select("id")

          .eq(
            "user_email",
            user.email
          )

          .limit(1);

        console.log(data);

        if (error) {

          console.log(error);

          setLoading(false);

          return;
        }

        // USER COMPLETED ASSESSMENT

        if (
          data &&
          data.length > 0
        ) {

          setHasAssessment(true);
        }

        setLoading(false);
      };

    checkAssessment();

  }, [router]);

  // LOADING

  if (loading) {

    return (

      <div className="min-h-screen flex items-center justify-center text-3xl font-black">

        Loading...

      </div>
    );
  }

  // SHOW COMPLETED DASHBOARD

  if (hasAssessment) {

    return <DashboardCompleted />;
  }

  // FIRST TIME DASHBOARD

  const handleLogout =
    async () => {

      await supabase.auth
        .signOut();

      window.location.href =
        "/login";
    };

  return (

    <main className="min-h-screen bg-[#f5f5f5] flex">

      {/* SIDEBAR */}

      <aside className="w-72 bg-[#1f2937] text-white p-8 flex flex-col">

        <div>

          <h1 className="text-4xl font-black text-red-600">

            OneGrasp

          </h1>

          <p className="text-sm tracking-[3px] mt-2 py-4">

            ASSESSMENT PLATFORM

          </p>

        </div>

        {/* NAVIGATION */}

        <nav className="mt-14 flex flex-col gap-4">

          <button className="flex items-center gap-4 bg-red-600 px-5 py-4 rounded-2xl font-medium">

            <LayoutDashboard size={22} />

            Dashboard

          </button>

          <button

            onClick={() =>
              router.push(
                "/assessment"
              )
            }

            className="flex items-center gap-4 hover:bg-gray-700 px-5 py-4 rounded-2xl transition"
          >

            <ClipboardList size={22} />

            Start Assessment

          </button>

        </nav>

        {/* LOGOUT */}

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

        <div className="bg-white rounded-[32px] shadow-sm border border-gray-200 p-12">

          <h1 className="text-5xl font-black text-gray-900">

            Welcome to OneGrasp

          </h1>

          <p className="mt-6 text-xl text-gray-600 leading-relaxed">

            Start your career assessment journey and discover your strengths,
            interests, personality traits, and career recommendations.

          </p>

          <button

            onClick={() =>
              router.push(
                "/assessment"
              )
            }

            className="mt-10 bg-red-600 hover:bg-red-700 text-white px-10 py-5 rounded-2xl text-xl font-semibold"
          >

            Start Assessment

          </button>

        </div>

      </section>

    </main>
  );
}