"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthorization } from "@/hooks/useAuthorization";

import ComponentCard from "@/components/common/ComponentCard";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import EditModal from "@/components/common/EditModal";
import ViewModal from "@/components/common/ViewModal";
import CommonReportTable from "@/components/tables/CommonReportTable";
import Badge from "@/components/ui/badge/Badge";

import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import SearchableSelect from "@/components/form/SearchableSelect";

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
    status: "active" | "inactive";
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

export default function JobsTable({
    data,
    pagination,
    isSuperAdmin,
    companyOptions,
}: JobsTableProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isReady } = useAuthorization();

    // Replace these with actual permissions later if added to DB
    const canEdit = true;
    const canDelete = true;

    const [openView, setOpenView] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [saving, setSaving] = useState(false);

    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [editData, setEditData] = useState<{
        title: string;
        description: string;
        applicationLink: string;
        isAccepting: boolean;
        deadline: string;
        status: "active" | "inactive";
        companyId: string;
    } | null>(null);

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", newPage.toString());
        router.push(`?${params.toString()}`);
    };

    const toLocal = (iso: string | undefined): string =>
        iso ? new Date(iso).toISOString().slice(0, 16) : "";

    const columns = [
        {
            header: "S.No",
            render: (_: Job, index: number) => (pagination.page - 1) * pagination.limit + index + 1,
        },
        ...(isSuperAdmin ? [{
            header: "Company",
            render: (j: Job) => (
                <span className="text-sm font-medium text-gray-900 dark:text-gray-300">
                    {j.companyId?.name || "N/A"}
                </span>
            ),
        }] : []),
        {
            header: "Job Title",
            render: (j: Job) => (
                <span className="text-sm font-semibold capitalize text-brand-600 dark:text-brand-400">
                    {j.title}
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
        {
            header: "Status",
            render: (j: Job) => (
                <Badge color={j.status === "active" ? "success" : "error"}>
                    {j.status === "active" ? "Active" : "Inactive"}
                </Badge>
            ),
        },
    ];

    const handleView = (j: Job) => {
        setSelectedJob(j);
        setOpenView(true);
    };

    const handleEdit = (j: Job) => {
        setSelectedJob(j);
        setEditData({
            title: j.title,
            description: j.description,
            applicationLink: j.applicationLink || "",
            isAccepting: j.isAccepting,
            deadline: toLocal(j.deadline),
            status: j.status,
            companyId: j.companyId?._id || "",
        });
        setOpenEdit(true);
    };

    const handleUpdate = async () => {
        if (!selectedJob || !editData) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/job-postings/${selectedJob._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...editData,
                    deadline: editData.deadline ? new Date(editData.deadline).toISOString() : null
                }),
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
            <div className="border border-gray-200 bg-white dark:border-white/10 dark:bg-slate-900 rounded-xl overflow-hidden mt-6">
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
                            onView={(j) => {
                                setSelectedJob(j);
                                setOpenView(true);
                            }}
                            onEdit={canEdit ? handleEdit : undefined}
                            onDelete={canDelete ? (j) => {
                                setSelectedJob(j);
                                setOpenDelete(true);
                            } : undefined}
                        />
                    </div>
                </div>
            </div>

            {/* VIEW MODAL */}
            <ViewModal isOpen={openView} onClose={() => setOpenView(false)} title="Job Details" size="sm">
                <div className="space-y-4 p-2">
                    <div className="flex flex-col border-b pb-2">
                        <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Title</span>
                        <span className="font-bold text-gray-900 dark:text-white">{selectedJob?.title}</span>
                    </div>

                    <div className="flex flex-col border-b pb-2">
                        <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Company</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{selectedJob?.companyId?.name || "N/A"}</span>
                    </div>

                    <div className="flex flex-col border-b pb-2">
                        <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Description</span>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedJob?.description}</p>
                    </div>

                    {selectedJob?.applicationLink && (
                        <div className="flex flex-col border-b pb-2">
                            <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Application Link</span>
                            <a href={selectedJob.applicationLink} target="_blank" className="text-brand-500 hover:underline text-sm break-all">
                                {selectedJob.applicationLink}
                            </a>
                        </div>
                    )}

                    <div className="flex items-center justify-between border-b pb-2">
                        <span className="text-gray-500 text-xs uppercase tracking-wider">Accepting Applications</span>
                        <Badge color={selectedJob?.isAccepting ? "success" : "error"}>{selectedJob?.isAccepting ? "Yes" : "No"}</Badge>
                    </div>

                    <div className="flex items-center justify-between border-b pb-2">
                        <span className="text-gray-500 text-xs uppercase tracking-wider">Deadline</span>
                        <span className="text-sm font-medium">
                            {selectedJob?.deadline ? new Date(selectedJob.deadline).toLocaleString() : "No Deadline"}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-xs uppercase tracking-wider">Status</span>
                        <Badge color={selectedJob?.status === "active" ? "success" : "error"}>{selectedJob?.status}</Badge>
                    </div>
                </div>
            </ViewModal>

            {/* EDIT MODAL */}
            <EditModal
                isOpen={openEdit}
                onClose={() => setOpenEdit(false)}
                title="Edit Job"
                loading={saving}
                onSubmit={handleUpdate}
            >
                {editData && (
                    <div className="max-h-[75vh] overflow-y-auto p-1 space-y-5 custom-scrollbar pb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">

                            {isSuperAdmin && (
                                <div className="md:col-span-2">
                                    <Label>Company</Label>
                                    <SearchableSelect
                                        options={companyOptions}
                                        value={editData.companyId}
                                        onChange={(val) => setEditData({ ...editData, companyId: val })}
                                    />
                                </div>
                            )}

                            <div className="md:col-span-2">
                                <Label>Job Title <span className="text-red-500">*</span></Label>
                                <Input value={editData.title} onChange={(e) => setEditData({ ...editData, title: e.target.value })} />
                            </div>

                            <div className="md:col-span-2">
                                <Label>Description <span className="text-red-500">*</span></Label>
                                <TextArea rows={4} value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} />
                            </div>

                            <div className="md:col-span-2">
                                <Label>Application Link</Label>
                                <Input placeholder="https://..." value={editData.applicationLink} onChange={(e) => setEditData({ ...editData, applicationLink: e.target.value })} />
                            </div>

                            <div className="md:col-span-1">
                                <Label>Deadline</Label>
                                <Input type="datetime-local" value={editData.deadline} onChange={(e) => setEditData({ ...editData, deadline: e.target.value })} />
                            </div>

                            <div className="md:col-span-1 border border-gray-100 dark:border-gray-800 rounded-lg p-3 flex flex-col justify-center">
                                <div className="flex items-center justify-between">
                                    <Label className="mb-0">Accepting Applications?</Label>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={editData.isAccepting}
                                        onClick={() => setEditData((v) => ({ ...v!, isAccepting: !v!.isAccepting }))}
                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${editData.isAccepting ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
                                            }`}
                                    >
                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${editData.isAccepting ? "translate-x-5" : "translate-x-0"
                                            }`} />
                                    </button>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <Label>Status</Label>
                                <Select
                                    options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]}
                                    value={editData.status}
                                    onChange={(val) => setEditData({ ...editData, status: val as any })}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </EditModal>

            {/* DELETE MODAL */}
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
