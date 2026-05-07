type CompanyUploadFolderOptions = {
  companyName?: string | null;
  module: string;
  subfolder?: string | null;
  entityName?: string | null;
};

export function sanitizeFolderSegment(value: string | null | undefined, fallback = "general") {
  const normalized = (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || fallback;
}

function buildTwoDigitSuffix(seed: string | null | undefined) {
  const source = (seed ?? "").trim().toLowerCase() || "company";
  let hash = 0;

  for (const char of source) {
    hash = (hash * 31 + char.charCodeAt(0)) % 100;
  }

  return String(hash).padStart(2, "0");
}

export function buildCompanyUploadFolder({
  companyName,
  module,
  subfolder,
  entityName,
}: CompanyUploadFolderOptions) {
  const companySlug = sanitizeFolderSegment(companyName, "company");
  const companyFolder = `${companySlug}_${buildTwoDigitSuffix(companyName)}`;

  return [companyFolder, module, subfolder, entityName]
    .filter(Boolean)
    .map((segment, index) =>
      index === 0
        ? companyFolder
        : sanitizeFolderSegment(segment as string),
    )
    .join("/");
}
