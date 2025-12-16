// src/lib/validations/arrivalReportSchema.ts
import Joi from "joi";

export const arrivalReportSchema = Joi.object({
  vesselName: Joi.string()
    .trim()
    .required()
    .messages({
      "string.base": "Vessel name must be a text value",
      "string.empty": "Vessel name is required",
      "any.required": "Vessel name is required",
    }),

  voyageId: Joi.string()
    .trim()
    .required()
    .messages({
      "string.base": "Voyage ID must be a text value",
      "string.empty": "Voyage ID is required",
      "any.required": "Voyage ID is required",
    }),

  portName: Joi.string()
    .trim()
    .required()
    .messages({
      "string.base": "Port name must be a text value",
      "string.empty": "Port name is required",
      "any.required": "Port name is required",
    }),
  reportDate: Joi.string()
    .isoDate()
    .required()
    .messages({
      "string.base": "Report date must be a valid date",
      "string.isoDate": "Report date must be a valid ISO date",
      "string.empty": "Report date is required",
      "any.required": "Report date is required",
    }),

  // ✅ datetime-local (ISO)
  arrivalTime: Joi.string()
    .isoDate()
    .required()
    .messages({
      "string.base": "Arrival time must be a valid date",
      "string.isoDate": "Arrival time must be a valid ISO date (YYYY-MM-DDTHH:mm)",
      "string.empty": "Arrival time is required",
      "any.required": "Arrival time is required",
    }),

  robVlsfo: Joi.number()
    .required()
    .messages({
      "number.base": "ROB VLSFO must be a number",
      "any.required": "ROB VLSFO is required",
    }),

  robLsmgo: Joi.number()
    .required()
    .messages({
      "number.base": "ROB LSMGO must be a number",
      "any.required": "ROB LSMGO is required",
    }),

  // ❌ only optional field
  remarks: Joi.string()
    .allow("")
    .optional()
    .messages({
      "string.base": "Remarks must be a text value",
    }),
});
