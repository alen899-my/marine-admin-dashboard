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
  "/voyage-analysis-performance": "voyageanalysis.view"
};
