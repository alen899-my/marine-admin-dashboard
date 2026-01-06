"use client";
import {
  Boxes,
  ChevronDown,
  Ellipsis,
  FileText,
  Flag,
  LayoutDashboard,
  SquareArrowDownRight,
  SquareArrowUpLeft,
  ShieldCheck,
  Users2,
  Ship,
  Map,
  Building2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useSidebar } from "../context/SidebarContext";
import { useAuthorization } from "@/hooks/useAuthorization";

// 2. Update Type Definition
type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  requiredPermission?: string; // New field for RBAC
  subItems?: { 
    name: string; 
    path: string; 
    pro?: boolean; 
    new?: boolean;
    requiredPermission?: string; // Sub-items can also have permissions
  }[];
};

const navItems: NavItem[] = [
  {
    icon: <LayoutDashboard size={25} />,
    name: "Dashboard",
    path: "/",
    requiredPermission: "dashboard.view",
  },
  {
    icon: <FileText size={25} />,
    name: "Daily Noon Report",
    path: "/daily-noon-report",
    requiredPermission: "noon.view",
  },
  {
    icon: <SquareArrowUpLeft size={25} />,
    name: "Departure Report",
    path: "/departure-report",
    requiredPermission: "departure.view",
  },
  {
    icon: <SquareArrowDownRight size={25} />,
    name: "Arrival Report",
    path: "/arrival-report",
    requiredPermission: "arrival.view",
  },
  {
    icon: <Flag size={25} />,
    name: "NOR Report",
    path: "/nor",
    requiredPermission: "nor.view",
  },
  {
    icon: <Boxes size={25} />,
    name: "Cargo Stowage Report",
    path: "/cargo-stowage-cargo-documents",
    requiredPermission: "cargo.view",
  },
   {
    icon: <Ship size={25} />,
    name: "Vessels",
    path: "/vessels",
    requiredPermission: "vessels.view",
  },
  {
    icon: <Map size={25} />,
    name: "Voyage",
    path: "/voyage",
    requiredPermission: "voyage.view",
  },
  {
    icon:<Users2 size={25}/>,
    name:" Users",
    path:"/manage-users",
    requiredPermission: "users.view",
  },

  {
    icon: <Building2 size={25} />, // ✅ Company Icon
    name: "Companies",
    path: "/manage-companies",      // ✅ Matches your new route
    requiredPermission: "companies.view", // ✅ Matches the RBAC slug
  },

  {
    icon:<ShieldCheck size={25}/>,
    name:" Roles And Permissions",
    path:"/roles-and-permissions",
    requiredPermission: "roles.view", 
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  
  const { can, isReady, isAuthenticated } = useAuthorization();

  const filteredNavItems = useMemo(() => {
  if (!isReady || !isAuthenticated) return [];

  return navItems.reduce<NavItem[]>((acc, item) => {
    // 🔐 Parent permission
    if (item.requiredPermission && !can(item.requiredPermission)) {
      return acc;
    }

    // 🔐 Sub-items
    if (item.subItems) {
      const visibleSubItems = item.subItems.filter(
        (sub) => !sub.requiredPermission || can(sub.requiredPermission)
      );

      if (visibleSubItems.length > 0) {
        acc.push({ ...item, subItems: visibleSubItems });
      }
    } else {
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
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => path === pathname, [pathname]);


  useEffect(() => {
    let submenuMatched = false;
    ["main"].forEach((menuType) => {
  
      filteredNavItems.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive, filteredNavItems]); // Add filteredNavItems dependency

  // Height calculation effect remains the same
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
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (
    items: NavItem[], // Changed arg name to generic 'items'
    menuType: "main" | "others"
  ) => (
    <ul className="flex flex-col gap-2">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group  ${
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
                className={` ${
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
                  className={`ml-auto w-5 h-5 transition-transform duration-200  ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
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
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge `}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge `}
                          >
                            pro
                          </span>
                        )}
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
  if (!isReady) {
  return null; // or skeleton loader
}

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-5 flex  ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-center"
        }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image
                className="dark:hidden"
                src="/images/logo/b.png"
                alt="Logo"
                width={160}
                height={50}
              />
              <Image
                className="hidden dark:block"
                src="/images/logo/parkora_logo_dark.png"
                alt="Logo"
                width={160}
                height={50}
              />
            </>
          ) : (
            <Image
              src="/images/logo/p.png"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  ""
                ) : (
                  <Ellipsis />
                )}
              </h2>
              {/* 7. Pass FILTERED items here */}
              {renderMenuItems(filteredNavItems, "main")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;