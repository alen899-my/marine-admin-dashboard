import React from "react";

export type CheckboxVariant = "default" | "success" | "danger";

interface CheckboxProps {
  label?: string;
  checked: boolean;
  className?: string;
  id?: string;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  variant?: CheckboxVariant; // Added variant prop
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  id,
  onChange,
  className = "",
  disabled = false,
  variant = "default",
}) => {
  
  // Define styles based on variant
  const variantStyles = {
    default: "checked:bg-brand-500 border-gray-300 dark:border-gray-700",
    success: "checked:bg-green-600 border-green-500 checked:border-green-500", // Green for Additional
    danger: "checked:bg-red-600 border-red-500 checked:border-red-500",       // Red for Excluded
  };

  return (
    <label
      className={`flex items-center space-x-3 group cursor-pointer ${
        disabled ? "cursor-not-allowed opacity-60" : ""
      }`}
    >
      <div className="relative w-5 h-5">
        <input
          id={id}
          type="checkbox"
          className={`w-5 h-5 appearance-none cursor-pointer border rounded-md disabled:opacity-60 transition-colors 
          ${variantStyles[variant]} 
          ${className}`}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        
        {/* Render Tick for Default and Success */}
        {checked && variant !== "danger" && (
          <svg
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
          >
            <path
              d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
              stroke="white"
              strokeWidth="1.94437"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}

        {/* Render Cross for Danger (Excluded) */}
        {checked && variant === "danger" && (
           <svg 
           className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
           xmlns="http://www.w3.org/2000/svg" 
           width="14" 
           height="14" 
           viewBox="0 0 24 24" 
           fill="none" 
           stroke="white" 
           strokeWidth="3" 
           strokeLinecap="round" 
           strokeLinejoin="round"
         >
           <line x1="18" y1="6" x2="6" y2="18"></line>
           <line x1="6" y1="6" x2="18" y2="18"></line>
         </svg>
        )}

        {/* Disabled Indication (if needed) */}
        {disabled && !checked && (
          <svg
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
          >
            <path
              d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
              stroke="#E4E7EC"
              strokeWidth="2.33333"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      {label && (
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
          {label}
        </span>
      )}
    </label>
  );
};

export default Checkbox;