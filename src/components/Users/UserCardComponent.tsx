import React, { useState } from "react";

interface UserCardComponentProps {
  userDetails: React.ReactNode;
  userRoles: React.ReactNode;
  className?: string;

  //  Made optional to support both controlled and uncontrolled modes
  activeTab?: "details" | "roles";
  onTabChange?: (tab: "details" | "roles") => void;
}

const UserCardComponent: React.FC<UserCardComponentProps> = ({
  userDetails,
  userRoles,
  className = "",
  activeTab,
  onTabChange,
}) => {
  // 1. Internal state fallback (if parent doesn't provide props)
  const [internalTab, setInternalTab] = useState<"details" | "roles">(
    "details",
  );

  // 2. Determine which tab to show (Parent prop takes priority)
  const currentTab = activeTab || internalTab;

  // 3. Handle click
  const handleTabClick = (tab: "details" | "roles") => {
    if (onTabChange) {
      onTabChange(tab); // Notify parent
    } else {
      setInternalTab(tab); // Update internal state
    }
  };

  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      {/* Tab Header */}
      <div className="flex border-b border-gray-100 dark:border-gray-800">
        {/* DETAILS TAB */}
        <button
          type="button"
          onClick={() => handleTabClick("details")}
          className={`px-6 py-4 text-sm font-medium transition-colors relative ${
            currentTab === "details"
              ? "text-brand-500"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          User Details
          {currentTab === "details" && (
            <span className="absolute bottom-0 left-0 h-0.5 w-full bg-brand-500" />
          )}
        </button>

        {/* ROLES TAB */}
        <button
          type="button"
          onClick={() => handleTabClick("roles")}
          className={`px-6 py-4 text-sm font-medium transition-colors relative ${
            currentTab === "roles"
              ? "text-brand-500"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          Roles & Permissions
          {currentTab === "roles" && (
            <span className="absolute bottom-0 left-0 h-0.5 w-full bg-brand-500" />
          )}
        </button>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-6">
        <div className="space-y-6 min-h-[420px]">
          {currentTab === "details" ? userDetails : userRoles}
        </div>
      </div>
    </div>
  );
};

export default UserCardComponent;
