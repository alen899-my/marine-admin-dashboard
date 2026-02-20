import Link from "next/link";
import React from "react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  pageTitle: string;
  items?: BreadcrumbItem[];
  children?: React.ReactNode;
}

const PageBreadcrumb: React.FC<BreadcrumbProps> = ({ pageTitle, items = [], children }) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div className="flex flex-col gap-1">
        <nav>
          <ol className="flex items-center gap-1.5">
            <li>
              <Link
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"
                href="/"
              >
                Dashboard
                <ChevronRightIcon />
              </Link>
            </li>
            {items.map((item, index) => (
              <li key={index}>
                {item.href ? (
                  <Link
                    className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"
                    href={item.href}
                  >
                    {item.label}
                    <ChevronRightIcon />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    {item.label}
                    <ChevronRightIcon />
                  </span>
                )}
              </li>
            ))}
            <li className="text-xs text-gray-400 dark:text-gray-500 font-medium">
              {pageTitle}
            </li>
          </ol>
        </nav>
        <h2
          className="text-xl font-semibold text-gray-800 dark:text-white/90"
        >
          {pageTitle}
        </h2>
      </div>

      {children && (
        <div className="flex items-center gap-3">
          {children}
        </div>
      )}
    </div>
  );
};


const ChevronRightIcon = () => (
  <svg
    className="stroke-current"
    width="17"
    height="16"
    viewBox="0 0 17 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
      stroke=""
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default PageBreadcrumb;

