"use client";
import { useAuthorization } from "@/hooks/useAuthorization";
import {
  Boxes,
  Building2,
  ChartSpline,
  ChevronDown,
  Component,
  Ellipsis,
  FileCheck,
  FileText,
  Fingerprint,
  Flag,
  IdCard,
  LayoutDashboard,
  Map,
  Ship,
  SquareArrowDownRight,
  SquareArrowUpLeft,
  Users2,
  Database,
  ShieldCheck,
  ClipboardList,
} from "lucide-react";
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
    name: "Master",
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
];

const AppSidebar: React.FC = () => {
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
          (sub) => !sub.requiredPermission || can(sub.requiredPermission)
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
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
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
                !isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"
              }`}
            >
              <span
                className={`${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className={`menu-item-text`}>{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDown
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
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
                    isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"
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
                      {subItem.name}
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
      <div className={`py-5 hidden lg:flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-center"}`}>
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image className="dark:hidden" src="/images/logo/b.png" alt="Logo" width={160} height={50} />
              <Image className="hidden dark:block" src="/images/logo/parkora_logo_dark.png" alt="Logo" width={160} height={50} />
            </>
          ) : (
            <Image src="/images/logo/p.png" alt="Logo" width={32} height={32} />
          )}
        </Link>
      </div>
      <div className="flex flex-col flex-grow overflow-y-auto duration-300 ease-linear hide-scrollbar">
        <nav className="mb-6 pb-20">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
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