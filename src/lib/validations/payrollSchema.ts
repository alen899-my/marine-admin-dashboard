import Joi from "joi";

const payrollLeaveEntrySchema = Joi.object({
  leaveTypeId: Joi.string().required(),
  leaveTypeCode: Joi.string().required(),
  leaveTypeName: Joi.string().required(),
  leaveTypeMaxDays: Joi.number().min(0).required(),
  status: Joi.string().valid("saved", "pending").default("saved"),
  days: Joi.number().min(0).required().messages({
    "number.base": "Days is required",
    "number.min": "Days cannot be negative",
    "any.required": "Days is required",
  }),
  approvedDays: Joi.number().min(0).required().messages({
    "number.base": "Approved paid days is required",
    "number.min": "Approved paid days cannot be negative",
    "any.required": "Approved paid days is required",
  }),
});

const payrollCrewAllowanceSchema = Joi.object({
  label: Joi.string().trim().required().messages({
    "string.empty": "Allowance name is required",
    "any.required": "Allowance name is required",
  }),
  value: Joi.number().min(0).required().messages({
    "number.base": "Allowance amount is required",
    "number.min": "Allowance amount cannot be negative",
    "any.required": "Allowance amount is required",
  }),
  type: Joi.string().valid("amount", "percent").default("amount"),
});

const payrollCrewDeductionSchema = Joi.object({
  label: Joi.string().trim().required().messages({
    "string.empty": "Deduction name is required",
    "any.required": "Deduction name is required",
  }),
  value: Joi.number().min(0).required().messages({
    "number.base": "Deduction amount is required",
    "number.min": "Deduction amount cannot be negative",
    "any.required": "Deduction amount is required",
  }),
  type: Joi.string().valid("amount", "percent").default("amount"),
});

export const payrollItemSchema = Joi.object({
  applicationId: Joi.string().required(),
  salaryHeadId: Joi.string().allow("", null).optional(),
  leaveEntries: Joi.array().items(payrollLeaveEntrySchema).default([]),
  crewAllowances: Joi.array().items(payrollCrewAllowanceSchema).default([]),
  crewDeductions: Joi.array().items(payrollCrewDeductionSchema).default([]),
  bondedStore: Joi.number().min(0).allow(null).optional().messages({
    "number.base": "Bond is required",
    "number.min": "Bond cannot be negative",
    "any.required": "Bond is required",
  }),
  cashAdvance: Joi.number().min(0).allow(null).optional().messages({
    "number.base": "Cash advance is required",
    "number.min": "Cash advance cannot be negative",
    "any.required": "Cash advance is required",
  }),
  telDeduction: Joi.number().min(0).allow(null).optional().messages({
    "number.base": "Tel is required",
    "number.min": "Tel cannot be negative",
    "any.required": "Tel is required",
  }),
  otherDeductions: Joi.number().min(0).allow(null).optional().messages({
    "number.base": "Others is required",
    "number.min": "Others cannot be negative",
    "any.required": "Others is required",
  }),
  remarks: Joi.string().allow("", null),
});

export const payrollBatchSchema = Joi.array().items(payrollItemSchema);
