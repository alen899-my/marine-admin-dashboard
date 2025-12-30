import Joi from "joi";

export const voyageSchema = Joi.object({
  // Reference ID (Required)
  vesselId: Joi.string().required().messages({
    "string.empty": "Vessel selection is required",
    "any.required": "Vessel selection is required",
  }),

  // Unique Voyage Identifier (Required)
  voyageNo: Joi.string().trim().required().messages({
    "string.empty": "Voyage number is required",
    "any.required": "Voyage number is required",
  }),

  // Status Enum
  status: Joi.string()
    .valid("active", "completed", "scheduled")
    .default("scheduled"),

  // Route Object
  route: Joi.object({
    loadPort: Joi.string().trim().required().messages({
      "string.empty": "Load Port is required",
    }),
    dischargePort: Joi.string().trim().required().messages({
      "string.empty": "Discharge Port is required",
    }),
    via: Joi.string().trim().allow("").optional(),
    totalDistance: Joi.number().min(0).allow(null).optional(),
  }).required(),

  // Charter Object (Optional but fields validated if present)
  charter: Joi.object({
    chartererName: Joi.string().trim().allow("").optional(),
    charterPartyDate: Joi.string().allow("").optional(), // Accepts date strings
    laycanStart: Joi.string().allow("").optional(),
    laycanEnd: Joi.string().allow("").optional(),
  }).optional(),

  // Cargo Object
  cargo: Joi.object({
    commodity: Joi.string().trim().allow("").optional(),
    quantity: Joi.number().min(0).allow(null).optional(),
    grade: Joi.string().trim().allow("").optional(),
  }).optional(),

  // Schedule Object
  schedule: Joi.object({
    startDate: Joi.date().allow(null, "").optional(),
    eta: Joi.date().allow(null, "").optional(),
    endDate: Joi.date().allow(null, "").optional(),
  }).optional(),
});