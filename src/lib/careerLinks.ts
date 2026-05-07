export function buildCompanyCareersPath(companyId: string) {
  return `/careers/company/${companyId}`;
}

export function buildCompanyCareerJobPath(companyId: string, jobId: string) {
  return `/careers/company/${companyId}/jobs/${jobId}`;
}
