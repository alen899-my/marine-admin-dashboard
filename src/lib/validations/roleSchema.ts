import Joi from "joi";

export const roleSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .required()
    .label("Role Name")
    .messages({
      "string.empty": "Role Name is required",
      "string.min": "Role Name must be at least 3 characters",
    }),
    
  permissions: Joi.array().items(Joi.string()).label("Permissions"),
  
  status: Joi.string().valid("active", "inactive").default("active"),
});