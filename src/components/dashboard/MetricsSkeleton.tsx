import { User } from "next-auth"; // Ensure this matches your types location

export function MetricsSkeleton({ user }: { user: User }) {
  // Replicate Authorization Logic locally for the skeleton
  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const permissions = new Set(user.permissions || []);

  const can = (permission: string) => {
    if (isSuperAdmin) return true;
    return permissions.has(permission);
  };

  const hasFleetAccess =
    can("stats.vessels") ||
    can("stats.activecrew") ||
    can("stats.candidates") ||
    can("stats.activecontracts");

  const hasOpsAccess =
    can("stats.voyages") ||
    can("stats.noon") ||
    can("stats.departure") ||
    can("stats.arrival") ||
    can("stats.nor") ||
    can("stats.cargo_stowage") ||
    can("stats.cargo_docs");

  const hasAdminAccess =
    can("stats.openpayrolls") ||
    can("stats.pendingleaves") ||
    can("stats.users") ||
    can("stats.companies");

  return (
    <div className="space-y-8 w-full max-w-full animate-pulse">
      {/* --- Section 1: Fleet & HR Skeleton --- */}
      {hasFleetAccess && (
        <div>
          <div className="h-4 w-40 mb-4 ml-1 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {can("stats.vessels") && <SkeletonCard />}
            {can("stats.activecrew") && <SkeletonCard />}
            {can("stats.candidates") && <SkeletonCard />}
            {can("stats.activecontracts") && <SkeletonCard />}
          </div>
        </div>
      )}

      {/* --- Section 2: Operations & Voyages Skeleton --- */}
      {hasOpsAccess && (
        <div>
          <div className="h-4 w-56 mb-4 ml-1 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {can("stats.voyages") && <SkeletonCard />}
            {can("stats.noon") && <SkeletonCard />}
            {can("stats.departure") && <SkeletonCard />}
            {can("stats.arrival") && <SkeletonCard />}
            {can("stats.nor") && <SkeletonCard />}
            {can("stats.cargo_stowage") && <SkeletonCard />}
            {can("stats.cargo_docs") && <SkeletonCard />}
          </div>
        </div>
      )}

      {/* --- Section 3: Administrative Skeleton --- */}
      {hasAdminAccess && (
        <div>
          <div className="h-4 w-40 mb-4 ml-1 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {can("stats.openpayrolls") && <SkeletonCard />}
            {can("stats.pendingleaves") && <SkeletonCard />}
            {can("stats.users") && <SkeletonCard />}
            {can("stats.companies") && <SkeletonCard />}
          </div>
        </div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex flex-col justify-between min-w-0 w-full rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Top row: icon + title + dots */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-gray-200 dark:bg-gray-800 shrink-0" />
          <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-800 mt-1" />
        </div>
        <div className="flex gap-[3px] mt-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-[3.5px] h-[3.5px] rounded-full bg-gray-300 dark:bg-gray-700" />
          ))}
        </div>
      </div>

      {/* Large number */}
      <div className="h-8 w-16 rounded bg-gray-200 dark:bg-gray-800 mt-4" />

      {/* Bottom row: trend + sparkline */}
      <div className="flex items-end justify-between mt-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-10 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-800" />
        </div>
        <div className="h-[38px] w-24 rounded bg-gray-100 dark:bg-gray-800/50" />
      </div>
    </div>
  );
}
