import React from "react";
import Checkbox from "@/components/form/input/Checkbox";

interface RoleData {
  _id: string;
  name: string;
  description?: string;
}

interface RoleSelectionListProps {
  rolesList: RoleData[];
  selectedRoleId: string;
  onRoleChange: (roleId: string) => void;
}

export default function RoleSelectionList({ rolesList, selectedRoleId, onRoleChange }: RoleSelectionListProps) {
  if (rolesList.length === 0) {
    return <div className="col-span-full text-center py-4 text-sm text-gray-500 italic">Loading roles...</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-2 mb-4">
      {rolesList.map((role) => {
        const isSelected = selectedRoleId === role._id;
        return (
          <div
            key={role._id}
            onClick={() => onRoleChange(role._id)}
            className={`
              relative flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
              ${isSelected
                ? "border-brand-500 bg-brand-50/50 dark:bg-brand-500/10"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}
            `}
          >
            <Checkbox checked={isSelected} onChange={() => onRoleChange(role._id)} />
            <span
              className={`text-sm font-semibold ${isSelected ? "text-brand-600 dark:text-brand-400" : "text-gray-700 dark:text-gray-200"}`}
            >
              {role.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}