"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import AddForm from "@/components/common/AddForm";
import RoleComponentCard from "@/components/roles/RoleComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import { roleSchema } from "@/lib/validations/roleSchema";
import PermissionLegend from "@/components/roles/PermissionLegend";
import { useAuthorization } from "@/hooks/useAuthorization";
import PermissionGrid, { IPermission } from "@/components/roles/PermissionGrid";
// 1. Import the new component
import DashboardWidgetSection from "@/components/roles/DashboardWidgetSection";

interface AddRoleButtonProps {
  onSuccess: () => void;
   className?: string;
}

export default function AddRoleButton({ onSuccess,className }: AddRoleButtonProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [permissionsList, setPermissionsList] = useState<IPermission[]>([]);
  
  const { can, isReady } = useAuthorization();
  
  const [formData, setFormData] = useState({
    name: "",
    status: "active",
    permissions: [] as string[],
  });

  useEffect(() => {
    async function fetchPermissions() {
      try {
        const res = await fetch("/api/permissions");
        if (res.ok) {
          const data = await res.json();
          setPermissionsList(data);
        }
      } catch (err) {
        console.error("Failed to load permissions", err);
      }
    }
    if (isOpen) fetchPermissions();
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => { const newErr = { ...prev }; delete newErr[name]; return newErr; });
    }
  };

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({ ...prev, status: value }));
  };

  const handlePermissionToggle = (slug: string, isChecked: boolean) => {
    setFormData((prev) => {
      const current = prev.permissions;
      const updated = isChecked 
        ? [...current, slug] 
        : current.filter((p) => p !== slug);
      return { ...prev, permissions: updated };
    });
  };

  const handleClose = () => {
    setErrors({});
    setIsSubmitting(false);
    setFormData({ name: "", status: "active", permissions: [] });
    closeModal();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e?.preventDefault) e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const { error } = roleSchema.validate(formData, { abortEarly: false });
    
    if (error) {
      toast.error("Please fill in the required fields.");
      return;
    }

    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create role");

      toast.success("Role created successfully!");
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error("Submit Error:", error);
      toast.error(error.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isReady || !can("roles.create")) return null;

  return (
    <>
      <Button size="md" variant="primary" className={className} onClick={openModal}>Add Role</Button>

      <Modal isOpen={isOpen} onClose={handleClose} className="w-full max-w-[95vw] md:max-w-[850px] p-6">
        <AddForm
          title="Create New Role"
          description="Define a new user role and assign permissions."
          submitLabel={isSubmitting ? "Creating..." : "Create Role"}
          onCancel={handleClose}
          onSubmit={handleSubmit}
          
        >
          <div className="max-h-[70vh] overflow-y-auto p-1 space-y-8">
            
            {/* 1. Role Info */}
            <RoleComponentCard title=""  className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>Role Name <span className="text-red-500">*</span></Label>
                  <Input
                    name="name"
                    placeholder="e.g. Operations Manager"
                    value={formData.name}
                    onChange={handleChange}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    options={[
                      { value: "active", label: "Active" },
                      { value: "inactive", label: "Inactive" },
                    ]}
                    value={formData.status}
                    onChange={handleStatusChange}
                  />
                </div>
              </div>
            </RoleComponentCard>

            {/* 2. Permissions & Widgets */}
            <RoleComponentCard title="Assign Permissions" className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]" legend={<PermissionLegend />}>
              <div className="space-y-8">
                 <div>
                  
                  <PermissionGrid 
                    allPermissions={permissionsList}
                    selectedPermissions={formData.permissions}
                    isReadOnly={false}
                    onToggle={handlePermissionToggle}
                  />
                </div>
                
                {/* A. Dashboard Widgets Section */}
                <DashboardWidgetSection 
                allPermissions={permissionsList}
                  selectedPermissions={formData.permissions}
                  onToggle={handlePermissionToggle}
                />

                <div className="border-t border-gray-100 dark:border-gray-800"></div>

             
               

              </div>
            </RoleComponentCard>

          </div>
        </AddForm>
      </Modal>
    </>
  );
}