import Joi from "joi";

// Helper for repeating document patterns
const documentBase = {
  country: Joi.string().required().label("Country").messages({ "string.empty": "{#label} is required" }),
  number: Joi.string().required().label("Licence Number").messages({ "string.empty": "{#label} is required" }),
  placeIssued: Joi.string().allow(""),
  dateIssued: Joi.date().iso().required().label("Date Issued").messages({ "date.format": "{#label} must be a valid date", "date.base": "{#label} is required", "any.required": "{#label} is required", "date.empty": "{#label} is required" }),
  dateExpired: Joi.date().iso().allow(null, ""),
};

// Phone number pattern: digits only, optional leading +, 7-15 digits
const phonePattern = /^[+]?[0-9]{7,15}$/;

export const applicationSchema = Joi.object({
  // Identity & Contact
  firstName: Joi.string().trim().min(2).max(50).required().label("First Name").messages({
    "string.empty": "{#label} is required",
    "string.min": "{#label} must be at least {#limit} characters",
    "string.max": "{#label} must not exceed {#limit} characters",
  }),
  lastName: Joi.string().trim().min(1).max(50).required().label("Last Name").messages({
    "string.empty": "{#label} is required",
    "string.min": "{#label} must be at least {#limit} characters",
    "string.max": "{#label} must not exceed {#limit} characters",
  }),
  rank: Joi.string().trim().required().label("Rank").messages({
    "string.empty": "{#label} is required",
  }),
  positionApplied: Joi.string().trim().required().label("Position Applied").messages({
    "string.empty": "{#label} is required",
  }),
  nationality: Joi.string().trim().required().label("Nationality").messages({
    "string.empty": "{#label} is required",
  }),
  email: Joi.string().email({ tlds: { allow: false } }).lowercase().required().label("Email").messages({
    "string.empty": "{#label} is required",
    "string.email": "Please enter a valid email address (e.g. name@example.com)",
  }),
  cellPhone: Joi.string().trim().pattern(phonePattern).required().label("Cell Phone").messages({
    "string.empty": "{#label} is required",
    "string.pattern.base": "{#label} must contain only digits (7-15 digits), optionally starting with +",
  }),
  
  // Personal Details
  dateOfBirth: Joi.date().iso().required().label("Date of Birth").messages({
    "date.format": "{#label} must be a valid date",
    "date.base": "{#label} is required",
    "any.required": "{#label} is required",
    "date.empty": "{#label} is required",
  }),
  dateOfAvailability: Joi.date().iso().required().label("Date of Availability").messages({
    "date.format": "{#label} must be a valid date",
    "date.base": "{#label} is required",
    "any.required": "{#label} is required",
    "date.empty": "{#label} is required",
  }),
  presentAddress: Joi.string().trim().min(5).required().label("Present Address").messages({
    "string.empty": "{#label} is required",
    "string.min": "{#label} must be at least {#limit} characters",
  }),
  
  // Physicals
  weightKg: Joi.number().min(20).max(250).required().label("Weight").messages({
    "number.base": "{#label} must be a valid number",
    "number.min": "{#label} must be at least {#limit} kg",
    "number.max": "{#label} must not exceed {#limit} kg",
    "any.required": "{#label} is required",
  }),
  heightCm: Joi.number().min(50).max(250).required().label("Height").messages({
    "number.base": "{#label} must be a valid number",
    "number.min": "{#label} must be at least {#limit} cm",
    "number.max": "{#label} must not exceed {#limit} cm",
    "any.required": "{#label} is required",
  }),
  coverallSize: Joi.string().trim().required().label("Coverall Size").messages({
    "string.empty": "{#label} is required",
  }),
  shoeSize: Joi.string().trim().required().label("Shoe Size").messages({
    "string.empty": "{#label} is required",
  }),
  hairColor: Joi.string().trim().required().label("Hair Color").messages({
    "string.empty": "{#label} is required",
  }),
  eyeColor: Joi.string().trim().required().label("Eye Color").messages({
    "string.empty": "{#label} is required",
  }),
  
  // Medicals
  medicalCertIssuedDate: Joi.date().iso().required().label("Medical Certificate Issued Date").messages({
    "date.format": "{#label} must be a valid date",
    "date.base": "{#label} is required",
    "any.required": "{#label} is required",
    "date.empty": "{#label} is required",
  }),
  medicalCertExpiredDate: Joi.date().iso().required().label("Medical Certificate Expiration Date").messages({
    "date.format": "{#label} must be a valid date",
    "date.base": "{#label} is required",
    "any.required": "{#label} is required",
    "date.empty": "{#label} is required",
  }),

  // Next of Kin
  nextOfKin: Joi.object({
    name: Joi.string().trim().min(2).required().label("Next of Kin Name").messages({
      "string.empty": "{#label} is required",
      "string.min": "{#label} must be at least {#limit} characters",
    }),
    relationship: Joi.string().trim().required().label("Relationship").messages({
      "string.empty": "{#label} is required",
    }),
    phone: Joi.string().trim().pattern(phonePattern).required().label("NOK Phone").messages({
      "string.empty": "{#label} is required",
      "string.pattern.base": "{#label} must contain only digits (7-15 digits), optionally starting with +",
    }),
    address: Joi.string().trim().min(5).required().label("NOK Address").messages({
      "string.empty": "{#label} is required",
      "string.min": "{#label} must be at least {#limit} characters",
    }),
  }).required(),

  // Sub-Documents (Arrays)
  licences: Joi.array().items(Joi.object({
    ...documentBase,
    licenceType: Joi.string().valid("coc", "coe").required(),
    grade: Joi.string().trim().required().label("Grade of Licence").messages({ "string.empty": "{#label} is required" }),
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
  vesselName: Joi.string().trim().required().label("Vessel Name").messages({
    "string.empty": "{#label} is required",
    "any.required": "{#label} is required",
  }),
  vesselType: Joi.string().required().label("Vessel Type").messages({
    "string.empty": "{#label} is required",
    "any.required": "{#label} is required",
  }),
  flag: Joi.string().allow("").optional().label("Flag").messages({
    "string.base": "Flag must be a text value",
  }),
  grt: Joi.alternatives().try(Joi.number(), Joi.string().allow("")).optional().label("GRT").messages({
    "alternatives.match": "GRT must be a valid number",
  }),
  engineType: Joi.string().allow("").optional().label("Engine Type").messages({
    "string.base": "Engine Type must be a text value",
  }),
  engineKW: Joi.alternatives().try(Joi.number(), Joi.string().allow("")).optional().label("Engine KW").messages({
    "alternatives.match": "Engine KW must be a valid number",
  }),
  company: Joi.string().trim().required().label("Shipping Company").messages({
    "string.empty": "{#label} is required",
    "any.required": "{#label} is required",
  }),
  rank: Joi.string().trim().required().label("Rank").messages({
    "string.empty": "{#label} is required",
    "any.required": "{#label} is required",
  }),
  periodFrom: Joi.string().required().label("Period From").messages({
    "string.empty": "{#label} is required",
    "any.required": "{#label} is required",
  }),
  periodTo: Joi.string().allow("", null).optional().label("Period To").messages({
    "string.base": "Period To must be a valid date",
  }),
  areaOfOperation: Joi.string().allow("").optional().label("Area of Operation").messages({
    "string.base": "Area of Operation must be a text value",
  }),
  jobDescription: Joi.string().allow("").optional().label("Job Description").messages({
    "string.base": "Job Description must be a text value",
  }),
})).optional(),

  // System Fields (Required for Action)
  company: Joi.string().required(),
  formSource: Joi.string().valid("public_form", "admin_created").required(),
  status: Joi.string().valid("draft", "submitted", "reviewing", "approved", "rejected", "on_hold", "archived").optional(),
});