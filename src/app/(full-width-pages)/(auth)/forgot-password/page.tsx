"use client";

import { useState } from "react";
import Image from "next/image"; // Fixed: Import Next.js Image component
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fixed: Use React.FormEvent instead of 'any'
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.message || "Something went wrong");
      return;
    }

    setMessage("If this email exists, a reset link has been sent.");
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="w-full max-w- sm:pt-10 mx-auto mb-5"></div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-900 shadow-lg rounded-xl p-8 border border-gray-200 dark:border-gray-700">
          {/* LOGO */}
          <div className="flex justify-center mb-6">
            {/* Fixed: Use Next.js Image component. 
               Added width/height/priority for LCP optimization. */}
            <Image
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={48} 
              height={48}
              className="h-12 w-auto"
              priority
            />
          </div>

          {/* HEADING */}
          <div className="mb-5 sm:mb-8 text-center">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Forgot Password
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and we’ll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {error && (
                <div className="p-3 rounded-lg bg-red-100 text-red-600 border border-red-300 text-sm">
                  {error}
                </div>
              )}

              {message && (
                <div className="p-3 rounded-lg bg-green-100 text-green-700 border border-green-300 text-sm">
                  {message}
                </div>
              )}

              {/* EMAIL */}
              <div>
                <Label>
                  Email <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  // Fixed: Use ChangeEvent<HTMLInputElement> instead of 'any'
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value)
                  }
                />
              </div>

              {/* SUBMIT */}
              <div>
                <Button className="w-full" size="sm" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </div>
            </div>
          </form>

          {/* SIGN IN LINK */}
          <div className="mt-5 flex justify-center">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
              Remember your password?{" "}
              <a
                href="/signin"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Sign In
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}