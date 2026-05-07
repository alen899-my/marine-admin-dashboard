import Joi from "joi";

export const userGuideSchema = Joi.object({
  groupId: Joi.string().trim().required().messages({
    "string.empty": "Group is required",
    "any.required": "Group is required",
  }),
  title: Joi.string().trim().min(2).max(120).required().messages({
    "string.empty": "Sub item title is required",
    "any.required": "Sub item title is required",
  }),
  content: Joi.string().allow("").default(""),
  roleContents: Joi.object()
    .pattern(Joi.string().trim(), Joi.string().allow(""))
    .default({}),
  assignedRoles: Joi.array()
    .items(Joi.string().trim())
    .min(1)
    .required()
    .messages({
      "array.min": "At least one role must be assigned",
      "any.required": "Assigned roles are required",
    }),
  status: Joi.string().valid("active", "inactive").default("active"),
})
  .custom((value, helpers) => {
    const fallbackContent = String(value.content || "").trim();
    const missingRoles = (value.assignedRoles || []).filter((role: string) => {
      const roleContent = String(value.roleContents?.[role] || "").trim();
      return !roleContent && !fallbackContent;
    });

    if (missingRoles.length > 0) {
      return helpers.error("any.custom", {
        message: `Content is required for: ${missingRoles.join(", ")}`,
      });
    }

    return value;
  })
  .messages({
    "any.custom": "{{#message}}",
  });
