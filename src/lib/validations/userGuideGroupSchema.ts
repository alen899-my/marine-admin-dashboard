import Joi from "joi";

export const userGuideGroupSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required().messages({
    "string.empty": "Group name is required",
    "any.required": "Group name is required",
  }),
  sortOrder: Joi.number().integer().min(0).default(0),
  status: Joi.string().valid("active", "inactive").default("active"),
});
