import Joi from "joi";

export const norSchema = Joi.object({
  vesselId: Joi.string().required().label("Vessel ID").messages({
    "string.empty": "Vessel ID is required",
    "any.required": "Vessel ID is required",
  }),
 vesselName: Joi.string().required().label("Vessel Name").messages({
    "string.empty": "Vessel Name is required",
    "any.required": "Vessel Name is required",
  }),
  reportDate: Joi.string().required().label("Report Date").messages({
    "string.empty": "Report Date is required",
    "any.required": "Report Date is required",
  }),

  voyageNo: Joi.string().required().label("Voyage No").messages({
    "string.empty": "Voyage No is required",
    "any.required": "Voyage No is required",
  }),

  portName: Joi.string().required().label("Port Name").messages({
    "string.empty": "Port Name is required",
    "any.required": "Port Name is required",
  }),

  pilotStation: Joi.string().required().label("Pilot Station").messages({
    "string.empty": "Pilot Station is required",
    "any.required": "Pilot Station is required",
  }),

  norTenderTime: Joi.string().required().label("NOR Tender Time").messages({
    "string.empty": "Tender Time is required",
    "any.required": "Tender Time is required",
  }),

  etaPort: Joi.string().required().label("ETA Port").messages({
    "string.empty": "ETA Port is required",
    "any.required": "ETA Port is required",
  }),
  norDocument: Joi.object().required().label("NOR Document").messages({
    "object.base": "NOR Document is required",
    "any.required": "NOR Document is required",
  }),

  // Remarks is optional / allowed to be empty
  remarks: Joi.string().allow("").optional().label("Remarks"),
});