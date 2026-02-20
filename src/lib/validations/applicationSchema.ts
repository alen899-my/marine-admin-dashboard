import Joi from "joi";

// Helper for repeating document patterns
const documentBase = {
  country: Joi.string().required().label("Country").messages({ "string.empty": "{#label} is required" }),
  number: Joi.string().required().label("Licence Number").messages({ "string.empty": "{#label} is required" }),
  placeIssued: Joi.string().allow(""),
  dateIssued: Joi.date().iso().required().label("Date Issued").messages({ "date.format": "{#label} is required", "date.base": "{#label} is required", "any.required": "{#label} is required", "date.empty": "{#label} is required" }),
  dateExpired: Joi.date().iso().allow(null, ""),
};

export const applicationSchema = Joi.object({
  // Identity & Contact
  firstName: Joi.string().trim().required().label("First Name").messages({ "string.empty": "{#label} is required" }),
  lastName: Joi.string().trim().required().label("Last Name").messages({ "string.empty": "{#label} is required" }),
  rank: Joi.string().required().label("Rank").messages({ "string.empty": "{#label} is required" }),
  positionApplied: Joi.string().required().label("Position Applied").messages({ "string.empty": "{#label} is required" }),
  nationality: Joi.string().required().label("Nationality").messages({ "string.empty": "{#label} is required" }),
  email: Joi.string().email({ tlds: { allow: false } }).lowercase().required().label("Email").messages({ "string.empty": "{#label} is required", "string.email": "Please enter a valid email address" }),
  cellPhone: Joi.string().required().label("Cell Phone").messages({ "string.empty": "{#label} is required" }),
  
  // Personal Details
  dateOfBirth: Joi.date().iso().required().label("Date of Birth").messages({ "date.format": "{#label} is required", "date.base": "{#label} is required", "any.required": "{#label} is required", "date.empty": "{#label} is required" }),
  dateOfAvailability: Joi.date().iso().required().label("Date of Availability").messages({ "date.format": "{#label} is required", "date.base": "{#label} is required", "any.required": "{#label} is required", "date.empty": "{#label} is required" }),
  presentAddress: Joi.string().required().label("Present Address").messages({ "string.empty": "{#label} is required" }),
  
  // Physicals
  weightKg: Joi.number().min(20).max(250).required().label("Weight").messages({ "number.base": "{#label} is required" }),
  heightCm: Joi.number().min(50).max(250).required().label("Height").messages({ "number.base": "{#label} is required" }),
  coverallSize: Joi.string().required().label("Coverall Size").messages({ "string.empty": "{#label} is required" }),
  shoeSize: Joi.string().required().label("Shoe Size").messages({ "string.empty": "{#label} is required" }),
  hairColor: Joi.string().required().label("Hair Color").messages({ "string.empty": "{#label} is required" }),
  eyeColor: Joi.string().required().label("Eye Color").messages({ "string.empty": "{#label} is required" }),
  
  // Medicals
  medicalCertIssuedDate: Joi.date().iso().required().label("Medical Certificate Issued Date").messages({ "date.format": "{#label} is required", "date.base": "{#label} is required", "any.required": "{#label} is required", "date.empty": "{#label} is required" }),
  medicalCertExpiredDate: Joi.date().iso().required().label("Medical Certificate Expiration Date").messages({ "date.format": "{#label} is required", "date.base": "{#label} is required", "any.required": "{#label} is required", "date.empty": "{#label} is required" }),

  // Next of Kin
  nextOfKin: Joi.object({
    name: Joi.string().required().label("Next of Kin Name").messages({ "string.empty": "{#label} is required" }),
    relationship: Joi.string().required().label("Relationship").messages({ "string.empty": "{#label} is required" }),
    phone: Joi.string().required().label("NOK Phone").messages({ "string.empty": "{#label} is required" }),
    address: Joi.string().required().label("NOK Address").messages({ "string.empty": "{#label} is required" }),
  }).required(),

  // Sub-Documents (Arrays)
  licences: Joi.array().items(Joi.object({
    ...documentBase,
    licenceType: Joi.string().valid("coc", "coe").required(),
    grade: Joi.string().required().label("Grade of Licence").messages({ "string.empty": "{#label} is required" }),
  })).min(1).messages({ "array.min": "At least one CoC/CoE Licence is required" }),

  passports: Joi.array().items(Joi.object({
    ...documentBase,
    country: Joi.string().required().label("Country").messages({ "string.empty": "{#label} is required" }),
  })).min(1).messages({ "array.min": "At least one Passport is required" }),

  seamansBooks: Joi.array().items(Joi.object({
    ...documentBase,
    country: Joi.string().required().label("Country").messages({ "string.empty": "{#label} is required" }),
  })).min(1).messages({ "array.min": "At least one Seaman's Book is required" }),

  visas: Joi.array().items(Joi.object({
    ...documentBase,
    visaType: Joi.string().required().label("Visa Type").messages({ "string.empty": "{#label} is required" }),
  })).optional(),

  // Sea Experience
  seaExperience: Joi.array().items(Joi.object({
    vesselName: Joi.string().required().label("Vessel Name").messages({ "string.empty": "{#label} is required" }),
    vesselType: Joi.string().required().label("Vessel Type").messages({ "string.empty": "{#label} is required" }),
    flag: Joi.string().allow(""),
    grt: Joi.number().allow(null),
    engineType: Joi.string().allow(""),
    engineKW: Joi.number().allow(null),
    company: Joi.string().required().label("Shipping Company").messages({ "string.empty": "{#label} is required" }),
    rank: Joi.string().required().label("Rank").messages({ "string.empty": "{#label} is required" }),
    periodFrom: Joi.date().iso().required().label("Period From").messages({ "date.format": "{#label} is required", "date.base": "{#label} is required", "any.required": "{#label} is required", "date.empty": "{#label} is required" }),
    periodTo: Joi.date().iso().allow(null),
  })).min(1).messages({ "array.min": "At least one Sea Experience entry is required" }),

  // System Fields (Required for Action)
  company: Joi.string().required(),
  formSource: Joi.string().valid("public_form", "admin_created").required(),
  status: Joi.string().valid("draft", "submitted", "reviewing", "approved", "rejected", "on_hold", "archived").optional(),
});