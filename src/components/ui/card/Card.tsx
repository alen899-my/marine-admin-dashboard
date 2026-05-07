"use client";

import React, { ReactNode } from "react";
import { MoreVertical } from "lucide-react";

interface CardProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> & {
  Header: React.FC<CardHeaderProps>;
  Body: React.FC<CardBodyProps>;
  Footer: React.FC<CardFooterProps>;
} = ({ children, className = "", noPadding = false }) => {
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm ${className}`}>
      {children}
    </div>
  );
};

const CardHeader: React.FC<CardHeaderProps> = ({ 
  title, 
  subtitle, 
  icon, 
  action, 
  className = "" 
}) => {
  return (
    <div className={`flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 ${className}`}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white">{title}</h3>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && (
        <div className="flex items-center gap-2">
          {action}
        </div>
      )}
    </div>
  );
};

const CardBody: React.FC<CardBodyProps> = ({ children, className = "" }) => {
  return (
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  );
};

const CardFooter: React.FC<CardFooterProps> = ({ children, className = "" }) => {
  return (
    <div className={`flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl ${className}`}>
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
