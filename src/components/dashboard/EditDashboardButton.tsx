"use client";

import React from "react";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useDashboardLayout } from "./DashboardLayoutContext";
import Button from "@/components/ui/button/Button";
import { Edit3, X } from "lucide-react";

export default function EditDashboardButton() {
  const { can, isReady } = useAuthorization();
  const dashboardLayout = useDashboardLayout();

  if (!isReady) return null;
  if (!can("dashboard.edit")) return null;

  const isEditMode = dashboardLayout?.isEditMode ?? false;

  const handleToggleEdit = () => {
    dashboardLayout?.setEditMode(!isEditMode);
  };

  return (
    <Button
      variant={isEditMode ? "primary" : "outline"}
      size="sm"
      onClick={handleToggleEdit}
      startIcon={isEditMode ? <X size={16} /> : <Edit3 size={16} />}
    >
      {isEditMode ? "Done Editing" : "Edit Dashboard"}
    </Button>
  );
}