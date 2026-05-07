import Joi from "joi";

export const jobPostingSchema = Joi.object({
    companyId: Joi.when("$isSuperAdmin", {
        is: true,
        then: Joi.string().trim().required().messages({
            "string.base": "Company must be a text value",
            "string.empty": "Company selection is required",
            "any.required": "Company selection is required",
        }),
        otherwise: Joi.string().allow("").optional(),
    }),

    title: Joi.string().trim().min(2).max(150).required().messages({
        "string.base": "Job title must be a text value",
        "string.empty": "Job title is required",
        "string.min": "Job title must be at least 2 characters",
        "string.max": "Job title cannot exceed 150 characters",
        "any.required": "Job title is required",
    }),

    description: Joi.string().trim().min(10).required().messages({
        "string.base": "Description must be a text value",
        "string.empty": "Description is required",
        "string.min": "Description must be at least 10 characters",
        "any.required": "Description is required",
    }),

    applicationLink: Joi.string().uri().allow("").optional().messages({
        "string.uri": "Application link must be a valid URL (e.g. https://...)",
    }),

    isAccepting: Joi.boolean().required().messages({
        "boolean.base": "Accepting Applications must be true or false",
        "any.required": "Accepting Applications is required",
    }),

    // "YYYY-MM-DD" or "" — optional
    deadline: Joi.string()
        .pattern(/^\d{4}-\d{2}-\d{2}$/)
        .allow("")
        .optional()
        .messages({
            "string.pattern.base": "Deadline must be a valid date (YYYY-MM-DD)",
        }),

});