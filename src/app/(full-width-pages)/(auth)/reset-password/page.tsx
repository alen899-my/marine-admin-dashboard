"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image"; // Added Import
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";

// 1. Separate the logic into a component that uses SearchParams
function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter(); // Use Next.js router for smoother transitions
  const token = searchParams.get("token");

  const [form, setForm] = useState({
    password: "",
    confirm: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Missing reset token.");
      return;
    }

    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invalid or expired token");
      }

      setSuccess("Password updated successfully. Redirecting...");
      setTimeout(() => router.push("/signin"), 1500);
      
    } catch (err: unknown) { // FIX 1: Changed 'any' to 'unknown'
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-100 text-red-600 border border-red-300 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg bg-green-100 text-green-700 border border-green-300 text-sm">
            {success}
          </div>
        )}

        {/* NEW PASSWORD */}
        <div>
          <Label>
            New Password <span className="text-error-500">*</span>
          </Label>
          <Input
            type="password"
            placeholder="Enter new password"
            value={form.password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm({ ...form, password: e.target.value })
            }
          />
        </div>

        {/* CONFIRM PASSWORD */}
        <div>
          <Label>
            Confirm Password <span className="text-error-500">*</span>
          </Label>
          <Input
            type="password"
            placeholder="Confirm new password"
            value={form.confirm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm({ ...form, confirm: e.target.value })
            }
          />
        </div>

        {/* SUBMIT */}
        <div>
          <Button className="w-full" size="sm" disabled={loading}>
            {loading ? "Updating..." : "Reset Password"}
          </Button>
        </div>
      </div>
    </form>
  );
}

// 2. Main Page Component wrapping the form in Suspense
export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="w-full max-w-md pt-10 mx-auto mb-5"></div> 

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-900 shadow-lg rounded-xl p-8 border border-gray-200 dark:border-gray-700">
          
          {/* LOGO */}
          <div className="flex justify-center mb-6">
            {/* FIX 2: Replaced img with Next.js Image component */}
            <Image 
              src="/images/logo/logo-icon.svg" 
              alt="Logo" 
              width={0}
              height={0}
              className="h-12 w-auto"
              priority
            />
          </div>

          {/* HEADING */}
          <div className="mb-5 sm:mb-8 text-center">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Reset Password
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your new password and confirm it.
            </p>
          </div>

          {/* SUSPENSE BOUNDARY REQUIRED FOR useSearchParams */}
          <Suspense fallback={<div className="text-center p-4">Loading form...</div>}>
            <ResetPasswordForm />
          </Suspense>

        </div>
      </div>
    </div>
  );
}