// src/lib/seaPlaceholders.static.ts
// Static template data - safe for client components

export const DEFAULT_SEA_SECTIONS = [
  { type: "richtext" as const, order: 0, label: "Agreement Opening",
    content: `<p style="text-align:center"><strong>SEAFARER'S EMPLOYMENT AGREEMENT</strong></p>
<p>This SEA is entered between the Seafarer and Shipowner as defined by the Maritime Labour Convention 2006 (as amended), acting as agents for and on behalf of the Owner of the vessel, Date &amp; Place of signing the SEA: {{contract.signPlace}} – {{contract.signDate}}.</p>
<p><strong>Vessel Owner/Manager:</strong> {{contract.ownerName}}, {{contract.ownerAddress}}</p>` },
  { type: "placeholder_block" as const, order: 1, label: "Seafarer's Details", content: "" },
  { type: "wage_table"         as const, order: 2, label: "Wages",              content: "" },
  { type: "placeholder_block" as const, order: 3, label: "Vessel Details",      content: "" },
  { type: "richtext" as const, order: 4, label: "Terms & Conditions",
    content: `<p><strong>TERMS AND CONDITIONS:</strong></p><p>In General- Seafarer agrees to be employed under the FSUI CBA Applicable to ITF INTERNATIONAL COLLECTIVE BARGAINING AGREEMENT.</p>` },
  { type: "disability_table"  as const, order: 5, label: "Disability Compensation Table", content: "" },
  { type: "richtext" as const, order: 6, label: "Loss of Life / Death",
    content: `<p><strong>LOSS OF LIFE-DEATH IN SERVICE:</strong></p><p>Death in services benefits will be provided to the nominated beneficiary US DOLLARS 114,018. To each dependent child (maximum 4 under the age of 18 US$ 22,805)</p>` },
  { type: "richtext" as const, order: 7, label: "Repatriation",
    content: `<p><strong>REPATRIATION:</strong></p><p>Repatriation shall be provided to all seafarers except where found to be in serious default of employment obligations.</p>
<p><strong>CONFIRMATION OF CONTRACT:</strong></p><p>The seafarer confirms by signing this contract that he has read and fully understood the foregoing terms and conditions in the governing CBA and is freely accepting the same.</p>` },
  { type: "signature_block" as const, order: 8, label: "Signatures", content: "" },
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
