import React from "react";

interface TextareaProps {
  id?: string;
  name?: string;
  placeholder?: string;
  rows?: number;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  disabled?: boolean;
  error?: boolean;
  hint?: string;
}

const TextArea: React.FC<TextareaProps> = ({
  id,
  name,
  placeholder = "Enter your message",
  rows = 3,
  value = "",
  onChange,
  className = "",
  disabled = false,
  error = false,
  hint = "",
}) => {
  // Base classes: use a readable text color, and separate placeholder color
  let textareaClasses = [
    "w-full",
    "rounded-lg",
    "border",
    "px-4",
    "py-2.5",
    "text-sm",
    "shadow-theme-xs",
    "focus:outline-hidden",
    "placeholder:text-gray-400", // placeholder muted
    "text-gray-900",            // normal typed text color (light mode)
    "dark:text-white/90",       // typed text color for dark mode
    className,
  ].join(" ");

  if (disabled) {
    textareaClasses +=
      " bg-gray-100 opacity-50 text-gray-500 border-gray-300 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
  } else if (error) {
    textareaClasses +=
      " bg-transparent border-gray-300 focus:border-error-300 focus:ring-3 focus:ring-error-500/10 dark:border-gray-700 dark:bg-gray-900";
  } else {
    textareaClasses +=
      " bg-transparent border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900";
  }

  return (
    <div className="relative">
      <textarea
        id={id}
        name={name}
        placeholder={placeholder}
        rows={rows}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={textareaClasses}
      />
      {hint && (
        <p
          className={`mt-2 text-sm ${
            error ? "text-error-500" : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
};

export default TextArea;
