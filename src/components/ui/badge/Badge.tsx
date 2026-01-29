import React from "react";

type BadgeVariant = "light" | "solid";
type BadgeSize = "sm" | "md";

type BadgeColor =
  | "primary"
  | "secondary"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "light"
  | "dark"
  | "default"
  | "purple"
  | "amber"
  | "teal"
  | "pink"
  |"blue"  
  | "cyan"    
  | "lime"    
  | "emerald" 
  | "rose"    
  | "slate"
  | "orange"  // 1. Energetic / High Attention
  | "indigo"  // 2. Trust / Deep Professional
  | "violet"  // 3. Creative / Specialized
  | "fuchsia" // 4. Distinct / Unique ID
  | "sky"     // 5. Calm / Supplemental
  | "gray";   // 6. Basic Neutral

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  color?: BadgeColor;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  children: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({
  variant = "light",
  color = "primary",
  size = "md",
  startIcon,
  endIcon,
  children,
}) => {
  const baseStyles =
    "inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium transition-colors";

  const sizeStyles = {
    sm: "text-theme-xs",
    md: "text-sm",
  };

  const variants = {
    light: {
      primary: "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400",
      secondary: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400",
      success: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
      error: "bg-error-200 text-error-600 dark:bg-error-500/15 dark:text-error-500",
      warning: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400",
      info: "bg-blue-light-50 text-blue-light-500 dark:bg-blue-light-500/15 dark:text-blue-light-500",
      light: "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80",
      dark: "bg-gray-500 text-white dark:bg-white/5 dark:text-white",
      default: "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80",
      purple: "bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400",
      amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
      teal: "bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400",
      pink: "bg-pink-50 text-pink-600 dark:bg-pink-500/15 dark:text-pink-400",
      blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
      cyan: "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400",
      lime: "bg-lime-50 text-lime-600 dark:bg-lime-500/15 dark:text-lime-400",
      emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
      rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
      slate: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400",
      orange: "bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400",
      indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400",
      violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
      fuchsia: "bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/15 dark:text-fuchsia-400",
      sky: "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",
      gray: "bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400",
    },
    solid: {
      primary: "bg-brand-500 text-white",
      secondary: "bg-indigo-600 text-white",
      success: "bg-success-500 text-white",
      error: "bg-error-500 text-white",
      warning: "bg-warning-500 text-white",
      info: "bg-blue-light-500 text-white",
      light: "bg-gray-400 text-white dark:bg-white/10 dark:text-white/80",
      dark: "bg-gray-700 text-white",
      default: "bg-gray-400 text-white dark:bg-white/10 dark:text-white/80",
      purple: "bg-purple-600 text-white",
      amber: "bg-amber-500 text-white",
      teal: "bg-teal-600 text-white",
      pink: "bg-pink-600 text-white",
      blue: "bg-blue-600 text-white",
      cyan: "bg-cyan-600 text-white",
      lime: "bg-lime-600 text-white",
      emerald: "bg-emerald-600 text-white",
      rose: "bg-rose-600 text-white",
      slate: "bg-slate-600 text-white",
      orange: "bg-orange-500 text-white",
      indigo: "bg-indigo-500 text-white",
      violet: "bg-violet-500 text-white",
      fuchsia: "bg-fuchsia-500 text-white",
      sky: "bg-sky-500 text-white",
      gray: "bg-gray-500 text-white",
    },
  };

  const sizeClass = sizeStyles[size];
  const colorStyles = variants[variant][color];

  return (
    <span className={`${baseStyles} ${sizeClass} ${colorStyles}`}>
      {startIcon && <span className="inline-flex">{startIcon}</span>}
      {children}
      {endIcon && <span className="inline-flex">{endIcon}</span>}
    </span>
  );
};

export default Badge;