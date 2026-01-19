"use client";

import AddForm from "@/components/common/AddForm";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useAuthorization } from "@/hooks/useAuthorization";
import SearchableSelect from "@/components/form/SearchableSelect";
import { useModal } from "@/hooks/useModal";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";


interface AddPermissionButtonProps {
  onSuccess: () => void;
  resourceOptions: { id: string; name: string }[];
   className?: string;
}

interface PermissionEntry {
  name: string;
  slug: string;
  description: string;
  status: string;
}

export default function AddPermissionButton({ onSuccess,resourceOptions ,className}: AddPermissionButtonProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({}); // Error state
  const { can, isReady } = useAuthorization();
  const [resourceId, setResourceId] = useState("");
  
  const [moduleName, setModuleName] = useState("");
  const [hasLoadedResources, setHasLoadedResources] = useState(false);
  const [permissions, setPermissions] = useState<PermissionEntry[]>([
    { name: "", slug: "", description: "", status: "active" },
  ]);


  const addPermissionRow = () => {
    setPermissions([{ name: "", slug: "", description: "", status: "active" }, ...permissions]);
  };

  const removePermissionRow = (index: number) => {
    if (permissions.length > 1) {
      setPermissions(permissions.filter((_, i) => i !== index));
      // Clear errors for the removed index if necessary
      setErrors({});
    }
  };

  const handlePermChange = (index: number, field: keyof PermissionEntry, value: string) => {
    const updated = [...permissions];
    if (field === "slug") {
   
    updated[index][field] = value
      .toLowerCase()
      .replace(/\s+/g, ".")
      .replace(/[^a-z0-9.]/g, "");
  } else if (field === "description") {
    // 3. Limit description to 50 characters
    updated[index][field] = value.substring(0, 50);
  } else {
    updated[index][field] = value;
  }
    setPermissions(updated);
    
    // Clear error for this specific field when user types
    const errorKey = `${index}-${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[errorKey];
        return newErrs;
      });
    }
  };

  const handleClose = () => {
    setModuleName("");
    setResourceId("");
    setPermissions([{ name: "", slug: "", description: "", status: "active" }]);
    setErrors({});
    setIsSubmitting(false);
    closeModal();
  };
  const selectOptions = resourceOptions.map(r => ({
    value: r.id,
    label: r.name
  }));

  const handleSubmit = async () => {
  setErrors({});
  const newErrors: Record<string, string> = {};

  if (!resourceId) newErrors["resourceId"] = "Please select a resource";

  permissions.forEach((p, index) => {
    if (!p.name.trim()) newErrors[`${index}-name`] = "Name required";
    if (!p.slug.trim()) newErrors[`${index}-slug`] = "Slug required";
    if (p.slug && !p.slug.includes(".")) {
      newErrors[`${index}-slug`] = "Format: module.action";
    }
  });

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  setIsSubmitting(true);
  const payload = permissions.map(p => ({ ...p, resourceId }));

  try {
    const res = await fetch("/api/permissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Failed to save");
    }

    toast.success(`${permissions.length} Permissions added successfully`);
    
 
   onSuccess();
    
    // 2. Clear Form and Close Modal
    handleClose(); 
    
  } catch (error: any) {
    toast.error(error.message || "Error creating permissions");
  } finally {
    setIsSubmitting(false);
  }
};
  const canCreate = isReady && can("permission.create");
  if (!isReady || !canCreate) return null;

  return (
    <>
      <Button size="md" 
  variant="primary" 
  onClick={openModal} 
  // Combine both class sets here
  className={`flex gap-2 ${className || ""}`}>
        Create Permissions
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        className="w-full max-w-[95vw] md:max-w-[1050px] p-4 sm:p-6"
      >
        <AddForm
          title="Create  Permissions"
          description="Create a permissions and add multiple access slugs."
          submitLabel={isSubmitting ? "Saving permission..." : "Save All"}
          onCancel={handleClose}
          onSubmit={handleSubmit}
        >
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {/* 1. MODULE DEFINITION */}
            <ComponentCard title="">
              <div className="max-w-md">
                <Label>Resource Name <span className="text-red-500">*</span></Label>
               <SearchableSelect
     options={selectOptions}
      value={resourceId}
      onChange={(val) => {
        setResourceId(val);
        // Fix: Clear the 'resourceId' error key
        if (errors["resourceId"]) setErrors(prev => ({...prev, resourceId: ""}));
      }}
      error={!!errors.resourceId}
      placeholder="Search and select resource..."
    />
    {/* Fix: Check for errors.resourceId instead of errors.moduleName */}
    {errors.resourceId && <p className="text-[10px] text-red-500 mt-1">{errors.resourceId}</p>}
              </div>
            </ComponentCard>

            <ComponentCard title="">
              <div className="space-y-4">
                <div className="flex justify-start pb-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPermissionRow}
                    className="flex items-center gap-1.5 font-bold"
                  >
                    <Plus size={16} />
                    <span>Add New Slug</span>
                  </Button>
                </div>

                {permissions.map((perm, index) => (
                  <div key={index} className="flex flex-col md:flex-row items-start gap-3 rounded-lg group transition-all duration-200 border-b border-gray-100 dark:border-white/5 pb-4 last:border-0">
                    
                    <div className="flex-1 w-full order-last md:order-first">
                      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1.2fr_1.5fr_120px] gap-3">
                        {/* NAME */}
                        <div>
                          <Label className="text-[10px]  font-bold text-gray-500"> Permission Name <span className="text-red-500">*</span></Label>
                          <Input
                            value={perm.name}
                            onChange={(e) => handlePermChange(index, "name", e.target.value)}
                            placeholder="Create Brand"
                            className={errors[`${index}-name`] ? "border-red-500" : ""}
                          />
                          {errors[`${index}-name`] && <p className="text-[10px] text-red-500 mt-1">{errors[`${index}-name`]}</p>}
                        </div>

                        {/* SLUG */}
                        <div>
                          <Label className="text-[10px]  font-bold text-gray-500">Slug <span className="text-red-500">*</span></Label>
                          <Input
                            value={perm.slug}
                            onChange={(e) => handlePermChange(index, "slug", e.target.value)}
                            placeholder="brand.create"
                            className={errors[`${index}-slug`] ? "border-red-500" : ""}
                          />
                          {errors[`${index}-slug`] && <p className="text-[10px] text-red-500 mt-1">{errors[`${index}-slug`]}</p>}
                        </div>

                        {/* DESCRIPTION */}
                        <div>
                          <Label className="text-[10px]  font-bold text-gray-500">Description</Label>
                          <Input
                            value={perm.description}
                            onChange={(e) => handlePermChange(index, "description", e.target.value)}
                            placeholder="Allow users to add Brand"
                          />
                        </div>

                        {/* STATUS */}
                        <div>
                          <Label className="text-[10px]  font-bold text-gray-500">Status</Label>
                          <Select
                            options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]}
                            value={perm.status}
                            onChange={(val) => handlePermChange(index, "status", val)}
                          />
                        </div>
                      </div>
                    </div>

                    {permissions.length > 1 && (
                      <div className="w-full md:w-auto flex justify-end md:pt-6 order-first md:order-last">
                        <button
                          type="button"
                          onClick={() => removePermissionRow(index)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-white/50 dark:bg-slate-800 md:bg-transparent rounded-md"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ComponentCard>
          </div>
        </AddForm>
      </Modal>
    </>
  );
}