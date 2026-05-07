// src/lib/defaultTemplateSections.ts
// Professional maritime contract section structures and default content.

export interface TableColumn {
  key: string;
  label: string;
}

export interface TemplateSection {
  id: string;
  key?: string; // Legacy support
  title: string;
  content: string;
  enabled: boolean;
  order: number;
  type?: "richtext" | "seafarer_table" | "vessel_table" | "wage_table" | "disability_table" | "signature_block";
  columns?: TableColumn[];
}

export const DEFAULT_TEMPLATE_SECTIONS: TemplateSection[] = [
  {
    id: "opening",
    title: "",
    order: 0,
    enabled: true,
    content: `<p>This SEA is entered between the Seafarer and Shipowner as defined by the [MLC.REFERENCE], acting as agents for and on behalf of the Owner of the vessel, Date & Place of signing the SEA: [CONTRACT.PLACE] – [CONTRACT.DATE].</p>`,
    type: "richtext"
  },
  {
    id: "seafarer_details",
    title: "SEAFARER'S DETAILS",
    order: 1,
    enabled: true,
    content: "",
    type: "seafarer_table",
    columns: [
      { key: "[CANDIDATE.FULL_NAME]", label: "Full Name" },
      { key: "[CANDIDATE.DOB]", label: "Date of Birth" },
      { key: "[CANDIDATE.NATIONALITY]", label: "Nationality" },
      { key: "[CANDIDATE.POB]", label: "Place of Birth" },
      { key: "[CANDIDATE.PASSPORT_NO]", label: "Passport No" },
      { key: "[CANDIDATE.CDC_NO]", label: "CDC No" },
      { key: "[CANDIDATE.RANK]", label: "Rank" },
      { key: "[CANDIDATE.CELL]", label: "Phone Number" }
    ]
  },
  {
    id: "vessel",
    title: "VESSEL DETAILS",
    order: 2,
    enabled: true,
    content: "",
    type: "vessel_table",
    columns: [
      { key: "[VESSEL.NAME]", label: "Vessel Name" },
      { key: "[CONTRACT.JOINING_PORT]", label: "Port of Joining" },
      { key: "[VESSEL.FLAG]", label: "Flag" },
      { key: "[CONTRACT.COMMENCEMENT]", label: "Commencement" },
      { key: "[VESSEL.IMO]", label: "IMO No" },
      { key: "[CONTRACT.PERIOD]", label: "Contract Period" }
    ]
  },
  {
    id: "wages",
    title: "WAGES",
    order: 3,
    enabled: true,
    content: "",
    type: "wage_table",
    columns: [
      { key: "[WAGES.CURRENCY]", label: "Currency" },
      { key: "[WAGES.BASIC]", label: "Basic Wages" },
      { key: "[WAGES.OTHER]", label: "Other Allowance" },
      { key: "[WAGES.TOTAL]", label: "Total" },
    ]
  },
  {
    id: "terms",
    title: "TERMS AND CONDITIONS",
    order: 4,
    enabled: true,
    content: `<p>In General- Seafarer agrees to be employed under the [CBA.REFERENCE].</p>`,
    type: "richtext"
  },
  {
    id: "disability",
    title: "DISABILITY COMPENSATION TABLE",
    order: 5,
    enabled: true,
    content: "",
    type: "disability_table"
  },
  {
    id: "loss_of_life",
    title: "LOSS OF LIFE-DEATH IN SERVICE",
    order: 6,
    enabled: true,
    content: `<p>Death in services benefits will be provided to the nominated beneficiary US DOLLARS [BENEFIT.DEATH]. To each dependent child (maximum [BENEFIT.MAX_DEPENDENTS] under the age of [BENEFIT.AGE_LIMIT] US$ [BENEFIT.DEPENDENT])</p>`,
    type: "richtext"
  },
  {
    id: "signatures",
    title: "",
    order: 7,
    enabled: true,
    content: "",
    type: "signature_block"
  }
];

export const DISABILITY_TABLE = [
  { percentage: 100, ratings: 114018, juniorOfficers: 144015, seniorOfficers: 180018 },
  { percentage: 75,  ratings: 85512,  juniorOfficers: 108012, seniorOfficers: 135013 },
  { percentage: 60,  ratings: 68411,  juniorOfficers: 86409,  seniorOfficers: 108012 },
  { percentage: 50,  ratings: 57009,  juniorOfficers: 72008,  seniorOfficers: 90010  },
  { percentage: 40,  ratings: 45607,  juniorOfficers: 57607,  seniorOfficers: 72008  },
  { percentage: 30,  ratings: 34206,  juniorOfficers: 43204,  seniorOfficers: 54006  },
  { percentage: 20,  ratings: 22805,  juniorOfficers: 28803,  seniorOfficers: 36006  },
  { percentage: 10,  ratings: 11403,  juniorOfficers: 14402,  seniorOfficers: 18002  },
];
