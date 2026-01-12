import { useState, useEffect } from "react";

export function useVoyageLogic(vesselId: string | undefined, reportDate: string | undefined) {
  const [suggestedVoyageNo, setSuggestedVoyageNo] = useState<string>("");

  useEffect(() => {
    // Stop if missing data
    if (!vesselId || !reportDate) {
      setSuggestedVoyageNo(""); 
      return;
    }

    const controller = new AbortController();

    async function lookup() {
      try {
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

  return { suggestedVoyageNo };
}