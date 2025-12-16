import Joi from "joi";

export const noonReportSchema = Joi.object({
  vesselName: Joi.string()
    .required()
    .messages({
      "string.empty": "Vessel Name is not allowed to be empty",
      "any.required": "Vessel Name is required",
    }),

  voyageNo: Joi.string()
    .required()
    .messages({
      "string.empty": "Voyage Number is not allowed to be empty",
      "any.required": "Voyage Number is required",
    }),

  reportDate: Joi.string()
    .required()
    .messages({
      "string.empty": "Report Date & Time is not allowed to be empty",
      "any.required": "Report Date & Time is required",
    }),

  nextPort: Joi.string()
    .required()
    .messages({
      "string.empty": "Next Port is not allowed to be empty",
      "any.required": "Next Port is required",
    }),

  latitude: Joi.string()
    .required()
    .messages({
      "string.empty": "Latitude is not allowed to be empty",
      "any.required": "Latitude is required",
    }),

  longitude: Joi.string()
    .required()
    .messages({
      "string.empty": "Longitude is not allowed to be empty",
      "any.required": "Longitude is required",
    }),

  distanceTravelled: Joi.number()
    .min(0)
    .required()
    .messages({
      "number.base": "Distance Travelled must be a number",
      "number.min": "Distance Travelled cannot be negative",
      "any.required": "Distance Travelled is required",
    }),

  distanceToGo: Joi.number()
    .min(0)
    .required()
    .messages({
      "number.base": "Distance To Go must be a number",
      "number.min": "Distance To Go cannot be negative",
      "any.required": "Distance To Go is required",
    }),

  vlsfoConsumed: Joi.number()
    .min(0)
    .required()
    .messages({
      "number.base": "VLSFO Consumed must be a number",
      "number.min": "VLSFO Consumed cannot be negative",
      "any.required": "VLSFO Consumed is required",
    }),

  lsmgoConsumed: Joi.number()
    .min(0)
    .required()
    .messages({
      "number.base": "LSMGO Consumed must be a number",
      "number.min": "LSMGO Consumed cannot be negative",
      "any.required": "LSMGO Consumed is required",
    }),

  windForce: Joi.string()
    .required()
    .messages({
      "string.empty": "Wind Force is not allowed to be empty",
      "any.required": "Wind Force is required",
    }),

  seaState: Joi.string()
    .required()
    .messages({
      "string.empty": "Sea State is not allowed to be empty",
      "any.required": "Sea State is required",
    }),

  weatherRemarks: Joi.string().allow("").label("Weather Remarks"),
  generalRemarks: Joi.string().allow("").label("General Remarks"),
});
