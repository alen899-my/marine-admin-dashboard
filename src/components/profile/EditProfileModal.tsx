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
      <div className="no-scrollbar relative w-full max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-gray-900 overflow-hidden">
        {/* Fixed Title Section */}
        <div className="p-6 lg:p-10 pb-5">
          <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Edit Profile
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your personal information and security.
          </p>
        </div>

        {/* Form takes full remaining height and uses flex to separate scrolling area from buttons */}
        <form
          onSubmit={handleSave}
          className="flex flex-col flex-1 overflow-hidden"
        >
          {/* Scrollable Input Area */}
          <div className="flex-1 overflow-y-auto px-6 lg:px-10 no-scrollbar">
            <div className="flex flex-col gap-8 lg:flex-row pb-6">
              {/* Left Column: Modern Profile Card */}
              <div className="flex flex-col items-center w-full lg:w-1/3 lg:border-r lg:border-gray-200 lg:dark:border-gray-800 lg:pr-8">
                {/* Profile Image with Upload Button */}
                <div className="relative mb-6">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-900 shadow-lg">
                    {previewImage ? (
                      <Image
                        fill
                        src={previewImage}
                        alt="Profile"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                        <UserIcon size={56} className="text-white" />
                      </div>
                    )}
                  </div>

                  {/* Edit Button - Always Visible */}
                  <label className="absolute bottom-0 right-0 w-10 h-10 bg-brand-500 hover:bg-brand-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg border-4 border-white dark:border-gray-900 transition-colors">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setSelectedFile(e.target.files[0]);
                          setPreviewImage(
                            URL.createObjectURL(e.target.files[0]),
                          );
                        }
                      }}
                    />
                  </label>
                </div>

                {/* User Info */}
                <div className="text-center space-y-3 w-full">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {formData.fullName || "User"}
                    </h2>
                    <Badge>
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        {formData.roleName}
                      </span>
                    </Badge>
                  </div>

                  {formData.companyName && (
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">
                        {formData.companyName}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Inputs */}
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
          </div>

          {/* Fixed Button Section (Inside Form, but outside Scroll Div) */}
          <div className="p-6 lg:px-10    bg-white dark:bg-gray-900">
            <div className="flex items-center gap-3 justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={onClose}
                type="button"
              >
                Cancel
              </Button>
              <Button size="sm" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
