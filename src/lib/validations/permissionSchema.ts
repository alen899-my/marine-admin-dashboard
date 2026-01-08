import Joi from "joi";

export const permissionSchema = Joi.object({
  name: Joi.string().required().min(2).max(50).messages({
    "string.empty": "Permission name is required",
    "string.min": "Name must be at least 2 characters"
  }),
  slug: Joi.string()
    .required()
    .pattern(/^[a-z0-9._]+$/)
    .messages({
      "string.pattern.base": "Use lowercase, dots, or underscores (e.g., vessel.create)",
      "string.empty": "Slug is required"
    }),
  description: Joi.string().required().min(3).max(100).messages({
    "string.empty": "Description is required"
  }),
  group: Joi.string().required().min(2).max(50),
  status: Joi.string().valid("active", "inactive").default("active"),
});