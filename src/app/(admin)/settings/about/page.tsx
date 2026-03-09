import BuildInfoCard from "@/components/ui/BuildInfoCard";

export default function AboutPage() {
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            System
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            System build details, version info, and database connection status.
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full">
        <BuildInfoCard />
      </div>

    </div>
  );
}