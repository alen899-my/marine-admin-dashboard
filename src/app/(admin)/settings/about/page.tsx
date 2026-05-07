import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { authorizeRequest } from "@/lib/authorizeRequest";
import BuildInfoCard from "@/components/ui/BuildInfoCard";
import BackupCard from "@/components/ui/BackupCard";

export default async function AboutPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const authz = await authorizeRequest("settings.manage");
  if (!authz.ok) {
    return <div>Access Denied</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            System
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            System build details, version info, database connection status,
            and backup management.
          </p>
        </div>
      </div>

      <div className="w-full">
        <BuildInfoCard />
      </div>

      <div className="w-full">
        <BackupCard />
      </div>
    </div>
  );
}
