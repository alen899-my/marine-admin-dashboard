import Joi from "joi";

export const preArrivalSchema = Joi.object({
  vesselId: Joi.string().required().messages({
    "string.empty": "Vessel selection is required",
  }),
  vesselName: Joi.string().required(),
  voyageId: Joi.string().optional().allow("", null),
  voyageNo: Joi.string().optional().allow("", null),
  portName: Joi.string().required().trim().messages({
    "string.empty": "Port name is required",
  }),
  requestId: Joi.string().required().trim().uppercase().messages({
    "string.empty": "Request ID is required",
  }),
  agentContact: Joi.string().allow(""),
  eta: Joi.date().required().messages({
    "date.base": "Valid ETA is required",
  }),
 
dueDate: Joi.date().required().less(Joi.ref('eta')).messages({
  "date.base": "Valid Due Date is required",
  "date.less": "Submission Due Date must be BEFORE the ETA (Arrival)",
}),
  notes: Joi.string().allow(""),
  status: Joi.string()
    .valid("draft", "published", "sent", "completed")
    .default("draft")
    .messages({
      "any.only": "Invalid status selected",
    }),
});