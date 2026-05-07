import Joi from "joi";

const salaryHeadEntrySchema = Joi.object({
  label: Joi.string().trim().required().messages({
    "string.empty": "Name is required",
    "any.required": "Name is required",
  }),
  value: Joi.number().min(0).required().messages({
    "number.base": "Amount must be a number",
    "number.min": "Amount cannot be negative",
    "any.required": "Amount is required",
  }),
  type: Joi.string().valid("amount", "percent").default("amount").messages({
    "any.only": "Type must be either amount or percent",
  }),
});

export const salaryHeadSchema = Joi.object({
  title: Joi.string().trim().min(2).max(120).required().messages({
    "string.empty": "Salary head title is required",
    "string.min": "Salary head title must be at least 2 characters",
    "any.required": "Salary head title is required",
  }),
  description: Joi.string().trim().min(3).max(500).required().messages({
    "string.empty": "Description is required",
    "string.min": "Description must be at least 3 characters",
    "any.required": "Description is required",
  }),
  periodFrom: Joi.date().required().messages({
    "date.base": "Period from is required",
    "any.required": "Period from is required",
  }),
  periodTo: Joi.date().min(Joi.ref("periodFrom")).required().messages({
    "date.base": "Period to is required",
    "date.min": "Period to must be on or after period from",
    "any.required": "Period to is required",
  }),
  companyId: Joi.string().required().messages({
    "string.empty": "Company is required",
    "any.required": "Company is required",
  }),
  allowances: Joi.array().items(salaryHeadEntrySchema).default([]),
  deductions: Joi.array().items(salaryHeadEntrySchema).default([]),
  status: Joi.string().valid("active", "inactive").default("active"),
});
