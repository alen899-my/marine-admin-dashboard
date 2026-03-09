"use client";

import { User as UserIcon, Pencil, Check, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "react-toastify";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";

interface ProfileUser {
  fullName?: string;
  email?: string;
  phone?: string;
  profilePicture?: string;
  role?: { name: string };
  company?: { name: string };
}

interface ProfileTabProps {
  user: ProfileUser;
  onUserUpdate?: (updated: ProfileUser) => void;
}

export default function ProfileTab({ user: initialUser, onUserUpdate }: ProfileTabProps) {
  const [user, setUser]           = useState(initialUser);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>(initialUser.profilePicture || "");
  const [form, setForm] = useState({
    fullName:        initialUser.fullName || "",
    phone:           initialUser.phone    || "",
    password:        "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedFile(null);
    setPreviewImage(user.profilePicture || "");
    setForm({
      fullName:        user.fullName || "",
      phone:           user.phone    || "",
      password:        "",
      confirmPassword: "",
    });
  };

  const handleSave = async () => {
    if (form.password && form.password !== form.confirmPassword) {
      return toast.error("Passwords do not match");
    }
    setSaving(true);
    try {
      const payload = new FormData();
      payload.append("fullName", form.fullName);
      payload.append("phone",    form.phone);
      if (form.password) payload.append("password",       form.password);
      if (selectedFile)  payload.append("profilePicture", selectedFile);

      const res = await fetch("/api/users/profile", { method: "PATCH", body: payload });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Update failed");
      }
      const updated = await res.json();
      setUser(updated);
      setPreviewImage(updated.profilePicture || "");
      setIsEditing(false);
      setSelectedFile(null);
      onUserUpdate?.(updated);
      toast.success("Profile updated!");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
   <div className="w-full">

      {/* ── Avatar + name row ──────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">

        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            {previewImage ? (
              <Image fill src={previewImage} alt="Profile" className="object-cover" unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UserIcon size={26} className="text-gray-400 dark:text-gray-500" />
              </div>
            )}
          </div>
          {isEditing && (
            <label className="absolute bottom-0 right-0 w-6 h-6 bg-brand-500 hover:bg-brand-600 rounded-full flex items-center justify-center cursor-pointer border-2 border-white dark:border-gray-900 transition-colors shadow">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                if (e.target.files?.[0]) {
                  setSelectedFile(e.target.files[0]);
                  setPreviewImage(URL.createObjectURL(e.target.files[0]));
                }
              }} />
            </label>
          )}
        </div>

        {/* Name + actions */}
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
            {user.fullName || "User"}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
        </div>

        {/* Edit / Save / Cancel */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                <X size={12} /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white transition-all disabled:opacity-60"
              >
                <Check size={12} /> {saving ? "Saving..." : "Save"}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
            >
              <Pencil size={12} /> Edit
            </button>
          )}
        </div>
      </div>

      {/* ── Form fields ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Full Name */}
        <div>
          <Label>Full Name</Label>
          <Input
            type="text"
            name="fullName"
            value={isEditing ? form.fullName : user.fullName || ""}
            onChange={handleChange}
            disabled={!isEditing}
            maxLength={40}
          />
        </div>

        {/* Email — always read-only */}
        <div>
          <Label>Email</Label>
          <Input
            type="email"
            name="email"
            value={user.email || ""}
            onChange={() => {}}
      
          />
        </div>

        {/* Phone */}
        <div>
          <Label>Phone</Label>
          <Input
            type="tel"
            name="phone"
            value={isEditing ? form.phone : user.phone || ""}
            onChange={handleChange}
            disabled={!isEditing}
            placeholder="+1 234 567 890"
          />
        </div>

     
            <div>
              <Label>New Password</Label>
              <Input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
              />
            </div>

            <div className="sm:col-span-2">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
              />
            </div>


      </div>
    </div>
  );
}