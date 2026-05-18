"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";

type AuthMode = "login" | "signup";

interface CareerAuthCardProps {
  mode?: AuthMode;
  onModeChange?: (mode: AuthMode) => void;
  redirectPath?: string;
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

const AuthInput: React.FC<{
  type?: string;
  name: string;
  label: string;
  placeholder: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  showToggle?: boolean;
  error?: string;
}> = ({
  type = "text",
  name,
  label,
  placeholder,
  icon,
  value,
  onChange,
  showToggle,
  error,
}) => {
  const [visible, setVisible] = useState(false);
  const inputType = showToggle ? (visible ? "text" : "password") : type;

  return (
    <div className="w-full">
      <label className="mb-1.5 ml-1 block text-sm font-medium text-gray-700 dark:text-gray-400">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 z-10 flex items-center text-gray-400">
          {icon}
        </span>
        <Input
          type={inputType}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 pr-10"
          error={Boolean(error)}
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute inset-y-0 right-3 z-10 flex items-center text-gray-400 hover:text-gray-600"
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

const CareerAuthCard: React.FC<CareerAuthCardProps> = ({
  mode: modeProp = "login",
  onModeChange,
  redirectPath = "/careers",
}) => {
  const [internalMode, setInternalMode] = useState<AuthMode>(modeProp);
  const mode = onModeChange ? modeProp : internalMode;
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [successMessage, setSuccessMessage] = useState("");

  const safeRedirect =
    redirectPath?.startsWith("/") && !redirectPath.startsWith("//")
      ? redirectPath
      : "/careers";

  const switchMode = (m: AuthMode) => {
    setFieldErrors({});
    setSuccessMessage("");
    if (onModeChange) {
      onModeChange(m);
    } else {
      setInternalMode(m);
    }
  };

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [fullName, setFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const leftPanelContent =
    mode === "login"
      ? {
          title: "Welcome Back!",
          description: "Log in to your account and manage your applications.",
        }
      : {
          title: "Start Your Journey!",
          description:
            "Create your candidate account and apply for maritime opportunities.",
        };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setSuccessMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/pre-auth-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const message =
          data.error === "USER_INACTIVE"
            ? "Your account is inactive. Please contact the administrator."
            : data.error === "COMPANY_REQUIRED"
              ? "Your account is not associated with a company. Please contact the administrator."
              : data.error === "COMPANY_INACTIVE"
                ? "Your company account is inactive or unavailable. Please contact your administrator or support."
                : "Invalid email or password.";
        setFieldErrors({ general: message });
        setLoading(false);
        return;
      }

      await signIn("credentials", {
        email: loginEmail,
        password: loginPassword,
        callbackUrl: data.role === "candidate" ? safeRedirect : "/",
      });
    } catch {
      setFieldErrors({ general: "Network error or server unavailable" });
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setSuccessMessage("");

    const errors: FieldErrors = {};
    if (!fullName.trim()) errors.fullName = "Full name is required";
    if (!signupEmail.trim()) errors.email = "Email is required";
    if (!phone.trim()) errors.phone = "Phone is required";
    if (!signupPassword) errors.password = "Password is required";
    if (signupPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords must match";
    }


    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email: signupEmail,
          phone,
          password: signupPassword,
          confirmPassword,
          role: "candidate",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFieldErrors({
          general:
            data.message ||
            data.errors?.[0] ||
            "Registration failed. Please check your details.",
        });
        setLoading(false);
        return;
      }

      setLoginEmail(signupEmail);
      setLoginPassword("");
      setLoading(false);
      switchMode("login");
      setSuccessMessage("Account created. Please sign in to continue.");
    } catch {
      setFieldErrors({ general: "Network error or server unavailable" });
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full max-w-[900px] min-h-[620px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
      <div className="relative hidden w-[45%] shrink-0 overflow-hidden md:block">
        <Image
          src="/images/careerauthcard.png"
          alt="Maritime career"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/55 to-transparent" />
        <div className="absolute inset-x-0 top-0 px-10 pt-20">
          <h2 className="text-3xl font-bold leading-tight text-gray-900">
            {leftPanelContent.title}
          </h2>
          <p className="mt-4 max-w-[260px] text-base leading-7 text-gray-600">
            {leftPanelContent.description}
          </p>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white/80 to-transparent" />
      </div>

      <div className="flex flex-1 flex-col justify-center px-8 py-10 sm:px-10">
        {mode === "login" ? (
          <>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Log In</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Enter your credentials to continue
            </p>

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              {fieldErrors.general && (
                <InlineAlert message={fieldErrors.general} />
              )}
              {successMessage && (
                <InlineAlert variant="success" message={successMessage} />
              )}
              <AuthInput
                type="email"
                name="email"
                label="Email Address"
                placeholder="Enter your email address"
                icon={<MailIcon />}
                value={loginEmail}
                onChange={setLoginEmail}
                error={fieldErrors.email}
              />
              <AuthInput
                name="password"
                label="Password"
                placeholder="Enter your password"
                icon={<LockIcon />}
                value={loginPassword}
                onChange={setLoginPassword}
                showToggle
                error={fieldErrors.password}
              />

              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-brand-500 hover:text-brand-600 hover:underline dark:text-brand-400"
                >
                  Forgot Password?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={loading}
                size="md"
                variant="primary"
                className="w-full"
              >
                {loading ? "Signing in..." : "Log In"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Button
                type="button"
                variant="link"
                onClick={() => switchMode("signup")}
                className="font-semibold dark:text-brand-400"
              >
                Sign Up
              </Button>
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create Your Account
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Join us and explore exciting career opportunities.
            </p>

            <form onSubmit={handleSignUp} className="mt-6 space-y-4">
              {fieldErrors.general && (
                <InlineAlert message={fieldErrors.general} />
              )}
              <AuthInput
                name="fullName"
                label="Full Name"
                placeholder="Enter your full name"
                icon={<PersonOutlineIcon />}
                value={fullName}
                onChange={setFullName}
                error={fieldErrors.fullName}
              />
              <AuthInput
                type="email"
                name="email"
                label="Email Address"
                placeholder="Enter your email address"
                icon={<MailIcon />}
                value={signupEmail}
                onChange={setSignupEmail}
                error={fieldErrors.email}
              />
              <AuthInput
                type="tel"
                name="phone"
                label="Phone Number"
                placeholder="Enter your phone number"
                icon={<PhoneIcon />}
                value={phone}
                onChange={setPhone}
                error={fieldErrors.phone}
              />
              <AuthInput
                name="password"
                label="Password"
                placeholder="Create a password"
                icon={<LockIcon />}
                value={signupPassword}
                onChange={setSignupPassword}
                showToggle
                error={fieldErrors.password}
              />
              <AuthInput
                name="confirmPassword"
                label="Confirm Password"
                placeholder="Confirm your password"
                icon={<LockIcon />}
                value={confirmPassword}
                onChange={setConfirmPassword}
                showToggle
                error={fieldErrors.confirmPassword}
              />
              <div className="flex items-start gap-3 text-sm text-gray-500 dark:text-gray-400">
               
              </div>

              <Button
                type="submit"
                disabled={loading}
                size="md"
                variant="primary"
                className="w-full"
              >
                {loading ? "Creating account..." : "Sign Up"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Button
                type="button"
                variant="link"
                onClick={() => switchMode("login")}
                className="font-semibold dark:text-brand-400"
              >
                Log In
              </Button>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default CareerAuthCard;

const InlineAlert = ({
  message,
  variant = "error",
}: {
  message: string;
  variant?: "error" | "success";
}) => (
  <div
    className={`rounded-lg border px-4 py-3 text-sm ${
      variant === "success"
        ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300"
        : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
    }`}
  >
    {message}
  </div>
);

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const PersonOutlineIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);
