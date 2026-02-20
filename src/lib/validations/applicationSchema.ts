import Joi from "joi";

// Helper for repeating document patterns
const documentBase = {
  country: Joi.string().required(),
  number: Joi.string().required(),
  placeIssued: Joi.string().allow(""),
  dateIssued: Joi.date().iso().required(),
  dateExpired: Joi.date().iso().allow(null),
};

export const applicationSchema = Joi.object({
  // Identity & Contact
  firstName: Joi.string().trim().required(),
  lastName: Joi.string().trim().required(),
  rank: Joi.string().required(),
  positionApplied: Joi.string().required(),
  nationality: Joi.string().required(),
  email: Joi.string().email({ tlds: { allow: false } }).lowercase().required(),
  cellPhone: Joi.string().required(),
  
  // Personal Details
  dateOfBirth: Joi.date().iso().required(),
  dateOfAvailability: Joi.date().iso().required(),
  presentAddress: Joi.string().required(),
  
  // Physicals
  weightKg: Joi.number().min(20).max(250).required(),
  heightCm: Joi.number().min(50).max(250).required(),
  coverallSize: Joi.string().required(),
  shoeSize: Joi.string().required(),
  hairColor: Joi.string().required(),
  eyeColor: Joi.string().required(),
  
  // Medicals
  medicalCertIssuedDate: Joi.date().iso().required(),
  medicalCertExpiredDate: Joi.date().iso().required(),

  // Next of Kin
  nextOfKin: Joi.object({
    name: Joi.string().required(),
    relationship: Joi.string().required(),
    phone: Joi.string().required(),
    address: Joi.string().required(),
  }).required(),

  // Sub-Documents (Arrays)
  licences: Joi.array().items(Joi.object({
    ...documentBase,
    licenceType: Joi.string().valid("coc", "coe").required(),
    grade: Joi.string().required(),
  })).min(1).messages({ "array.min": "At least one CoC/CoE Licence is required" }),

  passports: Joi.array().items(Joi.object({
    ...documentBase,
    country: Joi.string().required(),
  })).min(1).messages({ "array.min": "At least one Passport is required" }),

  seamansBooks: Joi.array().items(Joi.object({
    ...documentBase,
    country: Joi.string().required(),
  })).min(1).messages({ "array.min": "At least one Seaman's Book is required" }),

  visas: Joi.array().items(Joi.object({
    ...documentBase,
    visaType: Joi.string().required(),
  })).optional(),

  // Sea Experience
  seaExperience: Joi.array().items(Joi.object({
    vesselName: Joi.string().required(),
    vesselType: Joi.string().required(),
    flag: Joi.string().allow(""),
    grt: Joi.number().allow(null),
    engineType: Joi.string().allow(""),
    engineKW: Joi.number().allow(null),
    company: Joi.string().required(),
    rank: Joi.string().required(),
    periodFrom: Joi.date().iso().required(),
    periodTo: Joi.date().iso().allow(null),
  })).min(1).messages({ "array.min": "At least one Sea Experience entry is required" }),

  // System Fields (Required for Action)
  company: Joi.string().required(),
  formSource: Joi.string().valid("public_form", "admin_created").required(),
});