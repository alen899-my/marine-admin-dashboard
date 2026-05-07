"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import AddForm from "@/components/common/AddForm";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useModal } from "@/hooks/useModal";
import {
  createEmptySalaryHeadForm,
  toSalaryHeadPayload,
} from "@/lib/salaryHead";
import { salaryHeadSchema } from "@/lib/validations/salaryHeadSchema";
import SalaryHeadFormFields from "@/components/salary-head/SalaryHeadFormFields";

interface AddSalaryHeadProps {
  onSuccess: () => void;
  className?: string;
  currencyCode?: string;
  isSuperAdmin?: boolean;
  companyOptions?: { value: string; label: string }[];
  companyId?: string;
}

export default function AddSalaryHead({
  onSuccess,
  className,
  currencyCode = "USD",
  isSuperAdmin = false,
  companyOptions = [],
  companyId = "",
}: AddSalaryHeadProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState(createEmptySalaryHeadForm(companyId));
  const { can, isReady } = useAuthorization();

  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleAllowanceChange = (
    index: number,
    field: "label" | "value" | "type",
    value: string,
  ) => {
    setFormData((prev) => {
      const allowances = [...prev.allowances];
      allowances[index] = { ...allowances[index], [field]: value };
      return { ...prev, allowances };
    });

    const errorKey = `allowances.${index}.${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: "" }));
    }
  };

  const handleDeductionChange = (
    index: number,
    field: "label" | "value" | "type",
    value: string,
  ) => {
    setFormData((prev) => {
      const deductions = [...prev.deductions];
      deductions[index] = { ...deductions[index], [field]: value };
      return { ...prev, deductions };
    });

    const errorKey = `deductions.${index}.${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: "" }));
    }
  };

  const handleClose = () => {
    setFormData(createEmptySalaryHeadForm(companyId));
    setErrors({});
    setIsSubmitting(false);
    closeModal();
  };

  const handleSubmit = async () => {
    setErrors({});

    const payload = toSalaryHeadPayload(formData);
    const validation = salaryHeadSchema.validate(payload, {
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
      const res = await fetch("/api/salary-head", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setErrors({ title: data.error });
        }
        toast.error(data?.error || "Failed to add salary head");
        return;
      }

      toast.success("Salary head added successfully");
      onSuccess();
      handleClose();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canCreate = isReady && can("salary.head.create");
  if (!isReady || !canCreate) return null;

  return (
    <>
      <Button
        size="md"
        variant="primary"
        className={className}
        onClick={openModal}
      >
        Add Salary Head
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        className="w-full max-w-[95vw] md:max-w-[960px] p-6"
      >
        <AddForm
          title="Add New Salary Head"
          description="Enter salary head details, then add custom allowance and deduction entries."
          submitLabel={isSubmitting ? "Adding..." : "Add Salary Head"}
          onCancel={handleClose}
          onSubmit={handleSubmit}
        >
          <div className="max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
            <SalaryHeadFormFields
              formData={formData}
              errors={errors}
              disabled={isSubmitting}
              currencyCode={currencyCode}
              isSuperAdmin={isSuperAdmin}
              companyOptions={companyOptions}
              onFieldChange={handleFieldChange}
              onAllowanceChange={handleAllowanceChange}
              onDeductionChange={handleDeductionChange}
              onAddAllowance={() =>
                setFormData((prev) => ({
                  ...prev,
                  allowances: [...prev.allowances, { label: "", value: "", type: "amount" }],
                }))
              }
              onAddDeduction={() =>
                setFormData((prev) => ({
                  ...prev,
                  deductions: [...prev.deductions, { label: "", value: "", type: "amount" }],
                }))
              }
              onRemoveAllowance={(index) =>
                setFormData((prev) => ({
                  ...prev,
                  allowances: prev.allowances.filter((_, i) => i !== index),
                }))
              }
              onRemoveDeduction={(index) =>
                setFormData((prev) => ({
                  ...prev,
                  deductions: prev.deductions.filter((_, i) => i !== index),
                }))
              }
            />
          </div>
        </AddForm>
      </Modal>
    </>
  );
}
