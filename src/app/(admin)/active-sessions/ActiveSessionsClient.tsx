"use client";

import ComponentCard from "@/components/common/ComponentCard";
import TableCount from "@/components/common/TableCount";
import CommonReportTable from "@/components/tables/CommonReportTable";
import FilterToggleButton from "@/components/common/FilterToggleButton";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { useFilterPersistence } from "@/hooks/useFilterPersistence";
import { formatDate } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useSearchParams, useRouter } from "next/navigation";
import ActiveSessionsFilterWrapper from "./ActiveSessionsFilterWrapper";

interface SessionEntry {
  id: string;
  sessionId: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    profilePicture: string | null;
    status: string;
    company: string | null;
  } | null;
  ip: string | null;
  userAgent: string | null;
  loginAt: string;
  lastSeenAt: string;
}

export default function ActiveSessionsClient({
  currentUserId,
  currentSessionId,
  isSuperAdmin,
  companies,
}: {
  currentUserId: string;
  currentSessionId: string;
  isSuperAdmin: boolean;
  companies: { value: string; label: string }[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isFilterVisible, setIsFilterVisible } = useFilterPersistence("sessions");
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [invalidating, setInvalidating] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      const res = await fetch(`/api/admin/sessions?${params.toString()}`);
      const data = await res.json();
      setSessions(data.sessions || []);
      setPagination({
        page: data.page || 1,
        limit: data.limit || 20,
        total: data.total || 0,
        totalPages: data.totalPages || 1,
      });
    } catch {
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

  useEffect(() => {
    fetchSessions();
  }, [searchParams]);

  const invalidateSession = async (sessionDocId: string) => {
    setInvalidating(sessionDocId);
    try {
      const res = await fetch(
        `/api/admin/sessions/${sessionDocId}/invalidate`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error();
      toast.success("Session invalidated");
      setSessions((prev) => prev.filter((s) => s.id !== sessionDocId));
    } catch {
      toast.error("Failed to invalidate session");
    } finally {
      setInvalidating(null);
    }
  };

  const invalidateAllForUser = async (userId: string) => {
    setInvalidating(`all-${userId}`);
    try {
      const res = await fetch("/api/admin/sessions/invalidate-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error();
      toast.success("All sessions for user invalidated");
      setSessions((prev) => prev.filter((s) => s.user?.id !== userId));
    } catch {
      toast.error("Failed to invalidate sessions");
    } finally {
      setInvalidating(null);
    }
  };

  const parseUA = (ua: string | null) => {
    if (!ua) return "Unknown";
    if (ua.includes("Brave")) return "Brave";
    if (ua.includes("Edg") || ua.includes("Edge")) return "Edge";
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari")) return "Safari";
    return ua.substring(0, 40);
  };

  const columns = [
    {
      header: "S.No",
      render: (_: SessionEntry, index: number) =>
        (pagination.page - 1) * pagination.limit + index + 1,
    },
    {
      header: "User",
      render: (s: SessionEntry) => {
        const isCurrentSession = s.sessionId === currentSessionId;
        return (
          <div>
            <div className="font-medium text-gray-800 dark:text-white flex items-center gap-2">
              {s.user?.fullName ?? "—"}
              {isCurrentSession && (
                <span className="text-xs font-normal text-blue-500">(you)</span>
              )}
            </div>
            <div className="text-xs text-gray-400">{s.user?.email}</div>
            <div className="text-[11px] text-gray-500 font-medium mt-1 uppercase tracking-wider">
              {s.user?.company ?? "—"}
            </div>
          </div>
        );
      },
    },
    {
      header: "Role",
      render: (s: SessionEntry) => {
        const role = s.user?.role ?? "—";
        const getRoleColor = (r: string) => {
          const roleLower = r.toLowerCase();
          if (roleLower === "super-admin") return "error";
          if (roleLower === "admin") return "warning";
          if (roleLower === "company-admin") return "primary";
          if (roleLower === "user") return "success";
          return "info";
        };
        return (
          <Badge color={getRoleColor(role) as any} className="capitalize">
            {role}
          </Badge>
        );
      },
    },
    {
      header: "IP",
      render: (s: SessionEntry) => {
        const displayIp = s.ip?.startsWith("::ffff:") ? s.ip.substring(7) : s.ip;
        return (
          <span className="font-mono text-gray-700 dark:text-gray-300">
            {displayIp === "::1" || displayIp === "127.0.0.1" ? "Localhost" : (displayIp ?? "—")}
          </span>
        );
      },
    },
    {
      header: "Browser",
      render: (s: SessionEntry) => (
        <span className="text-gray-700 dark:text-gray-300">
          {parseUA(s.userAgent)}
        </span>
      ),
    },
    {
      header: "Logged In",
      render: (s: SessionEntry) => (
        <span className="text-gray-700 dark:text-gray-300">
          {formatDate(s.loginAt)}
        </span>
      ),
    },
    {
      header: "Last Seen",
      render: (s: SessionEntry) => (
        <span className="text-gray-700 dark:text-gray-300">
          {formatDate(s.lastSeenAt)}
        </span>
      ),
    },
    {
      header: "Actions",
      render: (s: SessionEntry) => {
        const isCurrentSession = s.sessionId === currentSessionId;
        const isCurrentUser = s.user?.id === currentUserId;
        return (
          <div className="flex items-center gap-2">
            <button
              disabled={isCurrentSession || invalidating === s.id}
              onClick={(e) => {
                e.stopPropagation();
                invalidateSession(s.id);
              }}
              className="rounded px-3 py-1 text-sm font-medium text-red-600 border border-red-300 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              {invalidating === s.id ? "Removing..." : "Revoke"}
            </button>
            {s.user?.id && !isCurrentUser && (
              <button
                disabled={invalidating === `all-${s.user.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  invalidateAllForUser(s.user!.id);
                }}
                className="rounded px-3 py-1 text-sm font-medium text-orange-600 border border-orange-300 hover:bg-orange-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20"
              >
                {invalidating === `all-${s.user.id}`
                  ? "Removing..."
                  : "Revoke All"}
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Active Sessions
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monitor current user sessions, device activity, IP addresses, and login status.
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="w-full flex justify-end sm:w-auto">
            <FilterToggleButton
              isVisible={isFilterVisible}
              onToggle={setIsFilterVisible}
            />
          </div>

          <div className="w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={fetchSessions}
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <ComponentCard
        headerClassName="p-0 px-1"
        title={
          isFilterVisible ? (
            <ActiveSessionsFilterWrapper
              companies={companies}
              isSuperAdmin={isSuperAdmin}
            />
          ) : null
        }
      >
        <div className="flex justify-end me-2 mb-2 pt-4">
          <TableCount count={pagination.total} label="active sessions" />
        </div>

        <div className="border border-gray-200 bg-white text-gray-800 dark:border-white/10 dark:bg-slate-900 dark:text-gray-100 rounded-xl mb-4">
          <div className="max-w-full overflow-x-auto">
            <div className="min-w-[1500px]">
              <CommonReportTable
                data={sessions}
                columns={columns}
                loading={loading}
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </div>
      </ComponentCard>
    </div>
  );
}
