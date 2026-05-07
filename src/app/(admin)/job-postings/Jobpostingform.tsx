"use client";

import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import SimpleDatePicker from "@/components/form/new-datepicker";
import RichTextEditor from "@/components/form/RichTextEditor";
import SearchableSelect from "@/components/form/SearchableSelect";
import { jobPostingSchema } from "@/lib/validations/Jobpostingschema";

export interface JobFormData {
    title: string;
    description: string;
    applicationLink: string;
    isAccepting: boolean;
    deadline: string;           // "YYYY-MM-DD" or ""
    companyId: string;
}

/**
 * Validates JobFormData with Joi.
 * Returns a flat { fieldName: message } map, or {} if valid.
 * Pass isSuperAdmin so companyId is conditionally required.
 */
export function validateJobForm(
    data: JobFormData,
    isSuperAdmin: boolean
): Record<string, string> {
    const { error } = jobPostingSchema.validate(data, {
        abortEarly: false,
        context: { isSuperAdmin },
    });

    if (!error) return {};

    const errors: Record<string, string> = {};
    error.details.forEach((detail) => {
        const key = detail.path[0] as string;
        if (key && !errors[key]) errors[key] = detail.message;
    });
    return errors;
}

interface JobPostingFormProps {
    data: JobFormData;
    onChange: (updated: JobFormData) => void;
    errors?: Record<string, string>;
    isSuperAdmin: boolean;
    companies: { value: string; label: string }[];
    /** "add" hides Application Link and Status fields */
    mode: "add" | "edit";
}

export default function JobPostingForm({
    data,
    onChange,
    errors = {},
    isSuperAdmin,
    companies,
    mode,
}: JobPostingFormProps) {
    const set = (patch: Partial<JobFormData>) => onChange({ ...data, ...patch });

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">

            <div className="md:col-span-2">
    <Label>Company {isSuperAdmin && <span className="text-red-500">*</span>}</Label>
    {isSuperAdmin ? (
        <SearchableSelect
            options={companies}
            value={data.companyId}
            onChange={(val) => set({ companyId: val })}
            placeholder="Search Company..."
            error={!!errors.companyId}
        />
    ) : (
        <Input
            value={companies.find((c) => c.value === data.companyId)?.label ?? data.companyId}
            disabled
            className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
        />
    )}
    {errors.companyId && (
        <p className="text-xs text-red-500 mt-1">{errors.companyId}</p>
    )}
</div>
            {/* Job Title */}
            <div className="md:col-span-2">
                <Label>Job Title <span className="text-red-500">*</span></Label>
                <Input
                    value={data.title}
                    onChange={(e) => set({ title: e.target.value })}
                    className={errors.title ? "border-red-500" : ""}
                />
                {errors.title && (
                    <p className="text-xs text-red-500 mt-1">{errors.title}</p>
                )}
            </div>

            {/* Description */}
           <div className="md:col-span-2">
    <Label>Description <span className="text-red-500">*</span></Label>
    <RichTextEditor
        value={data.description}
        onChange={(val) => set({ description: val })}
        placeholder="Enter job description..."
        error={!!errors.description}
    />
    {errors.description && (
        <p className="text-xs text-red-500 mt-1">{errors.description}</p>
    )}
</div>

            {/* Application Link — edit mode only */}
            {mode === "edit" && (
                <div className="md:col-span-2">
                    <Label>Application Link</Label>
                    <Input
                        placeholder="https://..."
                        value={data.applicationLink}
                        onChange={(e) => set({ applicationLink: e.target.value })}
                        className={errors.applicationLink ? "border-red-500" : ""}
                    />
                    {errors.applicationLink && (
                        <p className="text-xs text-red-500 mt-1">{errors.applicationLink}</p>
                    )}
                </div>
            )}

            {/* Deadline */}
            <div className="md:col-span-1">
                <SimpleDatePicker
                    label="Deadline"
                    value={data.deadline}
                    onChange={(iso) => set({ deadline: iso ? iso.split("T")[0] : "" })}
                    placeholder="DD/MM/YYYY"
                    error={!!errors.deadline}
                    hint={errors.deadline || undefined}
                />
                {!errors.deadline && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Last date candidates can apply. Leave empty for no deadline.
                    </p>
                )}
            </div>

            {/* Accepting Applications toggle */}
            <div className="md:col-span-1 flex flex-col justify-center">
                <div className="flex items-center justify-between">
                    <Label className="mb-0">Accepting Applications?</Label>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={data.isAccepting}
                        onClick={() => set({ isAccepting: !data.isAccepting })}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                            data.isAccepting ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
                        }`}
                    >
                        <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                                data.isAccepting ? "translate-x-5" : "translate-x-0"
                            }`}
                        />
                    </button>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {data.isAccepting
                        ? "Visible to candidates and open for applications."
                        : "Hidden from candidates. No new applications allowed."}
                </p>
            </div>

        </div>
    );
}