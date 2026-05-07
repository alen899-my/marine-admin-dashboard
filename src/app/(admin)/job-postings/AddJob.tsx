"use client";

import AddForm from "@/components/common/AddForm";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useModal } from "@/hooks/useModal";
import { parseDateInTz } from "@/lib/timezone";
import { useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import JobPostingForm, { JobFormData, validateJobForm } from "./Jobpostingform";
import RichTextEditor from "@/components/form/RichTextEditor";
interface AddJobProps {
    className?: string;
    isSuperAdmin: boolean;
    userCompanyId?: string;
    companies: { value: string; label: string }[];
}

function dateOnlyToUtcIso(dateOnly: string): string | null {
    if (!dateOnly) return null;
    const utcDate = new Date(`${dateOnly}T00:00:00.000Z`);
    return isNaN(utcDate.getTime()) ? null : utcDate.toISOString();
}

const makeInitial = (isSuperAdmin: boolean, userCompanyId?: string): JobFormData => ({
    title: "",
    description: "",
    applicationLink: "",
    isAccepting: true,
    deadline: "",
    companyId: !isSuperAdmin ? userCompanyId || "" : "",
});

export default function AddJobButton({
    className,
    isSuperAdmin,
    userCompanyId,
    companies,
}: AddJobProps) {
    const { isOpen, openModal, closeModal } = useModal();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { isReady } = useAuthorization();
    const router = useRouter();

    const [formData, setFormData] = useState<JobFormData>(
        makeInitial(isSuperAdmin, userCompanyId)
    );

    const handleClose = () => {
        setErrors({});
        setIsSubmitting(false);
        setFormData(makeInitial(isSuperAdmin, userCompanyId));
        closeModal();
    };

    const handleSubmit = async () => {
        // Joi validation
        const validationErrors = validateJobForm(formData, isSuperAdmin);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setIsSubmitting(true);
        try {
            const deadlineUtc = dateOnlyToUtcIso(formData.deadline);
            const res = await fetch("/api/job-postings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, deadline: deadlineUtc }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data?.error || "Failed to add Job");
                return;
            }
            toast.success("Job added successfully");
            handleClose();
            router.refresh();
        } catch {
            toast.error("Something went wrong.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isReady) return null;

    return (
        <>
            <Button size="md" variant="primary" className={className} onClick={openModal}>
                Add Job
            </Button>

            <Modal isOpen={isOpen} onClose={handleClose} className="w-full max-w-[900px] p-6">
                <AddForm
                    title="Add New Job"
                    description="Enter Job Details."
                    submitLabel={isSubmitting ? "Adding..." : "Add Job"}
                    onCancel={handleClose}
                    onSubmit={handleSubmit}
                >
                    <div className="max-h-[70vh] overflow-y-auto px-1 pb-4">
                        <ComponentCard title="Details">
                            <JobPostingForm
                                data={formData}
                                onChange={(updated) => {
                                    setFormData(updated);
                                    // Clear field errors live as user types
                                    if (Object.keys(errors).length > 0) {
                                        setErrors(validateJobForm(updated, isSuperAdmin));
                                    }
                                }}
                                errors={errors}
                                isSuperAdmin={isSuperAdmin}
                                companies={companies}
                                mode="add"
                            />
                        </ComponentCard>
                    </div>
                </AddForm>
            </Modal>
        </>
    );
}