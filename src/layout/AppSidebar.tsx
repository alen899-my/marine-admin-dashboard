"use client";
import { useAuthorization } from "@/hooks/useAuthorization";
import {
  Briefcase,
  BookOpen,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Database,
  Ellipsis,
  FileCheck,
  FileText,
  LayoutDashboard,
  Settings,
  ShieldCheck,
} from "lucide-react";
import type { SidebarNotificationCounts } from "@/context/SidebarNotificationContext";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSidebar } from "../context/SidebarContext";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  requiredPermission?: string;
  subItems?: {
    name: string;
    path: string;
    pro?: boolean;
    new?: boolean;
    requiredPermission?: string;
  }[];
};
type BadgeVariant = "red" | "zinc" | "blue";

const variantStyles: Record<BadgeVariant, string> = {
  red: "bg-red-600 dark:bg-red-500 text-white",
  zinc: "bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400",
  blue: "bg-blue-600 dark:bg-blue-500 text-white",
};

interface SidebarBadgeProps {
  count: number;
  variant?: BadgeVariant;
}

export const SidebarBadge = ({ count, variant = "blue" }: SidebarBadgeProps) => {
  if (count <= 0) return null;
  return (
    <span
      className={`ml-2 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold tracking-tight text-gray-600 shadow-sm ${variantStyles[variant]}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
};

const SidebarDot = () => (
  <span className="relative mr-2 inline-flex h-2.5 w-2.5">
    <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600 dark:bg-red-500" />
  </span>
);

const SidebarIconDot = () => (
  <span className="absolute -right-0.5 -top-0.5 inline-flex h-2.5 w-2.5">
    <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600 dark:bg-red-500" />
  </span>
);

const navItems: NavItem[] = [
  {
    icon: <LayoutDashboard size={25} />,
    name: "Dashboard",
    path: "/",
  },
  {
    icon: <ClipboardList size={25} />,
    name: "Reports",
    // Permission for the group (optional)
    subItems: [
      {
        name: "Daily Noon Report",
        path: "/daily-noon-report",
        requiredPermission: "noon.view",
      },
      {
        name: "Departure Report",
        path: "/departure-report",
        requiredPermission: "departure.view",
      },
      {
        name: "Arrival Report",
        path: "/arrival-report",
        requiredPermission: "arrival.view",
      },
      {
        name: "NOR Report",
        path: "/nor",
        requiredPermission: "nor.view",
      },
      {
        name: "Cargo Stowage Report",
        path: "/cargo-stowage-cargo-documents",
        requiredPermission: "cargo.view",
      },
      {
        name: "Voyage Analysis",
        path: "/voyage-analysis-performance",
        requiredPermission: "voyageanalysis.view",
      },
    ],
  },
  {
    icon: <FileCheck size={25} />,
    name: "Pre-Arrival Management",
    path: "/pre-arrival",
    requiredPermission: "prearrival.view",
  },
  {
    icon: <Database size={25} />,
    name: "Masters",
    subItems: [
      {
        name: "Vessels",
        path: "/vessels",
        requiredPermission: "vessels.view",
      },
      {
        name: "Voyage",
        path: "/voyage",
        requiredPermission: "voyage.view",
      },
      {
        name: "Companies",
        path: "/manage-companies",
        requiredPermission: "company.view",
      },
      {
        name: "Users",
        path: "/manage-users",
        requiredPermission: "users.view",
      },
      {
        name: "Crews",
        path: "/crews",
        requiredPermission: "crews.view",
      },
    ],
  },
  {
    icon: <Briefcase size={25} />,
    name: "HR",
    subItems: [
      {
        name: "Job Postings",
        path: "/job-postings",
        requiredPermission: "jobs.view",
      },
      {
        name: "Candidate Profiles",
        path: "/jobs",
        requiredPermission: "candidates.view",
      },
      {
        name: "Contracts",
        path: "/contracts",
        requiredPermission: "contracts.view",
      },
      {
        name: "Onboarding",
        path: "/onboarding",
        requiredPermission: "onboarding.view",
      },
      {
        name: "Compilance expiry",
        path: "/compliance-expiry",
        requiredPermission: "compilance.view",
      },
      {
        name: "Leave Types",
        path: "/leave-type",
        requiredPermission: "leavetype.view",
      },
    ],
  },
  {
    icon: <CircleDollarSign size={25} />,
    name: "Finance",
    subItems: [
      {
        name: "Allowance & Deduction",
        path: "/allowance-deduction",
        requiredPermission: "allowance.deduction.view",
      },
      {
        name: "Salary Head",
        path: "/salary-head",
        requiredPermission: "salary.head.view",
      },
      {
        name: "Payroll",
        path: "/payroll",
        requiredPermission: "payroll.view",
      },
    ],
  },
  {
    icon: <ShieldCheck size={25} />,
    name: "Roles & Permissions",
    subItems: [
      {
        name: "Roles",
        path: "/roles-and-permissions",
        requiredPermission: "roles.view",
      },
      {
        name: "Active Sessions",
        path: "/active-sessions",
        requiredPermission: "sessions.view",
      },
      {
        name: "Permissions ",
        path: "/permissions",
        requiredPermission: "permission.view",
      },
      {
        name: "Resources",
        path: "/resources",
        requiredPermission: "resource.view",
      },
    ],
  },

  {
    icon: <BookOpen size={25} />,
    name: "User Guide",
    subItems: [
      {
        name: "Manage Guides",
        path: "/user-guide-management",
        requiredPermission: "userguide.edit",
      },
      {
        name: "Groups",
        path: "/user-guide-groups",
        requiredPermission: "userguide.edit",
      },
    ],
  },
  {
    icon: <FileText size={25} />,
    name: "Templates",
    subItems: [
      {
        name: "SEA Templates",
        path: "/sea-templates",
        requiredPermission: "templates.view",
      },
    ],
  },
  {
    icon: <Settings size={25} />,
    name: "Settings",
    path: "/settings",
    requiredPermission: "settings.manage",
  },
];

interface AppSidebarProps {
  notificationCounts: SidebarNotificationCounts;
}

const AppSidebar: React.FC<AppSidebarProps> = ({ notificationCounts }) => {
  const {
    isExpanded,
    isMobileOpen,
    isHovered,
    setIsHovered,
    toggleMobileSidebar,
  } = useSidebar();
  const pathname = usePathname();

  const { can, isReady, isAuthenticated } = useAuthorization();

  const filteredNavItems = useMemo(() => {
    if (!isReady || !isAuthenticated) return [];

    return navItems.reduce<NavItem[]>((acc, item) => {
      // Check parent permission if it exists
      if (item.requiredPermission && !can(item.requiredPermission)) {
        return acc;
      }

      // Handle logic for items with sub-items
      if (item.subItems) {
        const visibleSubItems = item.subItems.filter(
          (sub) => !sub.requiredPermission || can(sub.requiredPermission),
        );

        // Only add the parent if it has at least one visible sub-item
        if (visibleSubItems.length > 0) {
          acc.push({ ...item, subItems: visibleSubItems });
        }
      } else {
        // Simple link item
        acc.push(item);
      }

      return acc;
    }, []);
  }, [can, isReady, isAuthenticated]);

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {},
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    let submenuMatched = false;
    filteredNavItems.forEach((nav, index) => {
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({ type: "main", index });
            submenuMatched = true;
          }
        });
      }
    });

    if (!submenuMatched && openSubmenu?.type === "main") {
      // Optional: keep open if you prefer, or close if no path matches
    }
  }, [pathname, isActive, filteredNavItems]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prev) => {
      if (prev?.type === menuType && prev?.index === index) return null;
      return { type: menuType, index };
    });
  };

  const getSubItemNotificationCount = useCallback(
    (subItemName: string) => {
      if (subItemName === "Compilance expiry") {
        return notificationCounts.complianceExpiry;
      }
      if (subItemName === "Contracts") {
        return notificationCounts.contracts;
      }
      if (subItemName === "Onboarding") {
        return notificationCounts.onboarding;
      }
      if (subItemName === "Candidate Profiles") {
        return notificationCounts.candidateProfiles;
      }
      return 0;
    },
    [notificationCounts],
  );

  const hasSubItemNotifications = useCallback(
    (nav: NavItem) =>
      !!nav.subItems?.some(
        (subItem) => getSubItemNotificationCount(subItem.name) > 0,
      ),
    [getSubItemNotificationCount],
  );

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-2">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group w-full ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={`${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                } relative`}
              >
                {nav.icon}
                {hasSubItemNotifications(nav) &&
                  !isExpanded &&
                  !isHovered &&
                  !isMobileOpen && <SidebarIconDot />}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="ml-auto flex items-center">
                  {hasSubItemNotifications(nav) && <SidebarDot />}
                  <ChevronDown
                    className={`w-5 h-5 transition-transform duration-200 ${
                      openSubmenu?.type === menuType &&
                      openSubmenu?.index === index
                        ? "rotate-180 text-brand-500"
                        : ""
                    }`}
                  />
                </span>
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                onClick={() => {
                  if (isMobileOpen) toggleMobileSidebar();
                }}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text`}>{nav.name}</span>
                )}
              </Link>
            )
          )}

          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      onClick={() => {
                        if (isMobileOpen) toggleMobileSidebar();
                      }}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
      <span className="flex items-center justify-between w-full">
  {subItem.name}
  <SidebarBadge
    count={getSubItemNotificationCount(subItem.name)}
    variant={subItem.name === "Compilance expiry" ? "red" : "zinc"}
  />
</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  if (!isReady) return null;

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 hide-scrollbar
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-5 hidden lg:flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-center"}`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image
                priority
                className="dark:hidden"
                src="/images/logo/b.png"
                alt="Logo"
                width={160}
                height={50}
              />
              <Image
                priority
                className="hidden dark:block"
                src="/images/logo/parkora_logo_dark.png"
                alt="Logo"
                width={160}
                height={50}
              />
            </>
          ) : (
            <Image
              priority
              src="/images/logo/p.png"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col flex-grow overflow-y-auto duration-300 ease-linear hide-scrollbar">
        <nav className="mb-6 pb-20">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}
              >
                {isExpanded || isHovered || isMobileOpen ? "" : <Ellipsis />}
              </h2>
              {renderMenuItems(filteredNavItems, "main")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
