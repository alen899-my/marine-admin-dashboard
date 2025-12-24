import Joi from "joi";

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


  phone: Joi.string().allow("").optional().messages({
    "string.base": "Phone must be text",
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