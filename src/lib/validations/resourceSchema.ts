import Joi from "joi";

export const resourceSchema = Joi.object({
  name: Joi.string().required().trim().messages({
    "string.empty": "Resource name is required",
    "any.required": "Resource name is required",
  }),
  status: Joi.string().valid("active", "inactive").default("active"),
});