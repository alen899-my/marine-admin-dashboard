import Joi from "joi";

export const registerValidation = Joi.object({
  fullName: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      "string.base": "Full name must be a text value",
      "string.empty": "Full name is required",
      "string.min": "Full name must have at least 2 characters",
      "string.max": "Full name cannot exceed 100 characters",
      "any.required": "Full name is required",
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.base": "Email must be a text value",
      "string.empty": "Email is required",
      "string.email": "Enter a valid email address",
      "any.required": "Email is required",
    }),

  phone: Joi.string()
    .pattern(/^[0-9+\-()\s]{7,20}$/)
    .optional()
    .allow("", null)
    .messages({
      "string.pattern.base": "Phone must be 7-20 characters and contain only numbers and phone symbols",
    }),

  password: Joi.string()
    .max(50)
    .required()
    .messages({
      "string.empty": "Password is required",
      "string.max": "Password cannot exceed 50 characters",
      "any.required": "Password is required",
    }),

  role: Joi.string()
    .valid(
      "candidate",
      "superintendent",
      "ops_manager",
      "crew_manager",
      "vessel_user",
      "admin"
    )
    .default("candidate")
    .messages({
      "any.only": "Invalid role selected",
      "string.empty": "Role is required",
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref("password"))
    .messages({
      "any.only": "Passwords must match",
    }),

  assignedVesselId: Joi.string()
    .optional()
    .allow(null)
    .messages({
      "string.base": "Assigned vessel must be a valid ID",
    }),
});
