export function getReportTimeWindowFilter(userPermissions: string[]) {
  // If user has this slug, they bypass the restriction
  const canSeeHistory = userPermissions.includes("reports.history.view");

  if (canSeeHistory) return {}; // No time restriction

  // If NO permission, restrict to Today (Morning 12 to Night 12)
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  return {
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  };
}