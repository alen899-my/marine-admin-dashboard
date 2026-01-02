"use client";
import { useState, useEffect } from "react";

export function useFilterPersistence() {
  const [isFilterVisible, setIsFilterVisible] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("commonReportFilterVisible");
      return saved === "true";
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem("commonReportFilterVisible", isFilterVisible.toString());
  }, [isFilterVisible]);

  return { isFilterVisible, setIsFilterVisible };
}