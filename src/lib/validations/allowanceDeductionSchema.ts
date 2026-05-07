import Joi from "joi";

export const allowanceDeductionSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 2 characters",
    "any.required": "Name is required",
  }),
  code: Joi.string().trim().min(2).max(20).uppercase().required().messages({
    "string.empty": "Code is required",
    "string.min": "Code must be at least 2 characters",
    "any.required": "Code is required",
  }),
  type: Joi.string().valid("allowance", "deduction").required().messages({
    "any.only": "Type must be either allowance or deduction",
    "any.required": "Type is required",
  }),
  companyId: Joi.string().trim().allow("").optional(),
  description: Joi.string().trim().max(500).allow("").default(""),
  status: Joi.string().valid("active", "inactive").default("active"),
});
