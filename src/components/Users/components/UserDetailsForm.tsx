import React from "react";
import RoleComponentCard from "@/components/roles/RoleComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";

interface UserDetailsFormProps {
  formData: any;
  errors: any;
  isEditMode: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onStatusChange: (val: string) => void;
}

export default function UserDetailsForm({
  formData,
  errors,
  isEditMode,
  onChange,
  onStatusChange,
}: UserDetailsFormProps) {
  return (
    <div className="space-y-4">
      <RoleComponentCard title="User Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <Label>Full Name <span className="text-red-500">*</span></Label>
            <Input name="name" value={formData.name} onChange={onChange} className={errors.name ? "border-red-500" : ""} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <Label>Email <span className="text-red-500">*</span></Label>
            <Input type="email" name="email" value={formData.email} onChange={onChange} className={errors.email ? "border-red-500" : ""} />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>
          <div>
            <Label>Phone</Label>
            <Input type="tel" name="phone" value={formData.phone} onChange={onChange} />
          </div>
          <div>
            <Label>Status</Label>
            <Select
              value={formData.status}
              onChange={onStatusChange}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          </div>
          <div>
            <Label>
              {isEditMode ? "New Password" : <>Password <span className="text-red-500">*</span></>}
            </Label>
            <Input
              type="password"
              name="password"
              placeholder={isEditMode ? "Leave blank to keep current" : "••••••••"}
              value={formData.password}
              onChange={onChange}
              className={errors.password ? "border-red-500" : ""}
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>
          <div>
            <Label>
              Confirm Password
              {!isEditMode && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={onChange}
              className={errors.confirmPassword ? "border-red-500" : ""}
            />
            {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
          </div>
        </div>
      </RoleComponentCard>
    </div>
  );
}