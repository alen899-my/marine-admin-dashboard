"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import AddForm from "@/components/common/AddForm";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useModal } from "@/hooks/useModal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import SearchableSelect from "@/components/form/SearchableSelect";
import TextArea from "@/components/form/input/TextArea";
import { allowanceDeductionSchema } from "@/lib/validations/allowanceDeductionSchema";
import {
  createEmptyAllowanceDeductionForm,
  toAllowanceDeductionPayload,
  AllowanceDeductionFormValues,
} from "@/lib/allowanceDeduction";

interface AddAllowanceDeductionProps {
  onSuccess: () => void;
  className?: string;
  companies?: { value: string; label: string }[];
  isSuperAdmin?: boolean;
}

export default function AddAllowanceDeduction({
  onSuccess,
  className,
  companies = [],
  isSuperAdmin = false,
}: AddAllowanceDeductionProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<AllowanceDeductionFormValues>(
    createEmptyAllowanceDeductionForm(),
  );
  const { can, isReady } = useAuthorization();

  const handleFieldChange = (
    field: keyof AllowanceDeductionFormValues,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleClose = () => {
    setFormData(createEmptyAllowanceDeductionForm());
    setErrors({});
    setIsSubmitting(false);
    closeModal();
  };

  const handleSubmit = async () => {
    setErrors({});

    if (isSuperAdmin && !formData.companyId) {
      setErrors({ companyId: "Company is required" });
      return;
    }

    const payload = toAllowanceDeductionPayload(formData);

    const validation = allowanceDeductionSchema.validate(payload, {
      abortEarly: false,
    });

    if (validation.error) {
      const nextErrors: Record<string, string> = {};
      validation.error.details.forEach((detail) => {
        nextErrors[detail.path.join(".")] = detail.message;
      });
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/allowance-deduction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setErrors({ code: data.error });
        }
        toast.error(data?.error || "Failed to add Allowance/Deduction");
        return;
      }

      toast.success("Allowance/Deduction added successfully");
      onSuccess();
      handleClose();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canCreate = isReady && can("allowance.deduction.create");
  if (!isReady || !canCreate) return null;

  return (
    <>
      <Button
        size="md"
        variant="primary"
        className={className}
        onClick={openModal}
      >
        Add Allowance/Deduction
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        className="w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[720px] lg:max-w-[900px] p-4 sm:p-6 lg:p-8"
      >
        <AddForm
          title="Add Allowance / Deduction"
          description="Create an allowance or deduction master for payroll setup."
          submitLabel={isSubmitting ? "Adding..." : "Add Allowance/Deduction"}
          onCancel={handleClose}
          onSubmit={handleSubmit}
        >
          <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            <ComponentCard title="Master Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-1">
                  <Label>
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. Overtime"
                    value={formData.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    error={!!errors.name}
                    hint={errors.name}
                  />
                </div>

                <div className="md:col-span-1">
                  <Label>
                    Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. OT"
                    value={formData.code}
                    onChange={(e) =>
                      handleFieldChange("code", e.target.value.toUpperCase())
                    }
                    error={!!errors.code}
                    hint={errors.code}
                  />
                </div>

                <div className="md:col-span-1">
                  <Label>Type</Label>
                  <Select
                    options={[
                      { value: "allowance", label: "Allowance" },
                      { value: "deduction", label: "Deduction" },
                    ]}
                    value={formData.type}
                    onChange={(val) => handleFieldChange("type", val)}
                    error={!!errors.type}
                    hint={errors.type}
                  />
                </div>

                {isSuperAdmin && (
                  <div className="md:col-span-1">
                    <Label>
                      Company <span className="text-red-500">*</span>
                    </Label>
                    <SearchableSelect
                      options={companies}
                      placeholder="Select company"
                      value={formData.companyId}
                      onChange={(val) => handleFieldChange("companyId", val)}
                      error={!!errors.companyId}
                    />
                    {errors.companyId && (
                      <p className="mt-1.5 text-xs text-error-500">
                        {errors.companyId}
                      </p>
                    )}
                  </div>
                )}

                <div className="md:col-span-2">
                  <Label>Description</Label>
                  <TextArea
                    rows={4}
                    placeholder="Optional notes for this master"
                    value={formData.description}
                    onChange={(e) =>
                      handleFieldChange("description", e.target.value)
                    }
                    error={!!errors.description}
                    hint={errors.description}
                  />
                </div>
              </div>
            </ComponentCard>
          </div>
        </AddForm>
      </Modal>
    </>
  );
}
