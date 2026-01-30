"use client";
import { User as UserIcon } from "lucide-react"; // Import for the profile icon
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: any) => void;
  initialData: any;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: EditProfileModalProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    roleName: "",
    companyName: "",
    password: "",
    confirmPassword: "",
  });
  const [previewImage, setPreviewImage] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        fullName: initialData.fullName || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        roleName: initialData.role?.name || "Team Member",
        companyName: initialData.company?.name || "Independent", // Populating company name
      }));
      // Replaced string path with empty string logic to trigger the Icon component
      setPreviewImage(initialData.profilePicture || "");
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    setSaving(true);
    try {
      const payload = new FormData();
      payload.append("fullName", formData.fullName);
      payload.append("email", formData.email);
      payload.append("phone", formData.phone);
      if (formData.password) payload.append("password", formData.password);
      if (selectedFile) payload.append("profilePicture", selectedFile);

      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        body: payload,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Update failed");
      }

      const updatedUser = await res.json();
      toast.success("Profile updated successfully!");
      onSuccess(updatedUser);
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[850px] m-4">
      <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-10">
        <div className="mb-8">
          <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Edit Profile
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your personal information and security.
          </p>
        </div>

        <form onSubmit={handleSave}>
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Left Column: Compact Profile */}
            <div className="flex flex-col items-center w-full lg:w-1/3 lg:border-r lg:border-gray-200 lg:dark:border-gray-800 lg:pr-8">
              <div className="relative w-32 h-32 mb-4 rounded-full overflow-hidden border-4 border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                {previewImage ? (
                  <Image
                    fill
                    src={previewImage}
                    alt="Profile"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <UserIcon
                    size={56}
                    className="text-gray-400 dark:text-gray-500"
                  />
                )}
              </div>
              <label className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-brand-500 hover:text-brand-600">
                Update Photo
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setSelectedFile(e.target.files[0]);
                      setPreviewImage(URL.createObjectURL(e.target.files[0]));
                    }
                  }}
                />
              </label>
              <div className="mt-4 text-center">
                <p className="text-lg font-bold text-gray-800 dark:text-white">
                  {formData.fullName || "User"}
                </p>
                <Badge>
                  <span className="uppercase">{formData.roleName}</span>
                </Badge>
                {/* Displaying Company Name below Role */}
                <p className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-wide">
                  {formData.companyName}
                </p>
              </div>
            </div>

            {/* Right Column: Surrounding Inputs */}
            <div className="flex-1">
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="lg:col-span-2">
                  <Label>Full Name</Label>
                  <Input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    maxLength={20}
                  />
                </div>
                <div>
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>Confirm Password</Label>
                  <Input
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-10 lg:justify-end">
            <Button size="sm" variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button size="sm" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
