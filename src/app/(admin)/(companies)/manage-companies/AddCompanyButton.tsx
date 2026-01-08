"use client";

import { Building2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "react-toastify";

import AddForm from "@/components/common/AddForm";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useModal } from "@/hooks/useModal";
import { companySchema } from "@/lib/validations/companySchema";

interface AddCompanyButtonProps {
  onSuccess: () => void;
}

export default function AddCompanyButton({ onSuccess }: AddCompanyButtonProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const { can, isReady } = useAuthorization();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const defaultState = {
    name: "",
    email: "",
    phone: "",
    address: "",
    contactName: "",
    contactEmail: "",
  };

  const [form, setForm] = useState(defaultState);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleClose = () => {
    setForm(defaultState);
    setLogoFile(null);
    setLogoPreview(null);
    setErrors({});
    closeModal();
  };

  const handleSubmit = async () => {
    setErrors({});
    setIsSubmitting(true);

    const { error } = companySchema.validate(form, { abortEarly: false });
    if (error) {
      const fieldErrors: Record<string, string> = {};
      error.details.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return toast.error("Please fix highlighted errors");
    }

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("phone", form.phone);
      formData.append("address", form.address);
      formData.append("contactName", form.contactName);
      formData.append("contactEmail", form.contactEmail);

      if (logoFile) formData.append("logo", logoFile);

      const res = await fetch("/api/companies", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create company");
      }

      toast.success("Company created successfully!");
      onSuccess();
      handleClose();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isReady || !can("companies.create")) return null;

  return (
    <>
      <Button size="md" variant="primary" onClick={openModal}>
        Add Company
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        className="w-full max-w-[95vw] md:max-w-[800px] p-4 sm:p-6"
      >
        <AddForm
          title="Add New Company"
          description="Register a new corporate entity in the system."
          submitLabel={isSubmitting ? "Creating..." : "Create Company"}
          onCancel={handleClose}
          onSubmit={handleSubmit}
        >
          <div className="max-h-[70dvh] overflow-y-auto p-1 space-y-3 no-scrollbar">
            <ComponentCard title="Company Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <Label>
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="name"
                    placeholder="Enter full company name"
                    value={form.name}
                    onChange={handleChange}
                    error={!!errors.name}
                    hint={errors.name}
                  />
                </div>

                <div>
                  <Label>
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="company@example.com"
                    value={form.email}
                    onChange={handleChange}
                    error={!!errors.email}
                    hint={errors.email}
                  />
                </div>

                <div>
                  <Label>Phone Number</Label>
                  <Input
                    name="phone"
                    placeholder="+1 (555) 000-0000"
                    value={form.phone}
                    onChange={handleChange}
                    error={!!errors.phone}
                    hint={errors.phone}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Address</Label>
                  <TextArea
                    name="address"
                    rows={2}
                    placeholder="Enter complete office address"
                    value={form.address}
                    onChange={handleChange}
                    error={!!errors.address}
                    hint={errors.address}
                  />
                </div>
              </div>
            </ComponentCard>

            <ComponentCard title="Contact Person">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>Name</Label>
                  <Input
                    name="contactName"
                    placeholder="e.g. John Doe"
                    value={form.contactName}
                    onChange={handleChange}
                    error={!!errors.contactName}
                    hint={errors.contactName}
                  />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    name="contactEmail"
                    placeholder="johndoe@company.com"
                    value={form.contactEmail}
                    onChange={handleChange}
                    error={!!errors.contactEmail}
                    hint={errors.contactEmail}
                  />
                </div>
              </div>
            </ComponentCard>

            <div className="flex flex-col items-center justify-center py-3 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border-2 border-white dark:border-gray-800 shadow-md mb-3">
                {logoPreview ? (
                  <Image
                    src={logoPreview}
                    alt="Logo Preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-10 h-10 text-gray-300" />
                  </div>
                )}
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleLogoChange}
                  accept="image/*"
                />
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Click to upload company logo
              </p>
            </div>
          </div>
        </AddForm>
      </Modal>
    </>
  );
}
