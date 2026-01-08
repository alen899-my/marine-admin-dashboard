import Joi from "joi";

export const companySchema = Joi.object({
  name: Joi.string().required().min(2).max(100).messages({
    "string.empty": "Company name is required",
    "string.min": "Company name must be at least 2 characters",
  }),

  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.email": "Please enter a valid email address",
      "string.empty": "Company email is required",
    }),

  phone: Joi.string().allow("", null).messages({
    "string.base": "Phone must be a string",
  }),

  address: Joi.string().allow("", null).max(500).messages({
    "string.max": "Address cannot exceed 500 characters",
  }),

  contactName: Joi.string().allow("", null).max(100).messages({
    "string.max": "Contact name cannot exceed 100 characters",
  }),

  contactEmail: Joi.string()
    .email({ tlds: { allow: false } })
    .allow("", null)
    .messages({
      "string.email": "Please enter a valid contact email address",
    }),

  status: Joi.string().valid("active", "inactive").default("active").messages({
    "any.only": "Status must be either Active or Inactive",
  }),

  // Logo is usually handled via FormData/File object in the component,
  // but we allow it as a string URL for the validation of existing data.
  logo: Joi.string().allow("", null),
});
