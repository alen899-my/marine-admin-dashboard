"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import AddForm from "@/components/common/AddForm";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
// Import the schema
import { userSchema } from "@/lib/validations/uservalidation/userSchema";

interface AddUserButtonProps {
  onSuccess: () => void;
}

export default function AddUserButton({ onSuccess }: AddUserButtonProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form State for User
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for the field being edited
    if (errors[name]) {
      setErrors((prev) => {
        const newErr = { ...prev };
        delete newErr[name];
        return newErr;
      });
    }
  };

  const handleClose = () => {
    setErrors({});
    setIsSubmitting(false);
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    });
    closeModal();
  };

  const handleSubmit = async () => {
    setErrors({});
    setIsSubmitting(true);

    // --- 1. Joi Validation ---
    const { error } = userSchema.validate(formData, { abortEarly: false });

    if (error) {
      const newErrors: Record<string, string> = {};
      error.details.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      setIsSubmitting(false);
      toast.error("Please fix the highlighted errors.");
      return;
    }

    try {
      // --- 2. Submit Data ---
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      toast.success("User added successfully!");
      onSuccess();
      handleClose();
    } catch (error: unknown) {
      console.error("Add user failed", error);
      const errorMessage = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button size="md" variant="primary" onClick={openModal}>
        Add User
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        className={`
          w-full
          max-w-[95vw]
          sm:max-w-[90vw]
          md:max-w-[600px]
          p-4
          sm:p-6
        `}
      >
        <AddForm
          title="Add New User"
          description="Create a new user account with access credentials."
          submitLabel={isSubmitting ? "Creating..." : "Create User"}
          onCancel={handleClose}
          onSubmit={handleSubmit}
        >
          <div className="max-h-[70vh] overflow-y-auto p-1 space-y-5">
            
            {/* USER DETAILS (Combined) */}
            <ComponentCard title="User Details">
              <div className="space-y-4">
                <div>
                  <Label>Full Name <span className="text-red-500">*</span></Label>
                  <Input
                    name="name"
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <Label>Email Address <span className="text-red-500">*</span></Label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="e.g. john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <Label>Phone Number <span className="text-red-500">*</span></Label>
                  <Input
                    type="tel"
                    name="phone"
                    placeholder="e.g. +91 9876543210"
                    value={formData.phone}
                    onChange={handleChange}
                    className={errors.phone ? "border-red-500" : ""}
                  />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>

                {/* Password Fields Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  <div>
                    <Label>Password <span className="text-red-500">*</span></Label>
                    <Input
                      type="password"
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className={errors.password ? "border-red-500" : ""}
                    />
                    {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                  </div>

                  <div>
                    <Label>Confirm Password <span className="text-red-500">*</span></Label>
                    <Input
                      type="password"
                      name="confirmPassword"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={errors.confirmPassword ? "border-red-500" : ""}
                    />
                    {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
                  </div>
                </div>
              </div>
            </ComponentCard>

          </div>
        </AddForm>
      </Modal>
    </>
  );
}