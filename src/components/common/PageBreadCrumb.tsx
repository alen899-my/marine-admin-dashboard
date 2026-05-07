import Link from "next/link";
import React from "react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  pageTitle: string;
  pageDescription?: string;
  items?: BreadcrumbItem[];
  children?: React.ReactNode;
}

const DEFAULT_PAGE_DESCRIPTIONS: Record<string, string> = {
  "Add Candidate": "Create a new candidate application and capture employment, document, and profile details.",
  "Edit Candidate": "Update candidate application details, documents, and employment information.",
  "View Candidate": "Review the full candidate application profile and submitted supporting details.",
  "Candidate Application": "Complete and submit candidate profile, employment, and document information.",
  "New SEA Template": "Build a new seafarer employment agreement template with sections, branding, and placeholders.",
  "Edit SEA Template": "Update the structure, settings, and branding for an existing SEA template.",
  "SEA Template Preview": "Preview the generated seafarer employment agreement before use.",
  "Crew Details": "View crew profile, documents, employment information, and related records.",
  "Edit Crew": "Update crew profile, documents, employment details, and compliance information.",
  Calendar: "Manage scheduled events, reminders, and operational dates.",
  "Basic Table": "Preview the standard table layout and table UI patterns.",
  "Blank Page": "Starter page area for creating a new admin module.",
  "Line Chart": "Preview line chart components for trend and performance visualization.",
  "Bar Chart": "Preview bar chart components for comparative reporting.",
  "From Elements": "Preview form controls, inputs, and field patterns used across admin modules.",
  Videos: "Preview embedded video components and responsive media layouts.",
  Badges: "Preview status badge styles used for labels and state indicators.",
  Avatar: "Preview avatar components for users, crew, and profile displays.",
  Images: "Preview responsive image components and media presentation patterns.",
  Alerts: "Preview alert components for success, warning, error, and information messages.",
  Modals: "Preview modal dialog patterns used for forms, details, and confirmations.",
  Buttons: "Preview button styles, states, and action patterns.",
};

const PageBreadcrumb: React.FC<BreadcrumbProps> = ({
  pageTitle,
  pageDescription,
  items = [],
  children,
}) => {
  const description = pageDescription ?? DEFAULT_PAGE_DESCRIPTIONS[pageTitle];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-2 ">
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
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          {pageTitle}
        </h2>
        {description && (
          <p className="max-w-3xl text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>

      {children && <div className="flex items-center gap-3">{children}</div>}
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
