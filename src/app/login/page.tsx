"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import { supabase } from "@/app/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {

  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

const handleLogin = async (
  e: React.FormEvent<HTMLFormElement>
) => {

  e.preventDefault();

  setLoading(true);

  const { error } =
    await supabase.auth
      .signInWithPassword({

        email,
        password,
      });

  if (error) {

    alert(error.message);

    setLoading(false);

    return;
  }

  const { data: profile } =
    await supabase
      .from("profiles")
      .select("role")
      .eq("email", email)
      .maybeSingle();

  setLoading(false);

 if (
  profile?.role === "admin"
) {

  console.log("GO ADMIN");

  window.location.replace(
    "/admin"
  );

} else {

  console.log("GO DASHBOARD");

  window.location.replace(
    "/dashboard"
  );
}
};
return (

    <main className="min-h-screen flex items-center justify-center bg-[#f7f7f7] px-6">

      <div className="w-full max-w-md bg-white rounded-[32px] shadow-xl border border-gray-200 p-10">

        <div className="text-center">

          <h1 className="text-4xl font-black text-red-700">
            Welcome Back
          </h1>

          <p className="mt-3 text-gray-500">
            Login to continue your assessment journey
          </p>

        </div>

        <form
          onSubmit={handleLogin}
          className="mt-10 space-y-6"
        >

          <div>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>

            <div className="flex items-center border border-gray-300 rounded-2xl px-4 py-4">

              <Mail
                size={20}
                className="text-gray-400"
              />

              <input
                type="email"
                placeholder="Enter email"
                className="w-full ml-3 outline-none"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
              />

            </div>

          </div>

          <div>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>

            <div className="flex items-center border border-gray-300 rounded-2xl px-4 py-4">

              <Lock
                size={20}
                className="text-gray-400"
              />

              <input
                type="password"
                placeholder="Enter password"
                className="w-full ml-3 outline-none"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
              />

            </div>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-red-600 text-white font-semibold hover:bg-red-700 transition"
          >

            {
              loading
                ? "Logging In..."
                : "Login"
            }

          </button>

        </form>

        <p className="mt-8 text-center text-gray-600">

          Don’t have an account?{" "}

          <Link
            href="/register"
            className="text-red-600 font-semibold hover:underline"
          >
            Register
          </Link>

        </p>

      </div>

    </main>
  );
}
