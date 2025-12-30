// src/lib/validations/arrivalReportSchema.ts
import Joi from "joi";

export const arrivalReportSchema = Joi.object({
  vesselId: Joi.string()
    .required()
    .messages({
      "string.base": "Vessel ID must be a text value",
      "string.empty": "Vessel ID is required",
      "any.required": "Vessel ID is required",
    }),
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

  // ✅ Arrival Time (datetime-local from frontend)
  arrivalTime: Joi.string()
    .required()
    .messages({
      "string.empty": "Arrival time is required",
      "any.required": "Arrival time is required",
    }),

  // ✅ NEW: NOR Time
  norTime: Joi.string()
    .required()
    .messages({
      "string.empty": "Notice of Readiness (NOR) time is required",
      "any.required": "Notice of Readiness (NOR) time is required",
    }),

  // ✅ NEW: Cargo Quantity on Arrival
  arrivalCargoQty: Joi.number()
    .min(0)
    .required()
    .messages({
      "number.base": "Cargo quantity must be a number",
      "number.min": "Cargo quantity cannot be negative",
      "any.required": "Arrival cargo quantity is required",
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
