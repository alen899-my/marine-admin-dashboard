import Joi from "joi";

export const departureReportSchema = Joi.object({
  vesselName: Joi.string().trim().required().messages({
    "string.empty": "Vessel name is required",
    "any.required": "Vessel name is required",
  }),
  vesselId: Joi.string().required().label("Vessel ID"),
  voyageId: Joi.string().trim().required().messages({
    "string.empty": "Voyage ID is required",
    "any.required": "Voyage ID is required",
  }),

  portName: Joi.string().trim().required().messages({
    "string.empty": "Current port name is required",
    "any.required": "Current port name is required",
  }),

  lastPort: Joi.string().trim().required().messages({
    "string.empty": "Last port of call is required",
    "any.required": "Last port of call is required",
  }),

  eventTime: Joi.date().required().messages({
    "date.base": "RFA time must be a valid date and time",
    "any.required": "RFA time is required",
  }),

  reportDate: Joi.string().isoDate().required().messages({
    "string.isoDate": "Report date must be a valid ISO format date",
    "any.required": "Report date is required",
  }),

  distance_to_next_port_nm: Joi.number().min(0).required().messages({
    "number.base": "Distance to next port must be a number",
    "number.min": "Distance cannot be a negative value",
    "any.required": "Distance to next port is required",
  }),

  etaNextPort: Joi.string().required().messages({
  "string.base": "ETA for the next port is required", // Added this
  "string.empty": "ETA for the next port is required",
  "any.required": "ETA for the next port is required",
}),

  robVlsfo: Joi.number().min(0).required().messages({
    "number.base": "ROB VLSFO must be a number",
    "number.min": "ROB VLSFO cannot be negative",
    "any.required": "ROB VLSFO is required",
  }),

  robLsmgo: Joi.number().min(0).required().messages({
    "number.base": "ROB LSMGO must be a number",
    "number.min": "ROB LSMGO cannot be negative",
    "any.required": "ROB LSMGO is required",
  }),

  bunkers_received_vlsfo_mt: Joi.number().min(0).required().messages({
    "number.base": "Bunkers VLSFO must be a number",
    "number.min": "Bunkers received cannot be negative",
    "any.required": "Bunkers received VLSFO is required",
  }),

  bunkers_received_lsmgo_mt: Joi.number().min(0).required().messages({
    "number.base": "Bunkers LSMGO must be a number",
    "number.min": "Bunkers received cannot be negative",
    "any.required": "Bunkers received LSMGO is required",
  }),

  cargo_qty_loaded_mt: Joi.number().min(0).allow(null, "").messages({
    "number.base": "Cargo loaded quantity must be a number",
    "number.min": "Quantity cannot be negative",
  }),

  cargo_qty_unloaded_mt: Joi.number().min(0).allow(null, "").messages({
    "number.base": "Cargo unloaded quantity must be a number",
    "number.min": "Quantity cannot be negative",
  }),

  cargoSummary: Joi.string().required().messages({
    "string.empty": "Please provide a brief summary of cargo operations",
    "any.required": "Cargo summary is required",
  }),

  remarks: Joi.string().allow("", null).optional().messages({
    "string.base": "Remarks must be valid text",
  }),
})
.or("cargo_qty_loaded_mt", "cargo_qty_unloaded_mt")
.messages({
  "object.missing": "Please enter a quantity for either Cargo Loaded or Cargo Unloaded.",
});