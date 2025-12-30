import Joi from "joi";

export const vesselSchema = Joi.object({
  // --- REQUIRED FIELDS ---
  name: Joi.string()
  .trim()
    .required()
    .messages({
      "string.empty": "Vessel Name is not allowed to be empty",
      "any.required": "Vessel Name is required",
    }),

  imo: Joi.string()
  .trim() 
    .required()
    .messages({
      "string.empty": "IMO Number is not allowed to be empty",
      "any.required": "IMO Number is required",
    }),

  // --- OPTIONAL FIELDS (Allowing them so validation doesn't fail on unknown keys) ---
  fleet: Joi.string().allow("").optional(),
  status: Joi.string().valid("active", "laid_up", "sold", "dry_dock").default("active"),
  callSign: Joi.string().allow("").optional(),
  mmsi: Joi.string().allow("").optional(),
  flag: Joi.string().allow("").optional(),
  yearBuilt: Joi.number().allow(null, "").optional(),

  // Nested Objects matches the payload structure
  dimensions: Joi.object({
    loa: Joi.number().allow(null, "").optional(),
    beam: Joi.number().allow(null, "").optional(),
    maxDraft: Joi.number().allow(null, "").optional(),
    dwt: Joi.number().allow(null, "").optional(),
    grossTonnage: Joi.number().allow(null, "").optional(),
  }).optional(),

  performance: Joi.object({
    designSpeed: Joi.number().allow(null, "").optional(),
    ballastConsumption: Joi.number().allow(null, "").optional(),
    ladenConsumption: Joi.number().allow(null, "").optional(),
  }).optional(),

  machinery: Joi.object({
    mainEngine: Joi.string().allow("").optional(),
    allowedFuels: Joi.array().items(Joi.string()).optional(),
  }).optional(),
});