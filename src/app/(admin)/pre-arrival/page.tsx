// /app/(admin)/pre-arrival/page.tsx
import { authorizeRequest } from "@/lib/authorizeRequest";
import { getPreArrivalData } from "@/lib/services/preArrivalService";
import PreArrivalClient from "./PreArrivalClient";
import { redirect } from "next/navigation";
export default async function PreArrivalManagement() {
  // 1. Authorize on Server
const authz = await authorizeRequest("prearrival.view");
if (!authz.ok || !authz.session) {
    redirect("/login"); 
    // Alternatively, you could return: <div>You are not authorized to view this page.</div>
  }

  // 2. Direct DB Call (No internal HTTP request!)
  const initialData = await getPreArrivalData({
    user: authz.session.user,
    init: true,
    page: 1,
    limit: 10
  });

  // 3. Render Client Component with Hydrated Data
  return (
    <PreArrivalClient
      initialRequests={JSON.parse(JSON.stringify(initialData.data))}
      initialVessels={JSON.parse(JSON.stringify(initialData.vessels))}
      initialVoyages={JSON.parse(JSON.stringify(initialData.voyages))}
      initialTotalPages={initialData.pagination.totalPages}
      user={authz.session.user}
    />
  );
}