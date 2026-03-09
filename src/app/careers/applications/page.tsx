import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import { Metadata } from "next";
import PublicHeader from "@/layout/Publicheader";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Link from "next/link";
import Image from "next/image";
import { getAllMyApplications } from "@/lib/services/applicationService";

export const metadata: Metadata = {
  title: "My Applications",
  description: "View all your crew applications.",
};

// ── Status badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft:     "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
    submitted: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
    reviewing: "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400",
    approved:  "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400",
    rejected:  "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400",
    on_hold:   "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
    archived:  "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
  };
  const label = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] ?? map.draft}`}>
      {label}
    </span>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function MyApplicationsPage() {
  const [, session] = await Promise.all([dbConnect(), auth()]);

  if (!session?.user) {
    redirect(`/signin?redirect=${encodeURIComponent("/careers/applications")}`);
  }

  const applications = await getAllMyApplications(session.user.id);

  return (
    <>
      <PublicHeader />
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

          {/* Breadcrumb + page title */}
          <div className="mb-5">
            <PageBreadcrumb
              pageTitle="My Applications"
              items={[{ label: "Careers", href: "/careers" }]}
            />
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">

            {/* Card Header */}
            <div className="px-4 py-3">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
                    My Applications
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {applications.length} application{applications.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-2 sm:p-4 border-t border-gray-100 dark:border-gray-800">
              {applications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    No applications yet
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs">
                    You haven't submitted any applications yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Rank / Position
                        </th>
                        <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                          Submitted
                        </th>
                        <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                          Updated
                        </th>
                        <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {applications.map((app: any) => (
                        <tr
                          key={app._id}
                          className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                        >
                          {/* Company */}
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              {app.company?.logo ? (
                                <Image
                                  src={app.company.logo}
                                  alt={app.company?.name ?? ""}
                                  width={28}
                                  height={28}
                                  className="rounded-md object-contain flex-shrink-0"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-md bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                </div>
                              )}
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                {app.company?.name ?? "—"}
                              </span>
                            </div>
                          </td>

                          {/* Rank */}
                          <td className="px-3 py-3">
                            <p className="text-gray-600 dark:text-gray-400">{app.rank}</p>
                            {app.positionApplied && (
                              <p className="text-xs text-gray-400 dark:text-gray-500">{app.positionApplied}</p>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-3 py-3">
                            <StatusBadge status={app.status} />
                          </td>

                          {/* Submitted */}
                          <td className="px-3 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap hidden sm:table-cell">
                            {new Date(app.createdAt).toLocaleDateString("en-GB", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </td>

                          {/* Updated */}
                          <td className="px-3 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap hidden sm:table-cell">
                            {new Date(app.updatedAt).toLocaleDateString("en-GB", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </td>

                          {/* Actions */}
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/careers/view/${app._id}?company=${app.company?._id ?? ""}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/20 rounded-lg transition-colors whitespace-nowrap"
                              >
                                View
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </Link>

                              {["draft", "submitted"].includes(app.status) && (
                                <Link
                                  href={`/careers/edit/${app._id}?company=${app.company?._id ?? ""}`}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors whitespace-nowrap"
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Edit
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}