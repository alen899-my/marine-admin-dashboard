import { User } from "next-auth"; // Ensure this matches your types location

export function MetricsSkeleton({ user }: { user: User }) {
  // 1. Replicate Authorization Logic locally for the skeleton
  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const permissions = new Set(user.permissions || []);

  const can = (permission: string) => {
    if (isSuperAdmin) return true;
    return permissions.has(permission);
  };

  const hasFleetAccess =
    can("stats.vessels") ||
    can("stats.voyages") ||
    can("stats.users") ||
    can("stats.companies");

  const hasOpsAccess =
    can("stats.noon") ||
    can("stats.departure") ||
    can("stats.arrival") ||
    can("stats.nor") ||
    can("stats.cargo_stowage") ||
    can("stats.cargo_docs");

  return (
    <div className="space-y-8 w-full max-w-full animate-pulse">
      {/* --- Section 1: Fleet & Management Skeleton --- */}
      {hasFleetAccess && (
        <div>
          {/* Header Skeleton */}
          <div className="h-4 w-40 mb-4 ml-1 rounded bg-gray-200 dark:bg-gray-800" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {can("stats.vessels") && <SkeletonCard />}
            {can("stats.voyages") && <SkeletonCard />}
            {can("stats.users") && <SkeletonCard />}
            {can("stats.companies") && <SkeletonCard />}
          </div>
        </div>
      )}

      {/* --- Section 2: Operational Reports Skeleton --- */}
      {hasOpsAccess && (
        <div>
          {/* Header Skeleton */}
          <div className="h-4 w-48 mb-4 ml-1 rounded bg-gray-200 dark:bg-gray-800" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6">
            {can("stats.noon") && <SkeletonCard />}
            {can("stats.departure") && <SkeletonCard />}
            {can("stats.arrival") && <SkeletonCard />}
            {can("stats.nor") && <SkeletonCard />}
            {can("stats.cargo_stowage") && <SkeletonCard />}
            {can("stats.cargo_docs") && <SkeletonCard />}
          </div>
        </div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="block min-w-0 w-full rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-800" />
      <div className="flex flex-col mt-5">
        <div className="h-5 w-24 rounded bg-gray-200 dark:bg-gray-800 mb-2" />
        <div className="h-8 w-16 rounded bg-gray-200 dark:bg-gray-800" />
      </div>
    </div>
  );
}