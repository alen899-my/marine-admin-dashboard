"use client";

import { Building2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import AddForm from "@/components/common/AddForm";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select"; // Ensure you have a Select component
import { Modal } from "@/components/ui/modal";
import { companySchema } from "@/lib/validations/companySchema";

interface CompanyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export default function CompanyFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: CompanyFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const defaultState = {
    name: "",
    email: "",
    phone: "",
    address: "",
    status: "active", // Added status to state
    contactName: "",
    contactEmail: "",
  };

  const [form, setForm] = useState(defaultState);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        address: initialData.address || "",
        status: initialData.status || "active", // Sync status
        contactName: initialData.contactName || "",
        contactEmail: initialData.contactEmail || "",
      });
      setLogoPreview(initialData.logo || null);
    } else {
      setForm(defaultState);
      setLogoPreview(null);
    }
  }, [initialData, isOpen]);

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
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();

    img.onload = () => {
      if (img.width === 785 && img.height === 220) {
        setLogoFile(file);
        setLogoPreview(objectUrl);
      } else {
        toast.error(
          `Invalid dimensions: ${img.width}x${img.height}. Required: 785x220.`
        );
        e.target.value = ""; // Reset input
        URL.revokeObjectURL(objectUrl);
      }
    };

    img.onerror = () => {
      toast.error("Invalid image file.");
      URL.revokeObjectURL(objectUrl);
    };

    img.src = objectUrl;
  };

  const handleClose = () => {
    setErrors({});
    setLogoFile(null);
    onClose();
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
      formData.append("status", form.status); // Append status to FormData
      formData.append("contactName", form.contactName);
      formData.append("contactEmail", form.contactEmail);

      if (logoFile) {
        formData.append("logo", logoFile);
      }

      const url = initialData
        ? `/api/companies/${initialData._id}`
        : "/api/companies";
      const method = initialData ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save company");
      }

      toast.success(initialData ? "Company updated!" : "Company created!");
      onSuccess();
      handleClose();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="w-full max-w-[95vw] md:max-w-[800px] p-4 sm:p-6"
    >
      <AddForm
        title={initialData ? "Edit Company" : "Add New Company"}
        description={
          initialData
            ? "Update the corporate entity details."
            : "Register a new corporate entity."
        }
        submitLabel={
          isSubmitting
            ? "Saving..."
            : initialData
            ? "Update Company"
            : "Create Company"
        }
        onCancel={handleClose}
        onSubmit={handleSubmit}
      >
        <div className="max-h-[70dvh] overflow-y-auto p-1 space-y-3 no-scrollbar">
          {/* COMPANY DETAILS SECTION */}
          <ComponentCard title="Company Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
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

              <div>
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onChange={(val) =>
                    setForm((prev) => ({ ...prev, status: val }))
                  }
                  options={[
                    { label: "Active", value: "active" },
                    { label: "Inactive", value: "inactive" },
                  ]}
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
                  placeholder="johndoe@example.com"
                  value={form.contactEmail}
                  onChange={handleChange}
                  error={!!errors.contactEmail}
                  hint={errors.contactEmail}
                />
              </div>
            </div>
          </ComponentCard>

          {/* LOGO SECTION */}
          <div className="flex flex-col items-center justify-center py-4 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            <div className="relative w-full max-w-[320px] aspect-[785/220] rounded-xl overflow-hidden bg-white dark:bg-gray-900 border-2 border-white dark:border-gray-800 shadow-sm mb-3">
              {logoPreview ? (
                <Image
                  src={logoPreview}
                  alt="Logo Preview"
                  fill
                  className="object-contain" // Contain ensures wide logos aren't clipped
                  unoptimized={
                    typeof logoPreview === "string" &&
                    logoPreview.startsWith("http")
                  }
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <Building2 className="w-8 h-8 text-gray-300 mb-1" />
                  <p className="text-[11px] text-gray-500 font-medium">
                    Click to {initialData?.logo ? "change" : "upload"} logo{" "}
                    <span className="font-bold">(785x220px)</span>
                  </p>
                </div>
              )}
              <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                onChange={handleLogoChange}
                accept="image/*"
              />
            </div>
          </div>
        </div>
      </AddForm>
    </Modal>
  );
}
