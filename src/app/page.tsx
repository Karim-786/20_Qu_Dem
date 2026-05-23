import Link from "next/link";

import {
  ArrowRight,
  Brain,
  FileText,
  BarChart3,
} from "lucide-react";

export default function HomePage() {

  return (

    <main className="min-h-screen bg-[#f7f7f7]">

      {/* NAVBAR */}

      <nav className="w-full bg-white border-b border-gray-200 relative z-50">

        <div className="max-w-7xl mx-auto h-32 px-8 flex items-center justify-between relative">

          {/* BRAND LOGO */}

          <div className="flex flex-col">

            {/* TOP ROW */}

            <div className="flex items-center gap-4">

              {/* OG ICON */}

              <div className="relative flex items-center justify-center w-18 h-16">

                {/* O */}

                <div className="absolute w-11 h-10 bg-[#515151] rounded-full left-1"></div>

                {/* G */}

                <div className="text-[64px] leading-none font-black text-[#dc2626] relative z-10 ml-5">

                  G

                </div>

              </div>

              {/* BRAND NAME */}

              <div className="flex items-baseline tracking-tight">

                <h1 className="text-4xl font-medium text-[#515151] leading-none">

                  One

                </h1>

                <h1 className="text-4xl font-bold text-[#dc2626] leading-none">

                  Grasp

                </h1>

              </div>

            </div>

            {/* SUBTITLE */}

            <p className="ml-25 mt-1 text-gray-500 tracking-[4px] text-[10px] font-bold uppercase">

              CAREER COUNSELLING PLATFORM

            </p>

          </div>
          {/* RIGHT */}

          <div className="flex items-center gap-4">

            <Link
              href="/login"
              className="px-5 py-2 rounded-xl border border-red-700 text-red-600 hover:bg-red-50 transition font-medium"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="px-5 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition font-medium"
            >
              Start Test
            </Link>

          </div>

        </div>

      </nav>

      {/* HERO SECTION */}

      <section className="max-w-7xl mx-auto px-6 py-24">

        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* LEFT */}

          <div>

            <span className="inline-block px-4 py-2 rounded-full bg-red-100 text-red-700 text-sm font-semibold">

              AI Powered Psychometric Assessment

            </span>

            <h1 className="mt-8 text-5xl lg:text-6xl font-black leading-tight text-gray-900">

              Discover Your Ideal Career Path

            </h1>

            <p className="mt-8 text-lg text-gray-600 leading-8 max-w-xl">

              Analyze personality traits, emotional intelligence,
              career interests, learning styles, and skills using
              a professional career assessment platform.

            </p>

            <div className="mt-10 flex flex-wrap gap-5">

              <Link
                href="/register"
                className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-red-600 text-white font-semibold hover:bg-red-700 transition"
              >

                Start Assessment

                <ArrowRight size={20} />

              </Link>

              <button className="px-8 py-4 rounded-2xl bg-white border border-gray-300 hover:bg-gray-100 transition font-medium">

                Learn More

              </button>

            </div>

          </div>

          {/* RIGHT */}

          <div className="bg-white rounded-[32px] shadow-xl border border-gray-200 p-8">

            <div className="space-y-6">

              {/* CARD 1 */}

              <div className="flex gap-5 p-6 rounded-3xl bg-red-50">

                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">

                  <Brain className="text-red-600" size={32} />

                </div>

                <div>

                  <h3 className="text-2xl font-bold text-gray-900">

                    Personality Analysis

                  </h3>

                  <p className="mt-2 text-gray-600 leading-7">

                    MBTI-based psychometric profiling and deep personality insights.

                  </p>

                </div>

              </div>

              {/* CARD 2 */}

              <div className="flex gap-5 p-6 rounded-3xl bg-gray-100">

                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">

                  <BarChart3 className="text-red-600" size={32} />

                </div>

                <div>

                  <h3 className="text-2xl font-bold text-gray-900">

                    Career Recommendations

                  </h3>

                  <p className="mt-2 text-gray-600 leading-7">

                    Dynamic career mapping based on your assessment results.

                  </p>

                </div>

              </div>

              {/* CARD 3 */}

              <div className="flex gap-5 p-6 rounded-3xl bg-red-50">

                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">

                  <FileText className="text-red-600" size={32} />

                </div>

                <div>

                  <h3 className="text-2xl font-bold text-gray-900">

                    PDF Career Reports

                  </h3>

                  <p className="mt-2 text-gray-600 leading-7">

                    Generate professional multi-page psychometric reports instantly.

                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}