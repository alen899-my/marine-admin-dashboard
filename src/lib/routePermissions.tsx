/**
 * Maps routes to the permission required to access them.
 * Used by middleware for route-level RBAC.
 */
export const routePermissions: Record<string, string> = {


  "/daily-noon-report": "noon.view",
  "/departure-report": "departure.view",
  "/arrival-report": "arrival.view",
  "/nor": "nor.view",

  "/cargo-stowage-cargo-documents": "cargo.view",

  "/vessels": "vessels.view",
  "/voyage": "voyage.view",

  "/manage-users": "users.view",
  "/roles-and-permissions": "roles.view",
  "/permissions": "permission.view",
  "/resources":"resource.view",
  "/manage-companies": "company.view",
  "/voyage-analysis-performance": "voyageanalysis.view",
  "/pre-arrival": "prearrival.view",
  "/job-postings": "jobs.view",
  "/jobs": "candidates.view",
  "/crews": "crews.view",
  "/manage-crews": "crews.view",
  "/contracts": "contracts.view",
  "/contract-vault": "contract.vault.view",
  "/salary": "salary.view",
  "/salary-head": "salary.head.view",
  "/allowance-deduction": "allowance.deduction.view",
  "/payroll": "payroll.view",
  "/settings/about": "settings.manage",
  "/settings/payroll-verification": "settings.manage",
  "/sea-templates": "templates.view",
  "/onboarding":"onboarding.view",
  "/user-guide-management": "userguide.view",
  "/user-guide-groups": "userguide.view"
};
