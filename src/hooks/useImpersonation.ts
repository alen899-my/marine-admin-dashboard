import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

export function useImpersonation() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isImpersonating = session?.impersonation?.active === true;
  const isSuperAdmin =
    !isImpersonating && session?.user?.role?.toLowerCase() === "super-admin";

  async function startImpersonation(targetUserId: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to switch user");
        return;
      }

      // Inject impersonation data into the JWT via update()
      await update({ impersonation: data.impersonation });

      toast.success(`Switched to ${data.impersonation.targetFullName}`);
      router.push("/"); // redirect to a neutral page
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function stopImpersonation() {
    setLoading(true);
    try {
      await fetch("/api/admin/impersonate", { method: "DELETE" });

      // Clear the impersonation snapshot from the JWT
      await update({ impersonation: null });

      toast.success("Switched back to your account");
      router.push("/manage-users");
      router.refresh();
    } catch {
      toast.error("Failed to switch back");
    } finally {
      setLoading(false);
    }
  }

  return { isImpersonating, isSuperAdmin, loading, startImpersonation, stopImpersonation };
}
