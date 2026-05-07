"use client";

import { useEffect, useMemo, useState } from "react";

type MasterType = "allowance" | "deduction";

interface MasterOption {
  value: string;
  label: string;
}

interface MasterRecord {
  name?: string;
  code?: string;
}

export function useAllowanceDeductionOptions(type: MasterType, companyId?: string) {
  const [records, setRecords] = useState<MasterRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (companyId !== undefined && !companyId) {
      setRecords([]);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    async function loadOptions() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          limit: "none",
          status: "active",
          type,
        });
        if (companyId) {
          params.set("companyId", companyId);
        }
        const res = await fetch(`/api/allowance-deduction?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load master options");
        const data = await res.json();
        if (!cancelled) {
          setRecords(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) {
          setRecords([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadOptions();

    return () => {
      cancelled = true;
    };
  }, [type, companyId]);

  const options = useMemo<MasterOption[]>(
    () =>
      records
        .map((record) => {
          const name = String(record.name || "").trim();
          if (!name) return null;
          const code = String(record.code || "").trim();

          return {
            value: name,
            label: code ? `${name} (${code})` : name,
          };
        })
        .filter((option): option is MasterOption => Boolean(option)),
    [records],
  );

  return { options, loading };
}
