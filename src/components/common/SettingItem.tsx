import React from "react";

interface SettingItemProps {
  title: string;
  description: string | React.ReactNode;
  children: React.ReactNode;
}

const SettingItem: React.FC<SettingItemProps> = ({ title, description, children }) => {
  return (
    <div className="rounded-xl border border-gray-200 p-5 sm:p-6 dark:border-gray-800">
      <div className="flex items-center justify-between gap-4 sm:gap-6">
        <div className="min-w-0 flex-1 space-y-1.5">
          <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h4>
          <div className="max-w-2xl text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            {typeof description === "string" ? <p>{description}</p> : description}
          </div>
        </div>
        <div className="flex-shrink-0">{children}</div>
      </div>
    </div>
  );
};

export default SettingItem;
