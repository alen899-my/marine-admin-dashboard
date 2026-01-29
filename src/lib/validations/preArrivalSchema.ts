// src/lib/validation/preArrivalSchema.ts
import Joi from "joi";

export const fileUploadSchema = Joi.object({
  docId: Joi.string().required(),
  note: Joi.string().allow("").max(10),
  // Strict 500KB validation (500 * 1024 = 512,000 bytes)
  fileSize: Joi.number()
    .max(512000)
    .required()
    .messages({
      "number.max": "File size must not exceed 500KB",
      "any.required": "File size is required for validation"
    }),
});