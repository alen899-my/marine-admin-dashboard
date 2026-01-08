"use client";

import AddForm from "@/components/common/AddForm";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useModal } from "@/hooks/useModal";
import { resourceSchema } from "@/lib/validations/resourceSchema"; // Import Schema
import { useState } from "react";
import { toast } from "react-toastify";

interface AddResourceButtonProps {
  onSuccess: () => void;
}

export default function AddResourceButton({ onSuccess }: AddResourceButtonProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { can, isReady } = useAuthorization();

  const initialFormState = { name: "", status: "active" };
  const [formData, setFormData] = useState(initialFormState);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleClose = () => {
    setErrors({});
    setIsSubmitting(false);
    setFormData(initialFormState);
    closeModal();
  };

  const handleSubmit = async () => {
    setErrors({});
    
    // 1. Client-side Joi Validation
    const validation = resourceSchema.validate(formData, { abortEarly: false });
    if (validation.error) {
      const joiErrors: Record<string, string> = {};
      validation.error.details.forEach((detail) => {
        joiErrors[detail.path[0]] = detail.message;
      });
      setErrors(joiErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle Duplicate Name (409) or other errors
        if (res.status === 409) {
          setErrors({ name: data.error });
        }
        toast.error(data?.error || "Failed to add resource");
        return;
      }

      toast.success("Resource added successfully");
      onSuccess();
      handleClose();
    } catch (error) {
      toast.error("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canCreate = isReady && can("resource.create");
  if (!isReady || !canCreate) return null;

  return (
    <>
      <Button size="md" variant="primary" onClick={openModal}>Add Resource</Button>

      <Modal isOpen={isOpen} onClose={handleClose} className="w-full max-w-[500px] p-6">
        <AddForm
          title="Add New Resource"
          description="Enter resource details."
          submitLabel={isSubmitting ? "Adding..." : "Add Resource"}
          onCancel={handleClose}
          onSubmit={handleSubmit}
        >
          <ComponentCard title="Details">
            <div className="space-y-4">
              <div>
                <Label>Resource Name <span className="text-red-500">*</span></Label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]}
                  value={formData.status}
                  onChange={(val) => handleSelectChange("status", val)}
                />
              </div>
            </div>
          </ComponentCard>
        </AddForm>
      </Modal>
    </>
  );
}