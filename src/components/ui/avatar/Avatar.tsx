import Image from "next/image";
import React from "react";

interface AvatarProps {
  src?: string | null; // URL of the avatar image
  name?: string; // Name to generate initials from if src is missing
  alt?: string; // Alt text for the avatar
  size?: "xsmall" | "small" | "medium" | "large" | "xlarge" | "xxlarge"; // Avatar size
  status?: "online" | "offline" | "busy" | "none"; // Status indicator
  className?: string; // Additional classes
}

const sizeClasses = {
  xsmall: "h-6 w-6 max-w-6 text-[10px]",
  small: "h-8 w-8 max-w-8 text-[12px]",
  medium: "h-10 w-10 max-w-10 text-[14px]",
  large: "h-12 w-12 max-w-12 text-[16px]",
  xlarge: "h-14 w-14 max-w-14 text-[18px]",
  xxlarge: "h-16 w-16 max-w-16 text-[20px]",
};

const statusSizeClasses = {
  xsmall: "h-1.5 w-1.5 max-w-1.5",
  small: "h-2 w-2 max-w-2",
  medium: "h-2.5 w-2.5 max-w-2.5",
  large: "h-3 w-3 max-w-3",
  xlarge: "h-3.5 w-3.5 max-w-3.5",
  xxlarge: "h-4 w-4 max-w-4",
};

const statusColorClasses = {
  online: "bg-success-500",
  offline: "bg-error-400",
  busy: "bg-warning-500",
};

const colors = [
  "bg-brand-100 text-brand-600",
  "bg-pink-100 text-pink-600",
  "bg-cyan-100 text-cyan-600",
  "bg-orange-100 text-orange-600",
  "bg-green-100 text-green-600",
  "bg-purple-100 text-purple-600",
  "bg-yellow-100 text-yellow-600",
  "bg-error-100 text-error-600",
];

const getColorClass = (name: string) => {
  const index = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const Avatar: React.FC<AvatarProps> = ({
  src,
  name = "User",
  alt = "User Avatar",
  size = "medium",
  status = "none",
  className = "",
}) => {
  return (
    <div className={`relative rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden ${sizeClasses[size]} ${!src ? getColorClass(name) : ""} ${className}`}>
      {/* Avatar Image */}
      {src ? (
        <Image
          width="0"
          height="0"
          sizes="100vw"
          src={src}
          alt={alt || name}
          className="object-cover w-full h-full rounded-full"
        />
      ) : (
        <span className="font-bold leading-none">{getInitials(name)}</span>
      )}

      {/* Status Indicator */}
      {status !== "none" && (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-[1.5px] border-white dark:border-gray-900 ${
            statusSizeClasses[size]
          } ${statusColorClasses[status] || ""}`}
        ></span>
      )}
    </div>
  );
};

export default Avatar;
