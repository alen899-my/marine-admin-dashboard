import Joi from "joi";

export const departureReportSchema = Joi.object({
  vesselName: Joi.string().trim().required().messages({
    "string.base": "Vessel name must be a valid text",
    "string.empty": "Vessel name is required",
    "any.required": "Vessel name is required",
  }),

  voyageId: Joi.string().trim().required().messages({
    "string.base": "Voyage ID must be a valid text",
    "string.empty": "Voyage ID is required",
    "any.required": "Voyage ID is required",
  }),

  portName: Joi.string().trim().required().messages({
    "string.base": "Port name must be a valid text",
    "string.empty": "Port name is required",
    "any.required": "Port name is required",
  }),

  eventTime: Joi.date().required().messages({
    "date.base": "RFA time must be a valid date",
    "any.required": "RFA time is required",
  }),

  reportDate: Joi.string().isoDate().required().messages({
    "string.base": "Report date must be a valid date",
    "string.isoDate": "Report date must be a valid ISO date",
    "string.empty": "Report date is required",
    "any.required": "Report date is required",
  }),

  distanceToGo: Joi.number().min(0).required().messages({
    "number.base": "Distance to go must be a number",
    "number.min": "Distance to go cannot be negative",
    "any.required": "Distance to go is required",
  }),

  etaNextPort: Joi.string().required().messages({
    "string.base": "ETA next port must be a valid date string",
    "string.isoDate": "ETA next port must be a valid ISO date",
    "string.empty": "ETA next port is required",
    "any.required": "ETA next port is required",
  }),

  robVlsfo: Joi.number().min(0).required().messages({
    "number.base": "ROB VLSFO must be a number",
    "number.min": "ROB VLSFO cannot be negative",
    "any.required": "ROB VLSFO is required",
  }),

  robLsmgo: Joi.number().min(0).required().messages({
    "number.base": "ROB LSMGO must be a number",
    "number.min": "ROB LSMGO cannot be negative",
    "any.required": "ROB LSMGO is required",
  }),

  cargoSummary: Joi.string().required().messages({
    "string.empty": "Cargo summary is required",
    "any.required": "Cargo summary is required",
  }),

  remarks: Joi.string().allow("", null).optional().messages({
    "string.base": "Remarks must be valid text",
  }),
});
