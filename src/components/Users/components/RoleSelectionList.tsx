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
  // 1. Find the currently selected role object
  const selectedRole = rolesList.find((r) => r._id === selectedRoleId);
  
  // 2. Check if the selected role is "Super Admin"
  const isSuperAdminSelected = selectedRole?.name?.toLowerCase().replace(/\s+/g, '-') === "super-admin";

  if (rolesList.length === 0) {
    return <div className="col-span-full text-center py-4 text-sm text-gray-500 italic">Loading roles...</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-2 mb-4">
      {rolesList.map((role) => {
        const isSelected = selectedRoleId === role._id;
        
        // 3. Disable interaction if Super Admin is selected
        // We use isSuperAdminSelected to lock the whole list
        const isDisabled = isSuperAdminSelected;

        return (
          <div
            key={role._id}
            // Prevent click if disabled (unless you specifically want to allow unchecking, but "disable switch" usually implies locking)
            onClick={() => !isDisabled && onRoleChange(role._id)}
            className={`
              relative flex items-center gap-3 p-3 rounded-xl border transition-all select-none
              ${isSelected
                ? "border-brand-500 bg-brand-50/50 dark:bg-brand-500/10"
                : "border-gray-200 dark:border-gray-700"}
              
              ${isDisabled 
                ? "opacity-60 cursor-not-allowed pointer-events-none" // Visual feedback for disabled state
                : "cursor-pointer hover:border-gray-300 dark:hover:border-gray-600"
              }
            `}
          >
            <Checkbox 
              checked={isSelected} 
              onChange={() => {}} // Handled by div click
              className={isDisabled ? "pointer-events-none" : ""}
            />
            <span
              className={`text-sm font-semibold ${isSelected ? "text-brand-600 dark:text-brand-400" : "text-gray-700 dark:text-gray-200"}`}
            >
              {role.name}
            </span>
            
            {/* Optional: Add a lock icon or text if it's the locked Super Admin item */}
            {isSelected && isDisabled && (
               <span className="ml-auto text-xs text-brand-600 font-medium"></span>
            )}
          </div>
        );
      })}
    </div>
  );
}