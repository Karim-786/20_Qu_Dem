"use client";

import {
  useState, useEffect,
} from "react";
import {
  supabase,
} from "@/app/lib/supabase";
import {
  useRouter,
} from "next/navigation";

import {
  Search,
  FileText,
  Download,
  ArrowRight,
} from "lucide-react";

export default function AdminPage() {

  const router = useRouter();

  const [assessmentId,
    setAssessmentId] =
    useState("");

  const [loading,
    setLoading] =
    useState(false);

  const handleGenerateReport =
    async () => {

      if (!assessmentId.trim()) {

        alert(
          "Please enter Assessment ID"
        );

        return;
      }

      try {

        setLoading(true);

        router.push(
          `/report?id=${assessmentId}`
        );

      } catch (error) {

        console.error(error);

        alert(
          "Failed to open report"
        );

      } finally {

        setLoading(false);
      }
    };
  useEffect(() => {

    const checkAdmin =
      async () => {

        const {
          data: { session },
        } = await supabase
          .auth
          .getSession();

        // NOT LOGGED IN

        if (!session) {

          router.push("/login");

          return;
        }

        // FETCH USER ROLE

        const {
          data: profile,
          error,
        } = await supabase

          .from("profiles")

          .select("role")

          .eq(
            "id",
            session.user.id
          )

          .maybeSingle();

        if (error) {

          console.error(error);

          return;
        }

        if (!profile) {

          alert(
            "No admin profile found"
          );

          router.push(
            "/dashboard"
          );

          return;
        }
        // NOT ADMIN

        if (
          profile?.role !==
          "admin"
        ) {

          router.push(
            "/dashboard"
          );

          return;
        }

        console.log(
          "Admin Access Granted"
        );
      };

    checkAdmin();

  }, [router]);
  return (

    <main className="min-h-screen bg-[#f5f5f5] p-10">

      <div className="max-w-5xl mx-auto">

    <div className="bg-white rounded-[32px] shadow-lg border border-gray-200 p-12 flex flex-col items-center justify-center w-max mx-auto font-sans">
  
  {/* Logo Graphic (Circle and G) */}
  <div className="relative flex items-center justify-center mb-6 ml-8">
    {/* Dark Gray Circle */}
    <div className="absolute w-20 h-20 bg-[#515151] rounded-full -left-12 z-0 top-1/2 -translate-y-[45%]"></div>
    {/* Red G */}
    <div className="text-[150px] leading-none font-black text-[#dc2626] relative z-10 tracking-tighter">
      G
    </div>
  </div>

  {/* Logo Text */}
  <div className="flex items-baseline tracking-tight">
    <h1 className="text-6xl font-medium text-[#515151] leading-none">
      One
    </h1>
    <h1 className="text-6xl font-bold text-[#dc2626] leading-none">
      Grasp
    </h1>
  </div>

  {/* Subtitle / Extra Text */}
  <p className="mt-6 text-gray-500 tracking-[4px] text-sm font-bold uppercase">
    Admin Report Generator
  </p>

</div>

        {/* REPORT GENERATOR */}

        <div className="bg-white rounded-[32px] shadow-lg border border-gray-200 p-10 mt-10">

          <div className="flex items-center gap-4">

            <div className="w-16 h-16 rounded-2xl bg-[#dc2626] flex items-center justify-center text-white">

              <FileText size={32} />

            </div>

            <div>

              <h2 className="text-3xl font-black text-gray-900">
                Generate Assessment Report
              </h2>

              <p className="text-gray-500 mt-1">
                Enter Assessment ID to open candidate report
              </p>

            </div>

          </div>

          {/* INPUT */}

          <div className="mt-10">

            <label className="text-lg font-semibold text-gray-700 block mb-4">
              Assessment ID
            </label>

            <div className="flex gap-4">

              <div className="flex-1 relative">

                <Search
                  size={22}
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  placeholder="Enter assessment ID"
                  value={assessmentId}
                  onChange={(e) =>
                    setAssessmentId(
                      e.target.value
                    )
                  }
                  className="w-full h-16 rounded-2xl border border-gray-300 pl-14 pr-6 text-lg outline-none focus:border-[#dc2626]"
                />

              </div>

              <button
                onClick={handleGenerateReport}
                disabled={loading}
                className="h-16 px-8 rounded-2xl bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold text-lg transition flex items-center gap-3 disabled:opacity-60"
              >

                {
                  loading ? (
                    "Opening..."
                  ) : (
                    <>
                      Generate
                      <ArrowRight size={22} />
                    </>
                  )
                }

              </button>

            </div>

          </div>

          {/* QUICK GUIDE */}

          <div className="mt-12 bg-gray-50 rounded-2xl p-8 border border-gray-200">

            <h3 className="text-2xl font-black text-gray-900">
              How To Use
            </h3>

            <div className="mt-6 space-y-4 text-gray-600 text-lg">

              <p>
                1. Open Supabase answers table
              </p>

              <p>
                2. Copy any existing assessment_id
              </p>

              <p>
                3. Paste it above
              </p>

              <p>
                4. Click Generate
              </p>

              <p>
                5. Professional psychometric report opens instantly
              </p>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}
