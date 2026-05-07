// src/lib/seaPlaceholders.ts
// Placeholders for SEA Template Builder.
// Each key maps to a field in the Candidate / Contract / Vessel / Company model.
// icon field stores a lucide-react icon name string — rendered by the consuming component.
import { getCurrencySymbol } from "@/constants/geoData";
import { formatCurrency } from "@/lib/formatCurrency";

export interface PlaceholderItem {
  key: string;
  label: string;
  modelField: string;
}

export interface PlaceholderCard {
  id: string;
  title: string;
  icon: string; // lucide icon name e.g. "User", "Anchor"
  color: string;
  items: PlaceholderItem[];
}

export const STATIC_PLACEHOLDER_CARDS: PlaceholderCard[] = [
  // ─────────────────────────────────────────────────────────────
  // SEAFARER — Identity + Contact + Physical + Medical
  // Mapped to: ICandidate fields
  // ─────────────────────────────────────────────────────────────
  {
    id: "seafarer",
    title: "Seafarer",
    icon: "User",
    color: "bg-blue-500",
    items: [
      // Identity
      { key: "[CANDIDATE.FULL_NAME]",       label: "Full Name",           modelField: "__computed.fullName" },
      { key: "[CANDIDATE.FIRST_NAME]",      label: "First Name",          modelField: "firstName" },
      { key: "[CANDIDATE.LAST_NAME]",       label: "Last Name",           modelField: "lastName" },
      { key: "[CANDIDATE.RANK]",            label: "Rank",                modelField: "rank" },
      { key: "[CANDIDATE.DOB]",             label: "Date of Birth",       modelField: "dateOfBirth" },
      { key: "[CANDIDATE.POB]",             label: "Place of Birth",      modelField: "placeOfBirth" },
      { key: "[CANDIDATE.NATIONALITY]",     label: "Nationality",         modelField: "nationality" },
      { key: "[CANDIDATE.MARITAL_STATUS]",  label: "Marital Status",      modelField: "maritalStatus" },
      { key: "[CANDIDATE.FATHER_NAME]",     label: "Father's Name",       modelField: "fatherName" },
      { key: "[CANDIDATE.MOTHER_NAME]",     label: "Mother's Name",       modelField: "motherName" },

      // Contact
      { key: "[CANDIDATE.ADDRESS]",         label: "Present Address",     modelField: "presentAddress" },
      { key: "[CANDIDATE.EMAIL]",           label: "Email",               modelField: "email" },
      { key: "[CANDIDATE.CELL]",            label: "Cell Phone",          modelField: "cellPhone" },
      { key: "[CANDIDATE.HOME_PHONE]",      label: "Home Phone",          modelField: "homePhone" },
      { key: "[CANDIDATE.NEAREST_AIRPORT]", label: "Nearest Airport",     modelField: "nearestAirport" },

      // Documents
      { key: "[CANDIDATE.PASSPORT_NO]",     label: "Passport No",         modelField: "passports.0.number" },
      { key: "[CANDIDATE.PASSPORT_EXP]",    label: "Passport Expiry",     modelField: "passports.0.dateExpired" },
      { key: "[CANDIDATE.CDC_NO]",          label: "CDC / Seaman's Book", modelField: "cdcNo" },
      { key: "[CANDIDATE.CDC_EXP]",         label: "CDC Expiry",          modelField: "seamansBooks.0.dateExpired" },
      { key: "[CANDIDATE.INDOS_NO]",        label: "INDOS No",            modelField: "indosNo" },
      { key: "[CANDIDATE.COC_NO]",          label: "COC No",              modelField: "licences.0.number" },
      { key: "[CANDIDATE.COC_GRADE]",       label: "COC Grade",           modelField: "licences.0.grade" },
      { key: "[CANDIDATE.COC_EXP]",         label: "COC Expiry",          modelField: "licences.0.dateExpired" },
      { key: "[CANDIDATE.COE_NO]",          label: "COE No",              modelField: "licences.coe.number" },
      { key: "[CANDIDATE.COE_EXP]",         label: "COE Expiry",          modelField: "licences.coe.dateExpired" },

      // Medical
      { key: "[CANDIDATE.MEDICAL_ISSUED]",  label: "Medical Cert Issued", modelField: "medicalCertIssuedDate" },
      { key: "[CANDIDATE.MEDICAL_EXP]",     label: "Medical Cert Expiry", modelField: "medicalCertExpiredDate" },

      // Physical
      { key: "[CANDIDATE.WEIGHT]",          label: "Weight (kg)",         modelField: "weightKg" },
      { key: "[CANDIDATE.HEIGHT]",          label: "Height (cm)",         modelField: "heightCm" },
      { key: "[CANDIDATE.COVERALL_SIZE]",   label: "Coverall Size",       modelField: "coverallSize" },
      { key: "[CANDIDATE.SHOE_SIZE]",       label: "Shoe Size",           modelField: "shoeSize" },
      { key: "[CANDIDATE.HAIR_COLOR]",      label: "Hair Color",          modelField: "hairColor" },
      { key: "[CANDIDATE.EYE_COLOR]",       label: "Eye Color",           modelField: "eyeColor" },

      // Next of Kin
      { key: "[CANDIDATE.NOK_NAME]",        label: "Next of Kin Name",    modelField: "nextOfKin.name" },
      { key: "[CANDIDATE.NOK_RELATION]",    label: "NOK Relation",        modelField: "nextOfKin.relationship" },
      { key: "[CANDIDATE.NOK_PHONE]",       label: "NOK Phone",           modelField: "nextOfKin.phone" },
      { key: "[CANDIDATE.NOK_ADDRESS]",     label: "NOK Address",         modelField: "nextOfKin.address" },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // VESSEL
  // ─────────────────────────────────────────────────────────────
  {
    id: "vessel",
    title: "Vessel",
    icon: "Anchor",
    color: "bg-blue-600",
    items: [
      { key: "[VESSEL.NAME]",          label: "Vessel Name",   modelField: "vessel.name" },
      { key: "[VESSEL.IMO]",           label: "IMO Number",    modelField: "vessel.imo" },
      { key: "[VESSEL.FLAG]",          label: "Flag",          modelField: "vessel.flag" },
      { key: "[VESSEL.TYPE]",          label: "Vessel Type",   modelField: "vessel.vesselType" },
      { key: "[VESSEL.GRT]",           label: "GRT",           modelField: "vessel.grt" },
      { key: "[VESSEL.OWNER_NAME]",    label: "Owner/Manager", modelField: "vessel.ownerName" },
      { key: "[VESSEL.OWNER_ADDRESS]", label: "Owner Address", modelField: "vessel.ownerAddress" },
      { key: "[VESSEL.OWNER_PHONE]",   label: "Owner Phone",   modelField: "vessel.ownerPhone" },
      { key: "[VESSEL.OWNER_EMAIL]",   label: "Owner Email",   modelField: "vessel.ownerEmail" },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // CONTRACT
  // ─────────────────────────────────────────────────────────────
  {
    id: "contract",
    title: "Contract",
    icon: "FileSignature",
    color: "bg-green-600",
    items: [
      { key: "[CONTRACT.DATE]",         label: "Sign Date",         modelField: "signDate" },
      { key: "[CONTRACT.PLACE]",        label: "Sign Place",        modelField: "signPlace" },
      { key: "[CONTRACT.REF_NO]",       label: "Reference No",      modelField: "referenceNo" },
      { key: "[CONTRACT.JOINING_PORT]", label: "Port of Joining",   modelField: "portOfJoining" },
      { key: "[CONTRACT.COMMENCEMENT]", label: "Commencement Date", modelField: "commencement" },
      { key: "[CONTRACT.PERIOD]",       label: "Contract Period",   modelField: "contractPeriod" },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // WAGES
  // ─────────────────────────────────────────────────────────────
  {
    id: "wages",
    title: "Wages",
    icon: "DollarSign",
    color: "bg-emerald-600",
    items: [
      { key: "[WAGES.CURRENCY]",       label: "Currency",            modelField: "company.currency" },
      { key: "[WAGES.BASIC]",          label: "Basic Salary",        modelField: "wages.basic" },
      { key: "[WAGES.OTHER_ALLOWANCE]", label: "Other Allowance",      modelField: "wages.otherAllowance" },
      { key: "[WAGES.TOTAL]",          label: "Total (Per Month)",   modelField: "wages.total" },
      // Note: Dynamic allowances are available as [WAGES.YOUR_ALLOWANCE_NAME] 
      // where spaces are replaced by underscores and the name is fully uppercased.
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // COMPANY — Manning Agent
  // ─────────────────────────────────────────────────────────────
  {
    id: "company",
    title: "Company",
    icon: "Building2",
    color: "bg-gray-600",
    items: [
      { key: "[COMPANY.NAME]",          label: "Company Name",    modelField: "company.name" },
      { key: "[COMPANY.ADDRESS]",       label: "Company Address", modelField: "company.address" },
      { key: "[COMPANY.PHONE]",         label: "Company Phone",   modelField: "company.phone" },
      { key: "[COMPANY.EMAIL]",         label: "Company Email",   modelField: "company.email" },
      { key: "[COMPANY.WEBSITE]",       label: "Website",         modelField: "company.website" },
      { key: "[COMPANY.CIN]",           label: "CIN",             modelField: "company.cin" },
      { key: "[COMPANY.RPSL_NO]",       label: "RPSL Number",     modelField: "company.rpslNo" },
      { key: "[COMPANY.RPSL_VALIDITY]", label: "RPSL Validity",   modelField: "company.rpslValidity" },
    ],
  },
];

export function getPlaceholderCards(): PlaceholderCard[] {
  return STATIC_PLACEHOLDER_CARDS;
}

/**
 * Returns a flat map of placeholder key → label (used as display value in preview mode)
 * e.g. "CANDIDATE.FULL_NAME" → "Full Name"
 */
export function getMockPlaceholders(): Record<string, string> {
  const result: Record<string, string> = {};
  STATIC_PLACEHOLDER_CARDS.forEach(card => {
    card.items.forEach(item => {
      const cleanKey = item.key.replace(/[\[\]]/g, "").toUpperCase();
      result[cleanKey] = item.label;
    });
  });
  return result;
}

// ─────────────────────────────────────────────────────────────────
// Dynamic Token Value Builder
// ─────────────────────────────────────────────────────────────────

function getValueByPath(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  
  // Handle computed fields
  if (path === "__computed.fullName") {
    return obj.firstName && obj.lastName 
      ? `${obj.firstName} ${obj.lastName}` 
      : obj.fullName || "";
  }
  
  // Handle array index notation (e.g., "passports.0.number")
  const parts = path.split(".");
  let current = obj;
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (current === undefined || current === null) return undefined;
    
    // Check if it's an array index
    if (/^\d+$/.test(part)) {
      current = current[parseInt(part, 10)];
    } else {
      current = current[part];
    }
  }
  
  return current;
}

function isDateField(modelField: string): boolean {
  const fieldName = modelField.includes(".") ? modelField.split(".").pop() || "" : modelField;
  const dateFields = [
    "dateOfBirth", "placeOfBirth", "dateExpired", "medicalCertIssuedDate",
    "medicalCertExpiredDate", "signDate", "commencementDate", "commencement",
    "startDate", "endDate", "dob", "passportExp", "cdcExp", "cocExp", "coeExp", "medicalExp"
  ];
  return dateFields.some(f => fieldName.toLowerCase() === f.toLowerCase() || fieldName.toLowerCase().includes("date"));
}

export function formatDateForDoc(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export interface TokenBuilderData {
  candidate?: any;
  vessel?: any;
  contract?: any;
  wages?: any;
  company?: any;
  currencySettings?: {
    currencyPosition?: "left" | "right";
    currencyFormatType?: "symbol" | "code";
    currencySpace?: boolean;
  };
}

/**
 * Builds token values dynamically from data objects based on modelField paths.
 * This eliminates the need to hardcode each field in consuming components.
 */
export function buildTokenValuesFromData(data: TokenBuilderData): Record<string, string> {
  const result: Record<string, string> = {};
  const currencyCode = data.company?.currency || "";
  const currencyOptions = {
    currencySettings: data.currencySettings as any,
  };
  
  // Map category to data source
  const dataMap: Record<string, any> = {
    candidate: data.candidate,
    vessel: data.vessel,
    contract: data.contract,
    wages: data.wages,
    company: data.company,
  };
  
  STATIC_PLACEHOLDER_CARDS.forEach(card => {
    card.items.forEach(item => {
      const cleanKey = item.key.replace(/[\[\]]/g, "").toUpperCase();
      const modelField = item.modelField;

      if (cleanKey === "WAGES.CURRENCY") {
        result[cleanKey] = currencyCode
          ? data.currencySettings?.currencyFormatType === "code"
            ? currencyCode
            : getCurrencySymbol(currencyCode)
          : "";
        return;
      }
      
      // Determine which data source to use based on modelField prefix
      let sourceData: any = null;
      
      if (modelField.startsWith("company.")) {
        sourceData = data.company;
      } else if (modelField.startsWith("vessel.")) {
        sourceData = data.vessel;
      } else if (modelField.startsWith("wages.")) {
        sourceData = data.wages;
      } else if (modelField.startsWith("__computed.")) {
        sourceData = data.candidate;
      } else {
        // Default to candidate (most fields are candidate fields)
        sourceData = data.candidate;
        // But check contract raw for some fields
        if (!getValueByPath(data.candidate, modelField) && data.contract) {
          sourceData = { ...data.candidate, ...data.contract };
        }
      }
      
      // Get the value using the path
      const path = modelField.replace(/^(company|vessel|wages)\./, "");
      let value = getValueByPath(sourceData, path);
      
      // Handle dates
      if (value && isDateField(modelField)) {
        value = formatDateForDoc(value);
      }
      
      // Convert to string
      if (value !== undefined && value !== null) {
        result[cleanKey] = String(value);
      } else {
        result[cleanKey] = "";
      }
    });
  });

  // Calculate dynamic WAGES.TOTAL and inject dynamic allowance keys
  if (data.wages) {
    const basicVal = parseFloat(data.wages.basic || "0") || 0;
    result["WAGES.BASIC"] = formatCurrency(basicVal, currencyCode, currencyOptions);
    
    // Helper to format item display and get its absolute value
    const processVal = (item: any): { display: string; val: number } => {
      if (item === null || item === undefined) return { display: "", val: 0 };
      const isObj = typeof item === 'object';
      const type = isObj ? item.type : 'amount';
      const v = isObj ? item.value : item;
      const num = parseFloat(String(v || "0")) || 0;
      
      if (type === 'percent') {
        return { display: `${num}%`, val: (basicVal * (num / 100)) };
      }
      return { display: formatCurrency(num, currencyCode, currencyOptions), val: num };
    };

    const other = processVal(data.wages.otherAllowance);
    result["WAGES.OTHER"] = other.display;
    result["WAGES.OTHER_ALLOWANCE"] = other.display;

    let total = basicVal + other.val;

    if (Array.isArray(data.wages.allowances)) {
      data.wages.allowances.forEach((a: any) => {
        if (a.label) {
          const processed = processVal(a);
          const dynamicKey = `WAGES.${a.label.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
          result[dynamicKey] = processed.display;
          total += processed.val;
        }
      });
    }

    if (Array.isArray(data.wages.deductions)) {
      data.wages.deductions.forEach((d: any) => {
        if (d.label) {
          const processed = processVal(d);
          const dynamicKey = `WAGES.DEDUCTION_${d.label.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
          result[dynamicKey] = processed.display;
        }
      });
    }

    result["WAGES.TOTAL"] = formatCurrency(total, currencyCode, currencyOptions);
  }
  
  return result;
}
