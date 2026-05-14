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
import Checkbox from "@/components/form/input/Checkbox";
import Select from "@/components/form/Select";
import SearchableSelect from "@/components/form/SearchableSelect";
import { leaveTypeSchema } from "@/lib/validations/leaveTypeSchema";
import {
  createEmptyLeaveTypeForm,
  toLeaveTypePayload,
  LeaveTypeFormValues,
} from "@/lib/leaveType";

interface AddLeaveTypeProps {
  onSuccess: () => void;
  className?: string;
  isSuperAdmin: boolean;
  userCompanyId?: string;
  companies: { value: string; label: string }[];
}

const makeInitial = (
  isSuperAdmin: boolean,
  userCompanyId?: string,
): LeaveTypeFormValues => ({
  companyId: !isSuperAdmin ? userCompanyId || "" : "",
  name: "",
  code: "",
  type: "paid",
  isCarryForward: false,
  maxCarryForward: 0,
  maxDays: 0,
  status: "active",
});

export default function AddLeaveType({
  onSuccess,
  className,
  isSuperAdmin,
  userCompanyId,
  companies,
}: AddLeaveTypeProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<LeaveTypeFormValues>(
    makeInitial(isSuperAdmin, userCompanyId),
  );
  const { can, isReady } = useAuthorization();

  const handleFieldChange = (field: keyof LeaveTypeFormValues, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleClose = () => {
    setFormData(makeInitial(isSuperAdmin, userCompanyId));
    setErrors({});
    setIsSubmitting(false);
    closeModal();
  };

  const handleSubmit = async () => {
    setErrors({});
    const payload = toLeaveTypePayload(formData);

    const validation = leaveTypeSchema.validate(payload, {
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
      const res = await fetch("/api/leave-type", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setErrors({ code: data.error });
        }
        toast.error(data?.error || "Failed to add leave type");
        return;
      }

      toast.success("Leave type added successfully");
      onSuccess();
      handleClose();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canCreate = isReady && can("leavetype.create");
  if (!isReady || !canCreate) return null;

  return (
    <>
      <Button
        size="md"
        variant="primary"
        className={className}
        onClick={openModal}
      >
        Add Leave Type
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        className="w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[720px] lg:max-w-[900px] p-4 sm:p-6 lg:p-8"
      >
        <AddForm
          title="Add New Leave Type"
          description="Enter details to create a new type of leave."
          submitLabel={isSubmitting ? "Adding..." : "Add Leave Type"}
          onCancel={handleClose}
          onSubmit={handleSubmit}
        >
          <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            <ComponentCard title="Leave Type Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* COMPANY - Super Admin only */}
                {isSuperAdmin && (
                  <div className="md:col-span-1">
                    <Label>
                      Company <span className="text-red-500">*</span>
                    </Label>
                    <SearchableSelect
                      options={companies}
                      value={formData.companyId}
                      onChange={(val) => handleFieldChange("companyId", val)}
                      placeholder="Search Company..."
                      error={!!errors.companyId}
                    />
                    {errors.companyId && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.companyId}
                      </p>
                    )}
                  </div>
                )}

                <div className="md:col-span-1">
                  <Label>
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. Annual Leave"
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
                    placeholder="e.g. AL"
                    value={formData.code}
                    onChange={(e) =>
                      handleFieldChange("code", e.target.value.toUpperCase())
                    }
                    error={!!errors.code}
                    hint={errors.code}
                  />
                </div>

                <div className="md:col-span-1">
                  <Label>Type </Label>
                  <Select
                    options={[
                      { value: "paid", label: "Paid" },
                      { value: "unpaid", label: "Unpaid" },
                    ]}
                    value={formData.type}
                    onChange={(val) => handleFieldChange("type", val)}
                    error={!!errors.type}
                    hint={errors.type}
                  />
                </div>

                <div className="md:col-span-1">
                  <Label>Max Days (per month)</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g. 14"
                    value={formData.maxDays === 0 ? "" : formData.maxDays}
                    onChange={(e) =>
                      handleFieldChange("maxDays", e.target.value)
                    }
                    error={!!errors.maxDays}
                    hint={errors.maxDays}
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
