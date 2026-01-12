import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import SearchableSelect from "@/components/form/SearchableSelect";
import Select from "@/components/form/Select";
import RoleComponentCard from "@/components/roles/RoleComponentCard";
import { Camera, User as UserIcon } from "lucide-react"; // ✅ Import Icons
import Image from "next/image"; // ✅ Import Next.js Image
import React, { useRef } from "react";

interface UserDetailsFormProps {
  formData: any;
  errors: any;
  isEditMode: boolean;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  onStatusChange: (val: string) => void;
  // ✅ Props for Image Handling
  imagePreview: string | null;
  onImageChange: (file: File) => void;
  companies: { value: string; label: string }[];
  onCompanyChange: (val: string) => void;
  isSuperAdminActor: boolean;
}

export default function UserDetailsForm({
  formData,
  errors,
  isEditMode,
  onChange,
  onStatusChange,
  imagePreview, // ✅ Destructured
  onImageChange, // ✅ Destructured
  companies,
  onCompanyChange,
  isSuperAdminActor,
}: UserDetailsFormProps) {
  // ✅ Ref for hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageChange(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <RoleComponentCard title="">
        <div className="space-y-6">
          {/* ✅ PROFILE PICTURE SECTION */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100 dark:border-gray-700/50">
            <div
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {/* Avatar Circle */}
              <div className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-700 shadow-md overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Profile"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <UserIcon className="w-10 h-10 text-gray-400" />
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/png, image/jpeg, image/jpg, image/webp"
              />
            </div>

            <div className="text-center sm:text-left">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Profile Photo
              </h3>
              <p className="text-xs text-gray-500 mt-1 mb-2">
                This image will be shown on the user's profile.
                <br className="hidden sm:block" />
                Max file size: 2MB. Formats: JPG, PNG, WEBP.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
              >
                Click to upload
              </button>
            </div>
          </div>

          {/* ✅ EXISTING FORM GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label>
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                name="name"
                value={formData.name}
                onChange={onChange}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name}</p>
              )}
            </div>
            <div>
              <Label>
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={onChange}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={onChange}
              />
            </div>
            <div>
              <Label>Company <span className="text-red-500">*</span></Label>
              <SearchableSelect
                options={companies}
                value={formData.company}
                onChange={onCompanyChange}
                placeholder="Search and select company..."
                error={!!errors.company}
              />
              {errors.company && (
                <p className="text-xs text-red-500 mt-1">{errors.company}</p>
              )}
            </div>
            <div>
              <Label>
                {isEditMode ? (
                  "New Password"
                ) : (
                  <>
                    Password <span className="text-red-500">*</span>
                  </>
                )}
              </Label>
              <Input
                type="password"
                name="password"
                placeholder={
                  isEditMode ? "Leave blank to keep current" : "••••••••"
                }
                value={formData.password}
                onChange={onChange}
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password}</p>
              )}
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
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
            {isEditMode && (
              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onChange={onStatusChange}
                  options={[
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                    { value: "banned", label: "Banned" },
                  ]}
                />
              </div>
            )}
          </div>
        </div>
      </RoleComponentCard>
    </div>
  );
}
