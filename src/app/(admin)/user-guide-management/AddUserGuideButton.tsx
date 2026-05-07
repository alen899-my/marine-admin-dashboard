"use client";

import AddForm from "@/components/common/AddForm";
import UserGuideForm, {
  emptyUserGuideForm,
  UserGuideFormValues,
} from "@/components/user-guide/UserGuideForm";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useModal } from "@/hooks/useModal";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface AddUserGuideButtonProps {
  onSuccess: () => void;
  className?: string;
}

interface GroupOptionResponse {
  _id: string;
  name: string;
}

interface RoleOptionResponse {
  name: string;
}

function validateForm(data: UserGuideFormValues) {
  const errors: Partial<Record<keyof UserGuideFormValues, string>> = {};

  if (!data.groupId.trim()) errors.groupId = "Group is required";
  if (!data.title.trim()) errors.title = "Sub item title is required";
  if (!data.assignedRoles.length) errors.assignedRoles = "At least one role must be assigned";
  const missingRoles = data.assignedRoles.filter(
    (role) => !data.roleContents?.[role]?.trim(),
  );
  if (missingRoles.length > 0) {
    errors.roleContents = `Content is required for: ${missingRoles.join(", ")}`;
  }

  return errors;
}

function buildPayload(data: UserGuideFormValues) {
  const roleContents = data.assignedRoles.reduce<Record<string, string>>(
    (acc, role) => {
      acc[role] = data.roleContents?.[role] || "";
      return acc;
    },
    {},
  );

  const fallbackContent =
    data.content ||
    data.assignedRoles.map((role) => roleContents[role]).find((value) => value?.trim()) ||
    "";

  return {
    groupId: data.groupId,
    title: data.title,
    assignedRoles: data.assignedRoles,
    status: data.status,
    content: fallbackContent,
    roleContents,
  };
}

export default function AddUserGuideButton({
  onSuccess,
  className,
}: AddUserGuideButtonProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const { can, isReady } = useAuthorization();
  const [formData, setFormData] = useState<UserGuideFormValues>(emptyUserGuideForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof UserGuideFormValues, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [groupOptions, setGroupOptions] = useState<{ value: string; label: string }[]>([]);
  const [roleOptions, setRoleOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [groupsRes, rolesRes] = await Promise.all([
          fetch("/api/user-guide-groups?limit=none&status=active"),
          fetch("/api/roles?limit=none&status=active"),
        ]);

        const groups = groupsRes.ok ? await groupsRes.json() : [];
        const rolesPayload = rolesRes.ok ? await rolesRes.json() : [];
        const roles = Array.isArray(rolesPayload) ? rolesPayload : rolesPayload.data || [];

        setGroupOptions(
          groups.map((group: GroupOptionResponse) => ({
            value: group._id,
            label: group.name,
          })),
        );
        setRoleOptions(
          roles.map((role: RoleOptionResponse) => ({
            value: role.name,
            label: role.name,
          })),
        );
      } catch {
        setGroupOptions([]);
        setRoleOptions([]);
      }
    }

    if (isOpen) {
      loadOptions();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData(emptyUserGuideForm);
    setErrors({});
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    closeModal();
  };

  const handleSubmit = async () => {
    const nextErrors = validateForm(formData);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/user-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(formData)),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create user guide");
      }

      toast.success("User guide created successfully");
      handleClose();
      onSuccess();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create user guide",
      );
      setIsSubmitting(false);
    }
  };

  const canCreate = isReady && can("userguide.create");
  if (!isReady || !canCreate) return null;

  return (
    <>
      <Button className={className} onClick={openModal}>
        Create User Guide
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        className="w-full max-w-[95vw] md:max-w-[1100px] p-4 sm:p-6"
      >
        <AddForm
          title="Create User Guide"
          description="Create a guide section with grouped navigation and rich content."
          submitLabel={isSubmitting ? "Saving..." : "Save User Guide"}
          onCancel={handleClose}
          onSubmit={handleSubmit}
        >
          <div className="max-h-[72vh] overflow-y-auto pr-2 custom-scrollbar">
            <UserGuideForm
              data={formData}
              groupOptions={groupOptions}
              roleOptions={roleOptions}
              errors={errors}
              onChange={(key, value) =>
                setFormData((prev) => ({ ...prev, [key]: value }))
              }
            />
          </div>
        </AddForm>
      </Modal>
    </>
  );
}
