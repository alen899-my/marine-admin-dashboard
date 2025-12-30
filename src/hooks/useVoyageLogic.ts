// src/hooks/useVoyageLogic.ts
import { useState, useEffect, useRef } from "react";

interface VesselOption {
  _id: string;
  name: string;
}

export function useVoyageLogic(vesselId: string | undefined, reportDate: string | undefined) {
  const [vessels, setVessels] = useState<VesselOption[]>([]);
  const [suggestedVoyageNo, setSuggestedVoyageNo] = useState<string>("");
    

  const isFirstRun = useRef(true);

  // 1. Fetch Vessels List (Optimized)
  useEffect(() => {
    async function loadVessels() {
      try {
        const res = await fetch("/api/vessels?all=true");
        if (res.ok) {
          const result = await res.json();
          setVessels(Array.isArray(result) ? result : result.data || []);
        }
      } catch (err) {
        console.error("Failed to load vessels", err);
      }
    }
    loadVessels();
  }, []);

  useEffect(() => {
    // Stop if missing data
    if (!vesselId || !reportDate) {
      setSuggestedVoyageNo(""); 
      return;
    }

    const controller = new AbortController();

    async function lookup() {
      try {
        // ✅ FIX: Manually build the object or ensure string types
        const params = new URLSearchParams({
          vesselId: vesselId || "", 
          date: reportDate || ""
        });

        const res = await fetch(`/api/voyages/lookup?${params}`, {
          signal: controller.signal,
        });

        if (res.ok) {
          const data = await res.json();
          setSuggestedVoyageNo(data.voyageNo || "");
          
        }
      } catch (error: any) {
        if (error.name !== "AbortError") console.error(error);
      }
    }

    lookup();
    return () => controller.abort();
  }, [vesselId, reportDate]);
  return { vessels, suggestedVoyageNo };
}