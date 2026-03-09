"use client";

import { useEffect, useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import {
  Activity,
  Box,
  Calendar,
  CheckCircle,
  Database,
  FileText,
  GitBranch,
  GitCommit,
  Globe,
  Loader2,
  Server,
  XCircle,
} from "lucide-react";

interface DbInfo {
  status: string;
  name: string;
  driver: string;
}

export default function BuildInfoCard() {
  const [dbInfo, setDbInfo] = useState<DbInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/system/build-info")
      .then((r) => r.json())
      .then((data) => {
        if (data.db) setDbInfo(data.db);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const version = process.env.NEXT_PUBLIC_APP_VERSION;
  const description = process.env.NEXT_PUBLIC_APP_DESCRIPTION;
  const commit = process.env.NEXT_PUBLIC_GIT_COMMIT;
  const branch = process.env.NEXT_PUBLIC_GIT_BRANCH;
  const buildDate = process.env.NEXT_PUBLIC_BUILD_DATE;
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV;

  const envColor: Record<string, string> = {
    production: "text-green-500",
    development: "text-yellow-500",
    test: "text-blue-500",
  };

  const dbStatusColor =
    dbInfo?.status === "Connected" ? "text-green-500" : "text-red-500";
  const DbStatusIcon =
    dbInfo?.status === "Connected" ? CheckCircle : XCircle;

  const renderRow = (row: {
    icon: React.ReactNode;
    label: string;
    value: string;
    valueClass?: string;
  }) => (
    <div
      key={row.label}
      className="flex items-center justify-between py-2"
    >
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
        {row.icon}
        <span className="text-[11px] font-medium uppercase tracking-wider">
          {row.label}
        </span>
      </div>
      <span
        className={`text-[12px] font-mono font-medium ${
          row.valueClass || "text-gray-800 dark:text-gray-200"
        }`}
      >
        {row.value}
      </span>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      {/* ── Application Card ── */}
      <ComponentCard
        title={
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-500" />
            <span className="text-gray-800 dark:text-white/90">
              Application
            </span>
          </div>
        }
      >
        <div className="divide-y divide-gray-100 dark:divide-white/5">
          {[
            {
              icon: <Box className="w-3.5 h-3.5 text-brand-400" />,
              label: "Version",
              value: version ? `v${version}` : "—",
            },
            {
              icon: <FileText className="w-3.5 h-3.5 text-gray-400" />,
              label: "Description",
              value: description || "—",
            },
            {
              icon: <Globe className="w-3.5 h-3.5 text-cyan-400" />,
              label: "Environment",
              value: appEnv
                ? appEnv.charAt(0).toUpperCase() + appEnv.slice(1)
                : "—",
              valueClass: envColor[appEnv || ""] || "text-gray-300",
            },
          ].map(renderRow)}
        </div>
      </ComponentCard>

      {/* ── Build Card ── */}
      <ComponentCard
        title={
          <div className="flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-purple-500" />
            <span className="text-gray-800 dark:text-white/90">
              Build
            </span>
          </div>
        }
      >
        <div className="divide-y divide-gray-100 dark:divide-white/5">
          {[
            {
              icon: <GitCommit className="w-3.5 h-3.5 text-purple-400" />,
              label: "Commit",
              value: commit || "—",
            },
            {
              icon: <GitBranch className="w-3.5 h-3.5 text-blue-400" />,
              label: "Branch",
              value: branch || "—",
            },
            {
              icon: <Calendar className="w-3.5 h-3.5 text-orange-400" />,
              label: "Build Date",
              value: buildDate || "—",
            },
          ].map(renderRow)}
        </div>
      </ComponentCard>

      {/* ── Database Card ── */}
      <ComponentCard
        title={
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-500" />
            <span className="text-gray-800 dark:text-white/90">
              Database
            </span>
          </div>
        }
      >
        {loading ? (
          <div className="flex items-center gap-2 py-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
            <span className="text-[11px] text-gray-400">
              Fetching DB info...
            </span>
          </div>
        ) : dbInfo ? (
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {[
              {
                icon: (
                  <DbStatusIcon className={`w-3.5 h-3.5 ${dbStatusColor}`} />
                ),
                label: "Status",
                value: dbInfo.status,
                valueClass: dbStatusColor,
              },
              {
                icon: <Database className="w-3.5 h-3.5 text-emerald-400" />,
                label: "Database",
                value: dbInfo.name,
              },
              {
                icon: <Box className="w-3.5 h-3.5 text-gray-400" />,
                label: "Driver",
                value: dbInfo.driver,
              },
            ].map(renderRow)}
          </div>
        ) : (
          <p className="text-[11px] text-red-400 italic">
            Failed to load DB info
          </p>
        )}
      </ComponentCard>

    </div>
  );
}