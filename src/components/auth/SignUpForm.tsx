"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Link from "next/link";
import Image from "next/image"; // Import Next.js Image
import { useState, ChangeEvent, FormEvent } from "react"; // Import types
import Select from "../form/Select";
import Alert from "../ui/alert/Alert";
import { EyeClosedIcon, EyeIcon, EyeOff } from "lucide-react";

// Define the shape of the form state
interface FormState {
  fullName: string;
  email: string;
  password: string;
  role: string;
  assignedVesselId: string;
}

// Define the shape of the error object
interface FieldErrors {
  fullName?: string;
  email?: string;
  password?: string;
  role?: string;
  assignedVesselId?: string;
  general?: string;
  [key: string]: string | undefined; // Allows dynamic access
}

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState<FormState>({
    fullName: "",
    email: "",
    password: "",
    role: "",
    assignedVesselId: "",
  });

  const roleOptions = [
    { value: "superintendent", label: "Superintendent" },
    { value: "ops_manager", label: "OPS Manager" },
    { value: "crew_manager", label: "Crew Manager" },
    { value: "vessel_user", label: "Vessel User" },
    { value: "admin", label: "Admin" },
  ];

  // Fix 1: Typed the error state
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Fix 2: Updated signature to accept Real Events OR Custom Objects (from Select)
  const handleChange = (
    e: ChangeEvent<HTMLInputElement> | { target: { name: string; value: string } }
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldErrors({ ...fieldErrors, [e.target.name]: "" });
  };

  // Fix 3: Typed the submit event
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setFieldErrors({});
    setSuccessMessage("");

    if (!isChecked) {
      setFieldErrors({ general: "Please accept Terms and Conditions" });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          assignedVesselId:
            form.assignedVesselId === "" ? null : form.assignedVesselId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Fix 4: Typed the newErrors object
        const newErrors: FieldErrors = {};

        if (data.errors) {
          data.errors.forEach((msg: string) => {
            const lower = msg.toLowerCase();
            if (lower.includes("full")) newErrors.fullName = msg;
            if (lower.includes("email")) newErrors.email = msg;
            if (lower.includes("password")) newErrors.password = msg;
            if (lower.includes("role")) newErrors.role = msg;
            if (lower.includes("vessel")) newErrors.assignedVesselId = msg;
          });
        } else {
          newErrors.general = data.message || "Signup failed";
        }

        setFieldErrors(newErrors);
        setLoading(false);
        return;
      }

      // SUCCESS
      setFieldErrors({});
      setSuccessMessage("Account created successfully! Redirecting...");

      if (data.token) localStorage.setItem("auth_token", data.token);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));

      setTimeout(() => {
        window.location.href = "/signin";
      }, 1000);
    } catch (error) {
      console.error(error);
      setFieldErrors({ general: "Something went wrong" });
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
      <div className="flex flex-col justify-center flex-1 w-full max-w-xl mx-auto">
        <div className="bg-white dark:bg-gray-900 shadow-lg rounded-xl p-8 border border-gray-200 dark:border-gray-700">
          
          {/* Logo */}
          <div className="flex justify-center mb-6">
            {/* Fix 5: Replaced <img> with <Image /> */}
            <Image 
              src="/images/logo/logo-icon.svg" 
              alt="Logo" 
              width={48} 
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
              {/* General Error */}
              {fieldErrors.general && (
                <Alert
                  variant="error"
                  title="Signup Failed"
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

              {/* Full Name */}
              <div>
                <Label>
                  Full Name<span className="text-error-500"> *</span>
                </Label>
                <Input
                  type="text"
                  id="fullName"
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
                  id="email"
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

              {/* Password */}
              <div>
                <Label>
                  Password<span className="text-error-500"> *</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className={fieldErrors.password ? "border-red-500" : ""}
                  />
                  <button
  type="button"
  onClick={() => setShowPassword((prev) => !prev)}
  aria-label={showPassword ? "Hide password" : "Show password"}
  className="
    absolute right-4 top-1/2 -translate-y-1/2
    flex items-center justify-center
    h-9 w-9 rounded-full
    text-gray-500 dark:text-gray-400
   
    
    transition
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

              {/* Role */}
              <div>
                <Label>
                  Role<span className="text-error-500"> *</span>
                </Label>

                <Select
                  options={roleOptions}
                  placeholder="Select role"
                  defaultValue={form.role}
                  // Fix 6: Removed 'as any'. The handleChange signature now accepts this object.
                  onChange={(value) =>
                    handleChange({ target: { name: "role", value } })
                  }
                  className={`${
                    fieldErrors.role ? "border-red-500" : "border-gray-300"
                  }`}
                />

                {fieldErrors.role && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.role}</p>
                )}
              </div>

              {/* Optional Assigned Vessel */}
              <div>
                <Label>Assigned Vessel ID (optional)</Label>
                <Input
                  type="text"
                  id="assignedVesselId"
                  name="assignedVesselId"
                  value={form.assignedVesselId}
                  onChange={handleChange}
                  placeholder="Enter vessel ID or leave empty"
                  className={fieldErrors.assignedVesselId ? "border-red-500" : ""}
                />
                {fieldErrors.assignedVesselId && (
                  <p className="text-red-500 text-sm mt-1">
                    {fieldErrors.assignedVesselId}
                  </p>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-center gap-3">
                <Checkbox
                  className="w-5 h-5"
                  checked={isChecked}
                  onChange={setIsChecked}
                />
                <p className="text-gray-500 dark:text-gray-400">
                  By creating an account you agree to the{" "}
                  <span className="text-gray-800 dark:text-white">Terms</span>{" "}
                  and{" "}
                  <span className="text-gray-800 dark:text-white">
                    Privacy Policy
                  </span>
                  .
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
              >
                {loading ? "Creating account..." : "Sign Up"}
              </button>
            </div>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-gray-700 dark:text-gray-400">
              Already have an account?{" "}
              <Link
                href="/signin"
                className="text-brand-500 hover:text-brand-600"
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