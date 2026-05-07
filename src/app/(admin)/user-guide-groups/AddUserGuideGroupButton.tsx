"use client";

import AddForm from "@/components/common/AddForm";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useModal } from "@/hooks/useModal";
import { useState } from "react";
import { toast } from "react-toastify";

interface AddUserGuideGroupButtonProps {
  onSuccess: () => void;
  className?: string;
}

export default function AddUserGuideGroupButton({
  onSuccess,
  className,
}: AddUserGuideGroupButtonProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const { can, isReady } = useAuthorization();
  const [formData, setFormData] = useState({
    name: "",
    sortOrder: 1,
    status: "active",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({ name: "", sortOrder: 1, status: "active" });
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    closeModal();
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Group name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/user-guide-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to create group");

      toast.success("User guide group created successfully");
      handleClose();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to create group");
      setIsSubmitting(false);
    }
  };

  if (!isReady || !can("userguide.create")) return null;

  return (
    <>
      <Button className={className} onClick={openModal}>
        Create Group
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        className="w-full max-w-[95vw] md:max-w-[700px] p-4 sm:p-6"
      >
        <AddForm
          title="Create User Guide Group"
          description="Create a group that will appear when adding user guide items."
          submitLabel={isSubmitting ? "Saving..." : "Save Group"}
          onCancel={handleClose}
          onSubmit={handleSubmit}
        >
          <div className="space-y-5">
            <div>
              <Label>Group Name *</Label>
              <Input
                value={formData.name}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="e.g. Reports"
              />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <Label>Display Order *</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.sortOrder}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      sortOrder: Number(event.target.value || 0),
                    }))
                  }
                />
              </div>
              <div>
                <Label>Status *</Label>
                <Select
                  options={[
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                  value={formData.status}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                />
              </div>
            </div>
          </div>
        </AddForm>
      </Modal>
    </>
  );
}
