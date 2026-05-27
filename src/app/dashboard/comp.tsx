"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  LayoutDashboard,
  ClipboardList,
  LogOut,
  TrendingUp,
  CalendarDays,
  Brain,
} from "lucide-react";

import { supabase }
from "@/app/lib/supabase";

import { useRouter }
from "next/navigation";

type Assessment = {

  id: string;

  user_email: string;

  recommendation: string;

  created_at: string;
};
export default function DashboardCompleted() {

  const router = useRouter();

  const [history, setHistory] =
    useState<Assessment[]>([]);

  const [loadingHistory,
    setLoadingHistory] =
    useState(true);

  const [loading,
    setLoading] =
    useState(true);

  // CHECK USER + FETCH HISTORY

  useEffect(() => {

    const initializeDashboard =
      async () => {

        try {

          const {
            data: { session },
          } = await supabase.auth
            .getSession();

          if (!session) {

            router.push("/login");

            return;
          }

          const {
            data: { user },
          } = await supabase.auth
            .getUser();

          if (!user) {

            router.push("/login");

            return;
          }

          // FETCH ASSESSMENT HISTORY

          const {
            data,
            error,
          } = await supabase

            .from(
              "career_assessments"
            )

            .select("*")

            .eq(
              "user_email",
              user.email
            )

            .order(
              "created_at",
              {
                ascending: false,
              }
            );

          if (error) {

            console.log(
              "History Error:",
              JSON.stringify(
                error,
                null,
                2
              )
            );

            return;
          }

          setHistory(data || []);

          setLoadingHistory(false);

          setLoading(false);

        } catch (error) {

          console.log(
            "Dashboard Error:",
            error
          );
        }
      };

    initializeDashboard();

  }, [router]);

  // LOGOUT

  const handleLogout =
    async () => {

      await supabase.auth
        .signOut();

      window.location.href =
        "/login";
    };

  // ANALYTICS

  const latestAssessment =
    history[0];

  const previousAssessment =
    history[1];

  const totalAssessments =
    history.length;

  const improvement =
    previousAssessment

      ? totalAssessments * 5

      : 0;

  // LOADING SCREEN

  if (loading) {

    return (

      <div className="min-h-screen flex items-center justify-center text-3xl font-black">

        Loading Dashboard...

      </div>
    );
  }

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

            Assessments

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

      {/* MAIN CONTENT */}

      <section className="flex-1 p-10">

        {/* WELCOME CARD */}

        <div className="bg-white rounded-[32px] shadow-sm border border-gray-200 p-8">

          <h1 className="text-4xl font-black text-gray-900">

            Student Dashboard

          </h1>

          <p className="mt-3 text-gray-500 text-lg">

            Welcome to the OneGrasp Career Assessment System

          </p>

        </div>

        {/* ANALYTICS CARDS */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">

          {/* TOTAL ASSESSMENTS */}

          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-200">

            <div className="flex items-center gap-4">

              <LayoutDashboard
                className="text-red-600"
              />

              <h2 className="text-xl font-bold">

                Total Assessments

              </h2>

            </div>

            <p className="mt-6 text-5xl font-black text-gray-900">

              {totalAssessments}

            </p>

          </div>

          {/* LAST ASSESSMENT */}

          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-200">

            <div className="flex items-center gap-4">

              <CalendarDays
                className="text-red-600"
              />

              <h2 className="text-xl font-bold">

                Last Assessment

              </h2>

            </div>

            <p className="mt-6 text-lg font-semibold text-gray-800">

              {
                latestAssessment

                ? new Date(
                    latestAssessment.created_at
                  ).toLocaleDateString()

                : "No assessments yet"
              }

            </p>

          </div>

          {/* IMPROVEMENT */}

          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-200">

            <div className="flex items-center gap-4">

              <TrendingUp
                className="text-red-600"
              />

              <h2 className="text-xl font-bold">

                Improvement

              </h2>

            </div>

            <p className="mt-6 text-5xl font-black text-green-600">

              +{improvement}%

            </p>

          </div>

        </div>

        {/* RECOMMENDATION */}

        <div className="mt-8 bg-white rounded-[32px] p-8 shadow-sm border border-gray-200">

          <div className="flex items-center gap-4">

            <Brain
              className="text-red-600"
            />

            <h2 className="text-3xl font-black text-gray-900">

              Latest Recommendation

            </h2>

          </div>

          <p className="mt-6 text-lg text-gray-700 leading-relaxed">

            {
              latestAssessment

              ? latestAssessment.recommendation

              : "No recommendation available yet."
            }

          </p>

        </div>

        {/* HISTORY */}

        <div className="mt-8 bg-white rounded-[32px] p-8 shadow-sm border border-gray-200">

          <h2 className="text-3xl font-black text-gray-900">

            Assessment History

          </h2>

          {
            loadingHistory

            ? (

              <p className="mt-6">

                Loading history...

              </p>

            ) : history.length === 0 ? (

              <p className="mt-6 text-gray-500">

                No assessments completed yet.

              </p>

            ) : (

              <div className="mt-8 space-y-5">

                {
                  history.map(
                    (item) => (

                      <div
                        key={item.id}
                        className="border border-gray-200 rounded-2xl p-6"
                      >

                        <div className="flex items-center justify-between">

                          <div>

                            <p className="text-lg font-bold text-gray-900">

                              Assessment ID:
                              {" "}
                              {item.id.slice(0, 8)}

                            </p>

                            <p className="mt-2 text-gray-500">

                              {
                                new Date(
                                  item.created_at
                                ).toLocaleString()
                              }

                            </p>

                          </div>

                          <div className="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-semibold">

                            Completed

                          </div>

                        </div>

                        <p className="mt-5 text-gray-700">

                          {
                            item.recommendation
                          }

                        </p>

                      </div>
                    )
                  )
                }

              </div>
            )
          }

        </div>

      </section>

    </main>
  );
}