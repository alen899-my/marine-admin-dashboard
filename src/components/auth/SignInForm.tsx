"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import Link from "next/link";
import Image from "next/image";
import { useState, ChangeEvent, FormEvent } from "react";
import Alert from "../ui/alert/Alert";
import { EyeIcon, EyeOff } from "lucide-react";
// 1. Import NextAuth Client
import { signIn } from "next-auth/react"; 
import { useRouter } from "next/navigation";
import { signinValidation } from "@/lib/validations/signinValidation";
interface FieldErrors {
  email?: string;
  password?: string;
  general?: string;
  [key: string]: string | undefined;
}

export default function SignInForm() {
  const router = useRouter(); // For redirection
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldErrors({ ...fieldErrors, [e.target.name]: "" });
  };

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setFieldErrors({});
  setLoading(true);

  // 🔹 1. PRE-AUTH CHECK
  const res = await fetch("/api/pre-auth-check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: form.email,
      password: form.password,
    }),
  });

  const data = await res.json();

 if (!res.ok) {
      if (data.error === "USER_INACTIVE") {
        setFieldErrors({
          general:
            "Your account is inactive. Please contact the administrator.",
        });
      } else if (data.error === "COMPANY_REQUIRED") {
        setFieldErrors({
          general:
            "Your account is not associated with a company. Please contact the administrator.",
        });
      } else if (data.error === "COMPANY_INACTIVE") {
        setFieldErrors({
          general:
            "Your company account is inactive or unavailable. Please contact your administrator or support.",
        });
      } else {
        setFieldErrors({
          general: "Invalid email or password.",
        });
      }

      setLoading(false);
      return;
    }

  // 🔹 2. REAL SIGN-IN (NextAuth)
  await signIn("credentials", {
    email: form.email,
    password: form.password,
    callbackUrl: "/",
  });
};



  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      {/* ... (Rest of your UI/JSX remains exactly the same) ... */}
       <div className="w-full max-w- sm:pt-10 mx-auto mb-5"></div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-900 shadow-lg rounded-xl p-8 border border-gray-200 dark:border-gray-700">
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
                  className="absolute right-3 top-1/2 z-30 -translate-y-1/2 flex items-center justify-center h-9 w-9 rounded-full text-gray-500 dark:text-gray-400"
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

              {/* <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox checked={isChecked} onChange={setIsChecked} />
                  <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                    Keep me logged in
                  </span>
                </div>

                {/* <Link
                  href="/forgot-password"
                  className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Forgot password?
                </Link> 
              </div> */}

              <div>
                <Button type="submit" className="w-full" size="sm" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </div>
            </div>
          </form>

          {/* <div className="mt-5 flex justify-center">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Sign Up
              </Link>
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
}