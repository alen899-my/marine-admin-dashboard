"use client";

import AddForm from "@/components/common/AddForm";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import SearchableSelect from "@/components/form/SearchableSelect";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useModal } from "@/hooks/useModal";
import { useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

interface AddJobProps {
    className?: string;
    isSuperAdmin: boolean;
    userCompanyId?: string;
    companies: { value: string; label: string }[];
}

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

    const initialFormState = {
        title: "",
        description: "",
        applicationLink: "",
        isAccepting: true,
        deadline: "",
        companyId: !isSuperAdmin ? userCompanyId || "" : "",
    };

    const [formData, setFormData] = useState(initialFormState);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const handleSelectChange = (val: string) => {
        setFormData((prev) => ({ ...prev, companyId: val }));
        if (errors.companyId) setErrors((prev) => ({ ...prev, companyId: "" }));
    };

    const handleClose = () => {
        setErrors({});
        setIsSubmitting(false);
        setFormData(initialFormState);
        closeModal();
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.title.trim()) newErrors.title = "Title is required";
        if (!formData.description.trim()) newErrors.description = "Description is required";

        // If super admin, company is required via the select box
        if (isSuperAdmin && !formData.companyId) {
            newErrors.companyId = "Company selection is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/job-postings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data?.error || "Failed to add Job");
                return;
            }

            toast.success("Job added successfully");
            handleClose();
            router.refresh();
        } catch (error) {
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

            <Modal isOpen={isOpen} onClose={handleClose} className="w-full max-w-[600px] p-6">
                <AddForm
                    title="Add New Job"
                    description="Enter Job Details."
                    submitLabel={isSubmitting ? "Adding..." : "Add Job"}
                    onCancel={handleClose}
                    onSubmit={handleSubmit}
                >
                    <div className="max-h-[70vh] overflow-y-auto px-1 pb-4">
                        <ComponentCard title="Details">
                            <div className="space-y-4">

                                {isSuperAdmin && (
                                    <div>
                                        <Label>Company <span className="text-red-500">*</span></Label>
                                        <SearchableSelect
                                            options={companies}
                                            value={formData.companyId}
                                            onChange={handleSelectChange}
                                            placeholder="Search Company..."
                                            error={!!errors.companyId}
                                        />
                                        {errors.companyId && <p className="text-xs text-red-500 mt-1">{errors.companyId}</p>}
                                    </div>
                                )}

                                <div>
                                    <Label>Job Title <span className="text-red-500">*</span></Label>
                                    <Input
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        className={errors.title ? "border-red-500" : ""}
                                    />
                                    {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                                </div>

                                <div>
                                    <Label>Description <span className="text-red-500">*</span></Label>
                                    <TextArea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        className={errors.description ? "border-red-500" : ""}
                                        rows={4}
                                    />
                                    {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
                                </div>

                                <div>
                                    <Label>Application Link</Label>
                                    <Input
                                        name="applicationLink"
                                        value={formData.applicationLink}
                                        onChange={handleChange}
                                        placeholder="e.g. https://forms.google.com/..."
                                        hint="Optional. If provided, overrides internal application system for this job."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Deadline</Label>
                                        <Input
                                            type="datetime-local"
                                            name="deadline"
                                            value={formData.deadline}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5 justify-center">
                                        <Label>Accepting Applications?</Label>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={formData.isAccepting}
                                            onClick={() => setFormData((v) => ({ ...v, isAccepting: !v.isAccepting }))}
                                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${formData.isAccepting ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
                                                }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${formData.isAccepting ? "translate-x-5" : "translate-x-0"
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </ComponentCard>
                    </div>
                </AddForm>
            </Modal>
        </>
    );
}
