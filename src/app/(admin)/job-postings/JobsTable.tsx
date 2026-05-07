"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthorization } from "@/hooks/useAuthorization";
import { Copy, Check } from "lucide-react";

import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import EditModal from "@/components/common/EditModal";
import ViewModal from "@/components/common/ViewModal";
import CommonReportTable from "@/components/tables/CommonReportTable";
import Badge from "@/components/ui/badge/Badge";

import { parseDateInTz } from "@/lib/timezone";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";

import JobPostingForm, { JobFormData, validateJobForm } from "./Jobpostingform";

interface Company {
    _id: string;
    name: string;
}

interface Job {
    _id: string;
    title: string;
    description: string;
    applicationLink?: string;
    isAccepting: boolean;
    deadline?: string;
    companyId: Company;
    createdAt?: string;
}

interface JobsTableProps {
    data: Job[];
    pagination: {
        page: number;
        limit: number;
        totalPages: number;
    };
    isSuperAdmin: boolean;
    companyOptions: { value: string; label: string }[];
}

// ── Timezone helpers ──────────────────────────────────────────────────────────

function utcIsoToLocalDateOnly(iso: string | undefined): string {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function localDateOnlyToUtcIso(dateOnly: string): string | null {
    if (!dateOnly) return null;
    const utcDate = new Date(`${dateOnly}T00:00:00.000Z`);
    return isNaN(utcDate.getTime()) ? null : utcDate.toISOString();
}

function formatDeadlineDisplay(iso: string | undefined): string {
    if (!iso) return "No Deadline";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "No Deadline";
    const day = String(d.getUTCDate()).padStart(2, "0");
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
}
// ─────────────────────────────────────────────────────────────────────────────

export default function JobsTable({
    data,
    pagination,
    isSuperAdmin,
    companyOptions,
}: JobsTableProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { can, isReady } = useAuthorization();

    const canEdit = can("jobs.edit");
    const canDelete = can("jobs.delete");

    const [openView, setOpenView] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [copied, setCopied] = useState(false);

    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [editData, setEditData] = useState<JobFormData | null>(null);

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", newPage.toString());
        router.push(`?${params.toString()}`);
    };

    const handleCopyLink = (link: string) => {
        navigator.clipboard.writeText(link).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const columns = [
        {
            header: "S.No",
            render: (_: Job, index: number) =>
                (pagination.page - 1) * pagination.limit + index + 1,
        },
        ...(isSuperAdmin
            ? [{
                  header: "Company",
                  render: (j: Job) => (
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-300">
                          {j.companyId?.name || "N/A"}
                      </span>
                  ),
              }]
            : []),
        {
            header: "Job Title",
            render: (j: Job) => (
                <span className="text-sm font-medium capitalize text-gray-900 dark:text-gray-300">
                    {j.title}
                </span>
            ),
        },
        {
    header: "Deadline",
    render: (j: Job) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
            {formatDeadlineDisplay(j.deadline)}
        </span>
    ),
},
        {
            header: "Accepting",
            render: (j: Job) => (
                <Badge color={j.isAccepting ? "success" : "error"}>
                    {j.isAccepting ? "Yes" : "No"}
                </Badge>
            ),
        },
    ];

    const handleView = (j: Job) => {
        setSelectedJob(j);
        setCopied(false);
        setOpenView(true);
    };

    const handleEdit = (j: Job) => {
        setSelectedJob(j);
        setEditErrors({});
        setEditData({
            title: j.title,
            description: j.description,
            applicationLink: j.applicationLink || "",
            isAccepting: j.isAccepting,
            deadline: utcIsoToLocalDateOnly(j.deadline),
            companyId: j.companyId?._id || "",
        });
        setOpenEdit(true);
    };

    const handleUpdate = async () => {
        if (!selectedJob || !editData) return;

        const validationErrors = validateJobForm(editData, isSuperAdmin);
        if (Object.keys(validationErrors).length > 0) {
            setEditErrors(validationErrors);
            return;
        }

        setSaving(true);
        try {
            const deadlineUtc = localDateOnlyToUtcIso(editData.deadline);
            const res = await fetch(`/api/job-postings/${selectedJob._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...editData, deadline: deadlineUtc }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error);
            }
            toast.success("Job updated");
            setOpenEdit(false);
            router.refresh();
        } catch (err: any) {
            toast.error(err.message || "Update failed");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedJob) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/job-postings/${selectedJob._id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error();
            toast.success("Job completely removed");
            setOpenDelete(false);
            router.refresh();
        } catch {
            toast.error("Delete failed");
        } finally {
            setIsDeleting(false);
        }
    };

    if (!isReady) return null;

    return (
        <>
            {/* TABLE */}
            <div className="max-w-full overflow-x-auto">
                <div className="min-w-[1200px]">
                    <CommonReportTable
                        data={data}
                        columns={columns}
                        loading={false}
                        currentPage={pagination.page}
                        totalPages={pagination.totalPages}
                        onPageChange={handlePageChange}
                        onRowClick={handleView}
                        onView={(j) => { setSelectedJob(j); setOpenView(true); }}
                        onEdit={canEdit ? handleEdit : undefined}
                        onDelete={
                            canDelete
                                ? (j) => { setSelectedJob(j); setOpenDelete(true); }
                                : undefined
                        }
                    />
                </div>
            </div>

            {/* ── VIEW MODAL ── */}
            <ViewModal
                isOpen={openView}
                onClose={() => setOpenView(false)}
                title="Job Details"
                headerRight={
                    selectedJob && (
                        <div className="flex items-center gap-2 text-lg text-gray-900 dark:text-white">
                            <span className="font-bold">{selectedJob.title}</span>
                        </div>
                    )
                }
            >
                <div className="text-[13px] py-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                        <section className="space-y-1.5">
                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b">
                                Basic Information
                            </h3>
                            <div className="flex justify-between gap-4">
                                <span className="text-gray-500 shrink-0">Title</span>
                                <span className="font-medium text-right">
                                    {selectedJob?.title || "-"}
                                </span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span className="text-gray-500 shrink-0">Company</span>
                                <span className="font-medium text-right">
                                    {selectedJob?.companyId?.name || "N/A"}
                                </span>
                            </div>
                        </section>

                        <section className="space-y-1.5">
                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b">
                                Status
                            </h3>
                            <div className="flex justify-between gap-4">
                                <span className="text-gray-500 shrink-0">Accepting Applications</span>
                                <Badge color={selectedJob?.isAccepting ? "success" : "error"}>
                                    {selectedJob?.isAccepting ? "Yes" : "No"}
                                </Badge>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span className="text-gray-500 shrink-0">Deadline</span>
                                <span className="font-medium text-right">
                                    {formatDeadlineDisplay(selectedJob?.deadline)}
                                </span>
                            </div>
                        </section>

                        <section className="space-y-1.5 md:col-span-2">
                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b">
                                Description
                            </h3>
                            <div
                                className="rte-content text-sm text-gray-700 dark:text-gray-300"
                                dangerouslySetInnerHTML={{ __html: selectedJob?.description || "" }}
                            />
                        </section>

                        {selectedJob?.applicationLink && (
                            <section className="space-y-1.5 md:col-span-2">
                                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b">
                                    Application Link
                                </h3>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={selectedJob.applicationLink}
                                        target="_blank"
                                        className="text-brand-500 hover:underline truncate"
                                        title={selectedJob.applicationLink}
                                    >
                                        {selectedJob.applicationLink}
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => handleCopyLink(selectedJob.applicationLink!)}
                                        className="shrink-0 text-gray-400 hover:text-brand-500 transition-colors"
                                        title="Copy link"
                                    >
                                        {copied
                                            ? <Check size={20} className="text-green-500" />
                                            : <Copy size={20} />
                                        }
                                    </button>
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </ViewModal>

            {/* ── EDIT MODAL ── */}
            <EditModal
                isOpen={openEdit}
                onClose={() => { setOpenEdit(false); setEditErrors({}); }}
                title="Edit Job"
                loading={saving}
                onSubmit={handleUpdate}
            >
                {editData && (
                    <div className="max-h-[75vh] overflow-y-auto p-1 custom-scrollbar pb-6">
                        <JobPostingForm
                            data={editData}
                            onChange={(updated) => {
                                setEditData(updated);
                                if (Object.keys(editErrors).length > 0) {
                                    setEditErrors(validateJobForm(updated, isSuperAdmin));
                                }
                            }}
                            errors={editErrors}
                            isSuperAdmin={isSuperAdmin}
                            companies={companyOptions}
                            mode="edit"
                        />
                    </div>
                )}
            </EditModal>

            {/* ── DELETE MODAL ── */}
            <ConfirmDeleteModal
                description="Are you sure you want to completely remove this job posting? This action cannot be undone."
                isOpen={openDelete}
                onClose={() => setOpenDelete(false)}
                onConfirm={handleDelete}
                loading={isDeleting}
            />
        </>
    );
}