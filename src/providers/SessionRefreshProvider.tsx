"use client";

import { useEffect } from "react";
import { getSession } from "next-auth/react";

export default function SessionRefreshProvider() {
  useEffect(() => {
    const interval = setInterval(() => {
      getSession(); // silent refresh
    }, 5000); // every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return null;
}
