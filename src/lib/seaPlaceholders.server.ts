// src/lib/seaPlaceholders.server.ts
// Server-only - fetches all fields dynamically from Mongoose schemas
import "server-only";
import Application from "@/models/Candidate";
import Vessel from "@/models/Vessel";
import Company from "@/models/Company";
import type { PlaceholderGroup, PlaceholderItem } from "./seaPlaceholders.types";

const NOISE_FIELDS = new Set([
  "_id", "__v", "uploadStatus", "rejectionReason", "uploadedAt", 
  "fileUpdatedAt", "uploadedBy", "fileName", "fileUrl", "deletedAt", 
  "createdAt", "updatedAt", "company", "status", "userId", "submissionToken",
  "formSource", "lastEditedBy", "adminNotes", "assignedTo", "jobId"
]);

const DOCUMENT_FIELDS = new Set([
  "licences", "passports", "seamansBooks", "visas", "endorsements", 
  "stcwCertificates", "otherCertificates", "seaExperience", "extraDocs", "resume"
]);

function toLabel(path: string): string {
  const last = path.split(".").pop() ?? path;
  return last
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function getSchemaPaths(schema: { paths: Record<string, unknown> }): string[] {
  return Object.keys(schema.paths).filter(path => {
    const baseField = path.split(".")[0];
    return !NOISE_FIELDS.has(path) && !NOISE_FIELDS.has(baseField);
  });
}

function createItemsFromPaths(
  paths: string[], 
  prefix: string, 
  modelField: string,
  skipFields?: Set<string>
): PlaceholderItem[] {
  return paths
    .filter(path => !skipFields?.has(path))
    .map(path => ({
      key: `{{${prefix}.${path.replace(/\./g, "_")}}}`,
      label: toLabel(path),
      modelField: `${modelField}.${path}`,
      group: prefix
    }));
}

let _cache: PlaceholderGroup[] | null = null;

export function getPlaceholderGroups(): PlaceholderGroup[] {
  if (_cache) return _cache;

  const appPaths = getSchemaPaths(Application.schema);
  const vesselPaths = getSchemaPaths(Vessel.schema);
  const companyPaths = getSchemaPaths(Company.schema);

  const appItems = createItemsFromPaths(appPaths, "application", "application");
  const vesselItems = createItemsFromPaths(vesselPaths, "vessel", "vessel");
  const companyItems = createItemsFromPaths(companyPaths, "company", "company");

  const contractItems: PlaceholderItem[] = [
    { key: "{{contract.portOfJoining}}", label: "Port of Joining", modelField: "contract.portOfJoining", group: "contract", example: "MUMBAI" },
    { key: "{{contract.commencementDate}}", label: "Commencement Date", modelField: "contract.commencementDate", group: "contract", example: "01-01-2026" },
    { key: "{{contract.contractPeriod}}", label: "Contract Period", modelField: "contract.contractPeriod", group: "contract", example: "2(+/-1) MONTH" },
    { key: "{{contract.signDate}}", label: "SEA Sign Date", modelField: "contract.signDate", group: "contract", example: "01-01-2026" },
    { key: "{{contract.signPlace}}", label: "SEA Sign Place", modelField: "contract.signPlace", group: "contract", example: "MUMBAI" },
    { key: "{{contract.ownerName}}", label: "Vessel Owner Name", modelField: "contract.ownerName", group: "contract", example: "AJR MARINES" },
    { key: "{{contract.ownerAddress}}", label: "Vessel Owner Address", modelField: "contract.ownerAddress", group: "contract", example: "Address here" },
    { key: "{{contract.referenceNo}}", label: "Document Reference No.", modelField: "contract.referenceNo", group: "contract", example: "REF-001" },
    { key: "{{contract.docDate}}", label: "Document Date", modelField: "contract.docDate", group: "contract", example: "01-01-2026" },
  ];

  const wageItems: PlaceholderItem[] = [
    { key: "{{wages.currency}}", label: "Currency", modelField: "company.currency", group: "wages", example: "USD" },
    { key: "{{wages.basic}}", label: "Basic Wages", modelField: "contract.wageBasic", group: "wages", example: "$4,180" },
    { key: "{{wages.total}}", label: "Total Wages", modelField: "contract.wageTotal", group: "wages", example: "$9,500" },
  ];

  const templateItems: PlaceholderItem[] = [
    { key: "{{template.logoUrl}}", label: "Logo URL", modelField: "template.logoUrl", group: "template", example: "logo.png" },
    { key: "{{template.headerAddress}}", label: "Header Address", modelField: "template.headerAddress", group: "template", example: "Office No. 404..." },
    { key: "{{template.footerText}}", label: "Footer Text", modelField: "template.footerText", group: "template", example: "info@company.com" },
    { key: "{{template.companyName}}", label: "Company Name", modelField: "template.companyName", group: "template", example: "ABC Shipping" },
  ];

  _cache = [
    { group: "Application / Seafarer", icon: "👤", items: appItems },
    { group: "Vessel Details", icon: "🚢", items: vesselItems },
    { group: "Company", icon: "🏢", items: companyItems },
    { group: "Contract Terms", icon: "📋", items: contractItems },
    { group: "Wages", icon: "💵", items: wageItems },
    { group: "Template", icon: "📄", items: templateItems },
  ].filter(g => g.items.length > 0);

  return _cache;
}

export function getAllPlaceholderItems(): PlaceholderItem[] {
  return getPlaceholderGroups().flatMap(g => g.items);
}

export type { PlaceholderGroup, PlaceholderItem };
