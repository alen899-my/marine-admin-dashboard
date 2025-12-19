"use client";

import ComponentCard from "@/components/common/ComponentCard";
import CommonReportTable from "@/components/tables/CommonReportTable";
import Badge from "@/components/ui/badge/Badge";
import { useCallback, useEffect, useState } from "react";

// --- Types ---
interface IUser {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  lastLogin?: string;
  createdAt: string;
}

// Props Interface
interface UserTableProps {
  refresh: number;
  search: string;
  status: string;
  startDate: string;
  endDate: string;
}

export default function UserTable({
  refresh,
  search,
  status,
  startDate,
  endDate,
}: UserTableProps) {
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 20;

  // --- Helper: Format Date ---
  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });
  };

  // --- Helper: Format Role ---
  const formatRole = (role: string) => {
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // --- Table Columns Definition ---
  const columns = [
    {
      header: "S.No",
      render: (_: IUser, index: number) => (currentPage - 1) * LIMIT + index + 1,
    },
    {
      header: "Full Name",
      render: (u: IUser) => (
        <span className="font-medium text-gray-700 dark:text-gray-200">
          {u.fullName}
        </span>
      ),
    },
    {
      header: "Email",
      render: (u: IUser) => u.email,
    },
    {
      header: "Phone",
      render: (u: IUser) => u.phone || "-",
    },
   
    {
      header: "Status",
      render: (u: IUser) => (
        <Badge color={u.status === "active" ? "success" : "error"}>
          {u.status === "active" ? "Active" : "Inactive"}
        </Badge>
      ),
    },
   
  ];

  // --- Fetch Users ---
  const fetchUsers = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);

        const query = new URLSearchParams({
          page: page.toString(),
          limit: LIMIT.toString(),
          search,
          status,
          startDate,
          endDate,
        });

        const res = await fetch(`/api/users?${query.toString()}`);

        if (!res.ok) throw new Error("Failed to fetch");

        const result = await res.json();

        setUsers(result.data || []);
        setTotalPages(result.pagination?.totalPages || 1);
      } catch (err) {
        console.error(err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    },
    [LIMIT, search, status, startDate, endDate]
  );

  // --- Effects ---

  // Refetch when filters change (reset to page 1)
  useEffect(() => {
    fetchUsers(1);
    setCurrentPage(1);
  }, [fetchUsers]);

  // Refetch when refresh trigger updates (e.g., after adding user)
  useEffect(() => {
    fetchUsers(1);
    setCurrentPage(1);
  }, [refresh, fetchUsers]);

  // Refetch when page changes
  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage, fetchUsers]);

  // --- Render ---
  return (
    <div
      className="border border-gray-200 bg-white text-gray-800
                dark:border-white/10 dark:bg-slate-900 dark:text-gray-100 rounded-xl"
    >
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[1000px]">
          <CommonReportTable
            data={users}
            columns={columns}
            loading={loading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            // Pass empty functions or null if CommonReportTable requires them but we don't use them
            onView={() => {}}
            onEdit={() => {}}
            onDelete={() => {}}
       
          />
        </div>
      </div>
    </div>
  );
}