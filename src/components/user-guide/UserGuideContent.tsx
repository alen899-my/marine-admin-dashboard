"use client";

import { useAuthorization } from "@/hooks/useAuthorization";
import {
    LayoutDashboard,
    ClipboardList,
    Database,
    FileCheck,
    ShieldCheck,
    Sun,
    Anchor,
    Waves,
    Ship,
    Building2,
    Users2,
    Package,
    BarChart3,
    Flag,
    BookOpen,
    ChevronDown,
    Info,
} from "lucide-react";
import React, { useState, useRef } from "react";

type Step = { text: string; superAdminOnly?: true; adminOnly?: true };

type GuideSection = {
    id: string;
    title: string;
    icon: React.ReactNode;
    group?: string;
    steps: Step[];
    tip?: string;
    requiredPermission?: string;
};

const guideSections: GuideSection[] = [
    // --- Overview ---
    {
        id: "dashboard",
        title: "Dashboard",
        group: "Overview",
        icon: <LayoutDashboard size={20} />,
        steps: [
            { text: "After logging in, you land on the Dashboard automatically." },
            { text: "Review the metric cards at the top — they show counts for active Vessels, Voyages, Reports, and more.", adminOnly: true },
            {
                text: "Use the Company filter dropdown at the top-right to narrow metrics to a specific company.",
                superAdminOnly: true,
            },
            { text: "Click any metric card to navigate directly to that module's list." },
        ],
    },

    // --- Reports ---
    {
        id: "daily-noon-report",
        title: "Daily Noon Report",
        group: "Reports",
        icon: <Sun size={20} />,
        steps: [
            { text: "Go to Reports → Daily Noon Report from the sidebar." },
            { text: "Click Add Report (or the + button) to open the report form." },
            { text: "Select the Vessel and Voyage, then fill in the date, position (lat/lon), speed, and fuel consumption fields." },
            { text: "Submit the form. The report will appear in the list with its submission date." },
            { text: "To view or edit an existing report, click on its row in the table." },
        ],
        tip: "Noon reports must be submitted daily per active voyage. Ensure a voyage is created before submitting.",
    },
    {
        id: "departure-report",
        title: "Departure Report",
        group: "Reports",
        icon: <Anchor size={20} />,
        steps: [
            { text: "Go to Reports → Departure Report from the sidebar." },
            { text: "Click Add Report to open the departure form." },
            { text: "Select the Vessel and Voyage, then enter the departure port, date/time, and cargo or ballast condition." },
            { text: "Fill in the fuel on board (FOB) figures at departure." },
            { text: "Submit the form. The record will be linked to the selected voyage automatically." },
        ],
        tip: "A departure report should be the first report filed at the start of any voyage leg.",
    },
    {
        id: "arrival-report",
        title: "Arrival Report",
        group: "Reports",
        icon: <Flag size={20} />,
        steps: [
            { text: "Go to Reports → Arrival Report from the sidebar." },
            { text: "Click Add Report." },
            { text: "Select the Vessel and Voyage, then enter the arrival port, ETA, and actual arrival date/time." },
            { text: "Enter berth details and fuel remaining on board (ROB) at arrival." },
            { text: "Submit the form to record the arrival event against the voyage." },
        ],
    },
    {
        id: "nor-report",
        title: "NOR Report",
        group: "Reports",
        icon: <FileCheck size={20} />,
        steps: [
            { text: "Go to Reports → NOR Report from the sidebar." },
            { text: "Click Add Report." },
            { text: "Select the Vessel and Voyage, and enter the NOR tendered date and time." },
            { text: "Enter whether the NOR was accepted, and if so, the acceptance date/time." },
            { text: "Submit the form. The NOR will be linked to the corresponding arrival event." },
        ],
        tip: "NOR (Notice of Readiness) must be tendered before laytime can commence. Always file it promptly after arrival.",
    },
    {
        id: "cargo-stowage",
        title: "Cargo Stowage Report",
        group: "Reports",
        icon: <Package size={20} />,
        steps: [
            { text: "Go to Reports → Cargo Stowage Report from the sidebar." },
            { text: "Click Add Report and select the Vessel and Voyage." },
            { text: "Enter the cargo type, quantity (MT), and stowage location on the vessel." },
            { text: "Upload any Bill of Lading or cargo documents in the attachments section." },
            { text: "Submit the form. The cargo record is now associated with the voyage." },
        ],
    },
    {
        id: "voyage-analysis",
        title: "Voyage Analysis",
        group: "Reports",
        icon: <BarChart3 size={20} />,
        steps: [
            { text: "Go to Reports → Voyage Analysis from the sidebar." },
            { text: "Use the filters to select a Vessel, Voyage, or date range." },
            { text: "Review the performance charts — planned vs. actual speed, fuel consumption per leg, and delay indicators." },
            { text: "Scroll down to see a tabular summary of each voyage leg." },
            { text: "Use the Export button to download the analysis as a report." },
        ],
    },

    // --- Masters ---
    {
        id: "vessels",
        title: "Vessels",
        group: "Masters",
        icon: <Ship size={20} />,
        steps: [
            { text: "Go to Masters → Vessels from the sidebar." },
            { text: "Click Add Vessel to open the vessel form." },
            { text: "Enter the vessel name, IMO number, vessel type, flag, and class." },
            { text: "Assign the vessel to a Company using the dropdown." },
            { text: "Click Save. The vessel is now available to select when creating voyages or reports." },
            { text: "To edit or deactivate a vessel, click the action menu (⋯) on its row." },
        ],
    },
    {
        id: "voyage",
        title: "Voyage",
        group: "Masters",
        icon: <Waves size={20} />,
        steps: [
            { text: "Go to Masters → Voyage from the sidebar." },
            { text: "Click Add Voyage." },
            { text: "Select the Vessel and enter the voyage number, load port, and discharge port." },
            { text: "Set the estimated departure and arrival dates." },
            { text: "Click Save. All reports (Noon, Departure, Arrival, etc.) must be linked to an active voyage." },
            { text: "To mark a voyage as Completed or Cancelled, click the status badge on its row and select the new status." },
        ],
    },
    {
        id: "companies",
        title: "Companies",
        group: "Masters",
        icon: <Building2 size={20} />,
        steps: [
            { text: "Go to Masters → Companies from the sidebar." },
            { text: "Click Add Company." },
            { text: "Enter the company name, contact details, and status (Active/Inactive)." },
            { text: "Click Save. The company will now appear as an option when adding vessels or users." },
            { text: "To edit a company, click its name in the list." },
        ],
    },
    {
        id: "users",
        title: "Users",
        group: "Masters",
        icon: <Users2 size={20} />,
        steps: [
            { text: "Go to Masters → Users from the sidebar." },
            { text: "Click Add User." },
            { text: "Enter the user's full name and email address." },
            { text: "Select a Role from the dropdown — this controls what the user can access." },
            { text: "Assign the user to a Company." },
            { text: "Click Save. The user will receive login credentials via email." },
            { text: "To deactivate a user, click the action menu (⋯) on their row and select Deactivate." },
        ],
    },

    // --- Pre-Arrival ---
    {
        id: "pre-arrival",
        title: "Pre-Arrival Management",
        group: "Pre-Arrival",
        icon: <ClipboardList size={20} />,
        steps: [
            { text: "Go to Pre-Arrival Management from the sidebar." },
            { text: "Click Add Notification." },
            { text: "Select the Vessel and the arrival port, and enter the expected arrival date/time." },
            { text: "Fill in the required port authority fields and attach any mandatory documents." },
            { text: "Submit the notification. Its status will update as the port authority processes it." },
            { text: "Track all open pre-arrival submissions from the main list view." },
        ],
        tip: "Pre-arrival notifications are typically required 24–48 hours before a vessel enters port. Submit early to avoid delays.",
    },

    // --- Roles & Permissions ---
    {
        id: "roles",
        title: "Roles",
        group: "Roles & Permissions",
        icon: <ShieldCheck size={20} />,
        steps: [
            { text: "Go to Roles & Permissions → Roles from the sidebar." },
            { text: "Click Add Role and enter a name for the role (e.g., 'Fleet Manager')." },
            { text: "In the permissions section, tick the permissions this role should have." },
            { text: "Click Save. The role is now available to assign to users." },
            { text: "To update a role's permissions, click its name and edit the permission checkboxes." },
        ],
    },
    {
        id: "permissions",
        title: "Permissions",
        group: "Roles & Permissions",
        icon: <ShieldCheck size={20} />,
        steps: [
            { text: "Go to Roles & Permissions → Permissions from the sidebar." },
            { text: "Browse the full list of permission keys available in the system." },
            { text: "Each permission is shown with its module name and action (e.g., noon.view, vessels.edit)." },
            { text: "To assign a permission to a role, go to the Roles section and edit the relevant role." },
        ],
    },
    {
        id: "resources",
        title: "Resources",
        group: "Roles & Permissions",
        icon: <Database size={20} />,
        steps: [
            { text: "Go to Roles & Permissions → Resources from the sidebar." },
            { text: "Browse the list of system resources that permissions are linked to." },
            { text: "Click Add Resource if you need to register a new resource in the system." },
            { text: "Enter the resource name and description, then save." },
            { text: "The resource will now appear when assigning permissions to roles." },
        ],
    },
];

const groupOrder = [
    "Overview",
    "Reports",
    "Masters",
    "Pre-Arrival",
    "Roles & Permissions",
];

export default function UserGuideContent() {
    const { can, isSuperAdmin, isAdmin, isReady } = useAuthorization();
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
    const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const visibleSections = isReady
        ? guideSections.filter(
            (s) => !s.requiredPermission || can(s.requiredPermission)
        )
        : [];

    const grouped = groupOrder.reduce<Record<string, GuideSection[]>>(
        (acc, group) => {
            const items = visibleSections.filter((s) => s.group === group);
            if (items.length > 0) acc[group] = items;
            return acc;
        },
        {}
    );

    const toggleSection = (id: string) => {
        setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    if (!isReady) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10">
                        <BookOpen size={22} />
                    </span>
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white/90">
                            User Guide
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Step-by-step instructions for the modules available to you
                        </p>
                    </div>
                </div>
            </div>

            {/* Accordion sections */}
            <div className="space-y-6">
                {Object.entries(grouped).map(([group, items]) => (
                    <div key={group}>
                        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3 px-1">
                            {group}
                        </h2>
                        <div className="space-y-3">
                            {items.map((section) => {
                                const isOpen = !!openSections[section.id];
                                const visibleSteps = section.steps.filter((step) => {
                                    if (step.superAdminOnly) return isSuperAdmin;
                                    if (step.adminOnly) return isSuperAdmin || isAdmin;
                                    return true;
                                });
                                return (
                                    <div
                                        key={section.id}
                                        ref={(el) => {
                                            sectionRefs.current[section.id] = el;
                                        }}
                                        className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden"
                                    >
                                        {/* Accordion header */}
                                        <button
                                            onClick={() => toggleSection(section.id)}
                                            className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                                        >
                                            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400 shrink-0">
                                                {section.icon}
                                            </span>
                                            <span className="flex-1 font-semibold text-gray-800 dark:text-white/90">
                                                {section.title}
                                            </span>
                                            <ChevronDown
                                                size={18}
                                                className={`shrink-0 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-brand-500" : ""}`}
                                            />
                                        </button>

                                        {/* Accordion body */}
                                        {isOpen && (
                                            <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800">
                                                <ol className="mt-4 space-y-3">
                                                    {visibleSteps.map((step, i) => (
                                                        <li key={i} className="flex items-start gap-3">
                                                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400 text-xs font-bold shrink-0 mt-0.5">
                                                                {i + 1}
                                                            </span>
                                                            <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                                                {step.text}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ol>

                                                {section.tip && (
                                                    <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-brand-50 dark:bg-brand-500/10 px-4 py-3">
                                                        <Info size={15} className="text-brand-500 dark:text-brand-400 shrink-0 mt-0.5" />
                                                        <p className="text-sm text-brand-600 dark:text-brand-400 leading-relaxed">
                                                            {section.tip}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {visibleSections.length === 0 && (
                    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-10 text-center">
                        <BookOpen className="mx-auto mb-3 text-gray-300 dark:text-gray-600" size={36} />
                        <p className="text-gray-500 dark:text-gray-400">
                            No guide sections are available for your current permissions.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
