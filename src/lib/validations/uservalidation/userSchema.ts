import Joi from "joi";

const phonePattern = /^(?=.*\d)[\d+\s]+$/;

export const userSchema = Joi.object({
  name: Joi.string().min(3).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 3 characters",
  }),

  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.empty": "Email is required",
      "string.email": "Please enter a valid email",
    }),

  company: Joi.string().required().messages({
    "string.empty": "Please select a company",
    "any.required": "Company is required",
  }),
  phone: Joi.string()
    .trim()
    .min(8)
    .max(20)
    .pattern(phonePattern)
    .required()
    .messages({
      "string.empty": "Phone number is required",
      "string.min": "Phone number must be at least 8 characters",
      "string.max": "Phone number cannot exceed 20 characters",
      "string.pattern.base":
        "Phone number can contain only digits, spaces, and +",
    }),
  password: Joi.string().min(6).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 6 characters",
  }),

  confirmPassword: Joi.any().valid(Joi.ref("password")).required().messages({
    "any.only": "Passwords do not match",
    "any.required": "Confirm Password is required",
  }),

  role: Joi.string().required().label("Role").messages({
    "string.empty": "Please select a role",
    "any.required": "Role is required",
  }),
});
