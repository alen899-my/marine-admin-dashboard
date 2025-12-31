import Joi from "joi";

export const cargoSchema = Joi.object({
  vesselId: Joi.string().required().label("Vessel ID").messages({
    "string.empty": "Vessel ID is required",
    "any.required": "Vessel ID is required",
  }),
  vesselName: Joi.string().required().label("Vessel Name").messages({
    "string.empty": "Vessel Name is required",
    "any.required": "Vessel Name is required",
  }),

  voyageNo: Joi.string().required().label("Voyage No").messages({
    "string.empty": "Voyage No is required",
  }),
  portName: Joi.string().required().label("Port Name").messages({
    "string.empty": "Port Name is required",
  }),
  portType: Joi.string().required().label("Port Type").messages({
    "string.empty": "Port Type is required",
  }),
  documentType: Joi.string().required().label("Document Type").messages({
    "string.empty": "Document Type is required",
  }),
  documentDate: Joi.string().required().label("Document Date").messages({
    "string.empty": "Date is required",
  }),
  reportDate: Joi.string().optional().allow(""),
  remarks: Joi.string().optional().allow(""),
});