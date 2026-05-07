import Joi from "joi";

export const leaveTypeSchema = Joi.object({
  companyId: Joi.string().trim().required().messages({
    "string.empty": "Company is required",
    "any.required": "Company is required",
  }),
  name: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "Leave type name is required",
    "string.min": "Leave type name must be at least 2 characters",
    "any.required": "Leave type name is required",
  }),
  code: Joi.string().trim().min(2).max(10).uppercase().required().messages({
    "string.empty": "Leave type code is required",
    "string.min": "Leave type code must be at least 2 characters",
    "any.required": "Leave type code is required",
  }),
  type: Joi.string().valid("paid", "unpaid").required().messages({
    "any.only": "Type must be either paid or unpaid",
    "any.required": "Type is required",
  }),
  isCarryForward: Joi.boolean().default(false),
  maxCarryForward: Joi.number().min(0).when("isCarryForward", {
    is: true,
    then: Joi.number().required().messages({
      "number.base": "Max carry forward must be a number",
      "number.min": "Max carry forward cannot be negative",
      "any.required": "Max carry forward is required when carry forward is enabled",
    }),
    otherwise: Joi.number().optional().allow(null, ""),
  }),
  maxDays: Joi.number().min(0).required().messages({
    "number.base": "Max days must be a number",
    "number.min": "Max days cannot be negative",
    "any.required": "Max days is required",
  }),
  status: Joi.string().valid("active", "inactive").default("active"),
});
