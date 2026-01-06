"use client";

import { Building2 } from "lucide-react"; // ✅ Icon for fallback
import Image from "next/image";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";

// --- Components ---
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import ViewModal from "@/components/common/ViewModal";
import CompanyFormModal from "@/components/Companies/CompanyFormModal";
import CommonReportTable from "@/components/tables/CommonReportTable";
import Badge from "@/components/ui/badge/Badge";

// --- Hooks ---
import { useAuthorization } from "@/hooks/useAuthorization";

// --- Types ---
interface ICompany {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  logo?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: {
    fullName: string;
  };
  updatedBy?: {
    fullName: string;
  };
}

interface CompanyTableProps {
  refresh: number;
  search: string;
  status: string;
  startDate: string;
  endDate: string;
  setTotalCount?: Dispatch<SetStateAction<number>>;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function CompaniesTable({
  refresh,
  search,
  status,
  startDate,
  endDate,
  setTotalCount,
}: CompanyTableProps) {
  // --- Data State ---
  const [companies, setCompanies] = useState<ICompany[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Modal States ---
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<ICompany | null>(null);
  const [openView, setOpenView] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<ICompany | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 20;

  const { can } = useAuthorization();
  const canEdit = can("companies.edit");
  const canDelete = can("companies.delete");

  // --- 1. Fetch Companies ---
  const fetchCompanies = useCallback(
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

        const res = await fetch(`/api/companies?${query.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch companies");
        const result = await res.json();

        setCompanies(result.data || []);

        // Update Dynamic Count in Parent
        if (setTotalCount) {
          setTotalCount(result.pagination?.total || result.data?.length || 0);
        }

        setTotalPages(result.pagination?.totalPages || 1);
      } catch (err) {
        console.error(err);
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    },
    [search, status, startDate, endDate, setTotalCount]
  );

  useEffect(() => {
    fetchCompanies(1);
    setCurrentPage(1);
  }, [fetchCompanies, refresh]);

  useEffect(() => {
    fetchCompanies(currentPage);
  }, [currentPage, fetchCompanies]);

  // --- HANDLERS ---
  const handleView = (company: ICompany) => {
    setSelectedCompany(company);
    setOpenView(true);
  };

  const handleEdit = (company: ICompany) => {
    setCompanyToEdit(company);
    setEditModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedCompany) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/companies/${selectedCompany._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();

      setCompanies((prev) => prev.filter((c) => c._id !== selectedCompany._id));

      if (setTotalCount) {
        setTotalCount((prev) => Math.max(0, prev - 1));
      }
      toast.success("Company deleted successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete company");
    } finally {
      setOpenDelete(false);
      setSelectedCompany(null);
      setIsDeleting(false);
    }
  };

  // --- Table Columns ---
  const columns = [
    {
      header: "S.No",
      render: (_: ICompany, index: number) =>
        (currentPage - 1) * LIMIT + index + 1,
    },
    {
      header: "Company Name",
      render: (c: ICompany) => (
        <div className="flex items-center gap-3">
          {/* ✅ Logo Display in Table */}
          <div className="w-9 h-9 relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex-shrink-0">
            {c.logo ? (
              <Image
                src={c.logo}
                alt={c.name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="w-5 h-5 text-gray-400" />
              </div>
            )}
          </div>
          <span className="font-medium text-gray-700 dark:text-gray-200">
            {c.name}
          </span>
        </div>
      ),
    },
    {
      header: "Email",
      render: (c: ICompany) => c.email,
    },
    {
      header: "Phone",
      render: (c: ICompany) => c.phone || "-",
    },
    {
      header: "Status",
      render: (c: ICompany) => (
        <Badge color={c.status === "active" ? "success" : "error"}>
          {c.status === "active" ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <div className="border border-gray-200 bg-white text-gray-800 dark:border-white/10 dark:bg-slate-900 dark:text-gray-100 rounded-xl">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1000px]">
            <CommonReportTable
              data={companies}
              columns={columns}
              loading={loading}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              onView={handleView}
              onEdit={canEdit ? handleEdit : undefined}
              onDelete={
                canDelete
                  ? (c: ICompany) => {
                      setSelectedCompany(c);
                      setOpenDelete(true);
                    }
                  : undefined
              }
              onRowClick={handleView}
            />
          </div>
        </div>
      </div>

      {/* --- VIEW MODAL --- */}
      <ViewModal
        isOpen={openView}
        onClose={() => setOpenView(false)}
        title="Company Details"
      >
        <div className="text-[13px] py-2">
          <div className="flex flex-col gap-y-8">
            {/* ================= SECTION 1: COMPANY DETAILS ================= */}
            <section className="space-y-4">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-100 dark:border-white/10">
                Company Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {/* Top Left: Primary Details */}
                <div className="space-y-2">
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500 shrink-0">Company Name</span>
                    <span className="font-medium text-right text-gray-900 dark:text-gray-100">
                      {selectedCompany?.name ?? "-"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500 shrink-0">
                      Email Address
                    </span>
                    <span className="font-medium text-right break-all text-gray-900 dark:text-gray-100">
                      {selectedCompany?.email ?? "-"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500 shrink-0">Phone Number</span>
                    <span className="font-medium text-right text-gray-900 dark:text-gray-100">
                      {selectedCompany?.phone ?? "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-gray-500 shrink-0">Status</span>
                    <Badge
                      color={
                        selectedCompany?.status === "active"
                          ? "success"
                          : "error"
                      }
                    >
                      {selectedCompany?.status === "active"
                        ? "Active"
                        : "Inactive"}
                    </Badge>
                  </div>
                </div>

                {/* Top Right: Logo */}
                <div className="flex justify-between md:justify-end items-start gap-4">
                  <span className="text-gray-500 shrink-0 md:hidden">
                    Company Logo
                  </span>
                  <div className="w-24 h-24 relative rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                    {selectedCompany?.logo ? (
                      <Image
                        src={selectedCompany.logo}
                        alt="Logo"
                        fill
                        className="object-contain p-2"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="w-10 h-10 text-gray-300" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom: Registered Address (Full Width) */}
                <div className="md:col-span-2 space-y-1.5">
                  <span className="text-gray-500">Registered Address</span>
                  <p className="leading-relaxed font-medium text-gray-900 dark:text-gray-100">
                    {selectedCompany?.address ?? "-"}
                  </p>
                </div>
              </div>
            </section>

            {/* ================= SECTION 2: SYSTEM INFORMATION ================= */}
            <section className="pt-4 border-t border-gray-100 dark:border-white/10 space-y-3">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                System Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 text-[12px]">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Created By</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {selectedCompany?.createdBy?.fullName || "System"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Created At</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {formatDate(selectedCompany?.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Last Updated By</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {selectedCompany?.updatedBy?.fullName || "-"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Last Updated At</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {formatDate(selectedCompany?.updatedAt)}
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </ViewModal>

      {/* --- EDIT MODAL --- */}
      <CompanyFormModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={() => fetchCompanies(currentPage)}
        initialData={companyToEdit}
      />

      {/* --- DELETE MODAL --- */}
      <ConfirmDeleteModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleDelete}
        title="Delete Company"
        description={
    <>
      Are you sure you want to delete <span className="font-bold text-gray-900 dark:text-white">{selectedCompany?.name}</span>? This action cannot be undone.
    </>
  }
        loading={isDeleting}
      />
    </>
  );
}
