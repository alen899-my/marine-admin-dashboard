"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import Link from "next/link";
import Image from "next/image"; // Import Next.js Image
import { useState, ChangeEvent, FormEvent } from "react"; // Import Event types
import Alert from "../ui/alert/Alert";
import { EyeClosedIcon, EyeIcon, EyeOff } from "lucide-react";

// Define the shape of your error object
interface FieldErrors {
  email?: string;
  password?: string;
  general?: string;
  [key: string]: string | undefined; // Allows for dynamic error keys
}

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  // Fix 1: Typed the state instead of using <any>
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Fix 2: Typed the input change event
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldErrors({ ...fieldErrors, [e.target.name]: "" });
  };

  // Fix 3: Typed the form submit event
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setSuccessMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, remember: isChecked }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Fix 4: Typed the local error object
        const newErrors: FieldErrors = {};

        if (data.errors) {
          data.errors.forEach((msg: string) => {
            const lower = msg.toLowerCase();
            if (lower.includes("email")) newErrors.email = msg;
            if (lower.includes("password")) newErrors.password = msg;
          });
        } else {
          newErrors.general = data.message || "Login failed";
        }

        setFieldErrors(newErrors);
        setLoading(false);
        return;
      }

      // SUCCESS
      setFieldErrors({});
      setSuccessMessage("Login successful! Redirecting...");

      // Save token + user in localStorage
      if (data.token) {
        localStorage.setItem("auth_token", data.token);
      }

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      // Redirect AFTER showing success alert
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (error) {
      console.error(error);
      setFieldErrors({ general: "Something went wrong" });
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="w-full max-w- sm:pt-10 mx-auto mb-5"></div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-900 shadow-lg rounded-xl p-8 border border-gray-200 dark:border-gray-700">
          {/* LOGO */}
          <div className="flex justify-center mb-6">
            {/* Fix 5: Replaced <img> with <Image /> */}
            {/* Ensure width/height matches your image aspect ratio */}
            <Image 
              src="/images/logo/p.png" 
              alt="Logo" 
              width={100} 
              height={48} 
              className="h-12 w-auto" 
              priority
            />
          </div>

          {/* Heading */}
          <div className="mb-5 sm:mb-8 text-center">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in!
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {fieldErrors.general && (
                <Alert
                  variant="error"
                  title="Login Failed"
                  message={fieldErrors.general}
                />
              )}

              {successMessage && (
                <Alert
                  variant="success"
                  title="Success"
                  message={successMessage}
                />
              )}

              {/* EMAIL */}
              <div>
                <Label>
                  Email <span className="text-error-500">*</span>
                </Label>
                <Input
                  placeholder="info@gmail.com"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className={fieldErrors.email ? "border-red-500" : ""}
                />
                {fieldErrors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* PASSWORD */}
              <div>
                <Label>
                  Password <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className={fieldErrors.password ? "border-red-500" : ""}
                  />
               <button
  type="button"
  onClick={() => setShowPassword((prev) => !prev)}
  aria-label={showPassword ? "Hide password" : "Show password"}
  className="
    absolute right-3 top-1/2 z-30
    -translate-y-1/2
    flex items-center justify-center
    h-9 w-9 rounded-full
    text-gray-500 dark:text-gray-400
  
  
    
    transition-all
  "
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

              {/* CHECKBOX */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox checked={isChecked} onChange={setIsChecked} />
                  <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                    Keep me logged in
                  </span>
                </div>

                <Link
                  href="/forgot-password"
                  className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Forgot password?
                </Link>
              </div>

              {/* SUBMIT */}
              <div>
                <Button className="w-full" size="sm" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </div>
            </div>
          </form>

          {/* SIGN UP LINK */}
          <div className="mt-5 flex justify-center">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}