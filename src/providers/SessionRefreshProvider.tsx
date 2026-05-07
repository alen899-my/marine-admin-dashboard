"use client";

import { useEffect } from "react";
import { signOut, useSession } from "next-auth/react";

export default function SessionRefreshProvider() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/session?t=${Date.now()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache, no-store" },
        });

        const session = await res.json();

        if (!session?.user) {
          clearInterval(interval);
          await signOut({ redirect: false });
          window.location.href = "/signin";
        }
      } catch (err) {
        console.error("Session check failed:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [status]);

  return null;
}