"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { registerValidation } from "@/lib/validations/userValidation";
import { EyeIcon, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useState } from "react";
import Alert from "../ui/alert/Alert";

// 1. Define Types
interface FormState {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface FieldErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
  [key: string]: string | undefined;
}

export default function SignUpForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // 2. Form State
  const [form, setForm] = useState<FormState>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // 4. Handle Input Changes
  const handleChange = (
    e:
      | ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: string } },
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear error for this field when user types
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setSuccessMessage("");

    //  Terms check (non-Joi)
    if (!isChecked) {
      setFieldErrors({ general: "Please accept Terms and Conditions" });
      return;
    }

    // Phone required check for candidate signup
    if (!form.phone.trim()) {
      setFieldErrors({ phone: "Phone is required" });
      return;
    }

    // Confirm password check
    if (form.password !== form.confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords must match" });
      return;
    }

    //  RUN JOI VALIDATION (CLIENT SIDE)
    const { error } = registerValidation.validate(
      {
        ...form,
        role: "candidate",
      },
      { abortEarly: false },
    );

    if (error) {
      const errors: FieldErrors = {};

      error.details.forEach((detail) => {
        const key = detail.path[0] as keyof FieldErrors;
        errors[key] = detail.message;
      });

      setFieldErrors(errors);
      return; // ⛔ STOP submit
    }

    setLoading(true);

   try {
  const res = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      password: form.password,
      role: "candidate",
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    setFieldErrors({ general: data.message || "Registration failed" });
    setLoading(false);
    return;
  }

  // SUCCESS — show message then redirect to signin
  setSuccessMessage("Account created! Please sign in to continue.");
  setTimeout(() => router.push("/signin"), 1500);

} catch (err) {
  setFieldErrors({ general: "Network error or server unavailable" });
  setLoading(false);
}
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
      <div className="flex flex-col justify-center flex-1 w-full max-w-xl mx-auto">
        <div className="bg-white dark:bg-gray-900 shadow-lg rounded-xl p-8 border border-gray-200 dark:border-gray-700">
          {/* LOGO */}
          <div className="flex justify-center mb-6">
          <Image
                        src="/images/logo/p.png"
                        alt="Logo"
                        width={100}
                        height={48}
                        className="h-12 w-auto"
                        priority
                      />
          </div>

          <div className="mb-5 text-center">
            <h1 className="text-title-md font-semibold text-gray-800 dark:text-white">
              Sign Up
            </h1>
          </div>

          <form noValidate onSubmit={handleSubmit}>
            <div className="space-y-5">
              {/* General Error Alert */}
              {fieldErrors.general && (
                <Alert
                  variant="error"
                  title="Signup Failed"
                  message={fieldErrors.general}
                />
              )}

              {/* Success Alert */}
              {successMessage && (
                <Alert
                  variant="success"
                  title="Success"
                  message={successMessage}
                />
              )}

              {/* Full Name */}
              <div>
                <Label>
                  Full Name<span className="text-error-500"> *</span>
                </Label>
                <Input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className={fieldErrors.fullName ? "border-red-500" : ""}
                />
                {fieldErrors.fullName && (
                  <p className="text-red-500 text-sm mt-1">
                    {fieldErrors.fullName}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <Label>
                  Email<span className="text-error-500"> *</span>
                </Label>
                <Input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className={fieldErrors.email ? "border-red-500" : ""}
                />
                {fieldErrors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <Label>
                  Phone<span className="text-error-500"> *</span>
                </Label>
                <Input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  className={fieldErrors.phone ? "border-red-500" : ""}
                />
                {fieldErrors.phone && (
                  <p className="text-red-500 text-sm mt-1">
                    {fieldErrors.phone}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <Label>
                  Password<span className="text-error-500"> *</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className={fieldErrors.password ? "border-red-500" : ""}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
                  >
                    {showPassword ? (
                      <EyeIcon className="h-5 w-5" />
                    ) : (
                      <EyeOff className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-red-500 text-sm mt-1">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <Label>
                  Confirm Password<span className="text-error-500"> *</span>
                </Label>
                <Input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  className={
                    fieldErrors.confirmPassword ? "border-red-500" : ""
                  }
                />
                {fieldErrors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={isChecked}
                  onChange={setIsChecked}
                  className="w-5 h-5"
                />
                <p className="text-gray-500 dark:text-gray-400">
                  By creating an account you agree to the{" "}
                  <span className="text-gray-800 dark:text-white cursor-pointer">
                    Terms
                  </span>{" "}
                  and{" "}
                  <span className="text-gray-800 dark:text-white cursor-pointer">
                    Privacy Policy
                  </span>
                  .
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-70 disabled:cursor-not-allowed transition"
              >
                {loading ? "Creating account..." : "Sign Up"}
              </button>
            </div>
          </form>

          {/* Sign In Link */}
          <div className="mt-5 text-center">
            <p className="text-sm text-gray-700 dark:text-gray-400">
              Already have an account?{" "}
              <Link
                href="/signin"
                className="text-brand-500 hover:text-brand-600 font-medium"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
